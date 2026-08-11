-- BetterCallQ — Pilot slot riservati
-- Persistenza prenotazioni, protezione atomica dalle sovrapposizioni e coda
-- delle operazioni da riportare manualmente su Treatwell.

create extension if not exists btree_gist;

create type public.booking_status as enum (
  'pending',
  'confirmed',
  'cancelled',
  'failed'
);

create type public.treatwell_sync_status as enum (
  'none',
  'to_sync',
  'synced',
  'update_required',
  'cancellation_required'
);

create type public.booking_channel as enum (
  'vapi',
  'api',
  'dashboard'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null
    references public.salons(id)
    on delete cascade,
  customer_name text not null
    check (length(btrim(customer_name)) between 1 and 160),
  customer_phone text
    check (
      customer_phone is null
      or customer_phone ~ '^\+[1-9][0-9]{7,14}$'
    ),
  service_code text not null
    check (service_code ~ '^[a-z0-9_]+$'),
  service_name text not null
    check (length(btrim(service_name)) between 1 and 160),
  duration_minutes integer not null
    check (duration_minutes > 0 and duration_minutes <= 720),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'pending',
  treatwell_status public.treatwell_sync_status not null default 'none',
  google_calendar_event_id text,
  channel public.booking_channel not null default 'vapi',
  idempotency_key text not null
    check (length(btrim(idempotency_key)) between 1 and 250),
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (salon_id, idempotency_key)
);

alter table public.bookings
add constraint bookings_no_active_overlap
exclude using gist (
  salon_id with =,
  tstzrange(starts_at, ends_at, '[)') with &&
)
where (status in ('pending', 'confirmed'));

create index bookings_treatwell_queue_idx
  on public.bookings (salon_id, treatwell_status, starts_at)
  where treatwell_status in (
    'to_sync',
    'update_required',
    'cancellation_required'
  );

create index bookings_customer_phone_idx
  on public.bookings (salon_id, customer_phone, starts_at desc)
  where customer_phone is not null;

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

create policy bookings_select_accessible
on public.bookings
for select
to authenticated
using (
  (select private.is_platform_admin())
  or salon_id = any(
    array(select private.current_user_salon_ids())
  )
);

revoke all on public.bookings from anon, authenticated;
grant select (
  id,
  salon_id,
  customer_name,
  customer_phone,
  service_code,
  service_name,
  duration_minutes,
  starts_at,
  ends_at,
  status,
  treatwell_status,
  google_calendar_event_id,
  channel,
  created_at,
  updated_at
)
on public.bookings
to authenticated;

grant all on public.bookings to service_role;

create or replace function public.claim_reserved_booking(
  p_salon_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_service_code text,
  p_service_name text,
  p_duration_minutes integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_channel public.booking_channel,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select bookings.*
  into v_booking
  from public.bookings as bookings
  where bookings.salon_id = p_salon_id
    and bookings.idempotency_key = p_idempotency_key;

  if v_booking.id is not null then
    return jsonb_build_object(
      'result', 'duplicate',
      'booking', to_jsonb(v_booking)
    );
  end if;

  begin
    insert into public.bookings (
      salon_id,
      customer_name,
      customer_phone,
      service_code,
      service_name,
      duration_minutes,
      starts_at,
      ends_at,
      status,
      treatwell_status,
      channel,
      idempotency_key
    )
    values (
      p_salon_id,
      btrim(p_customer_name),
      nullif(btrim(p_customer_phone), ''),
      p_service_code,
      btrim(p_service_name),
      p_duration_minutes,
      p_starts_at,
      p_ends_at,
      'pending',
      'none',
      p_channel,
      p_idempotency_key
    )
    returning * into v_booking;
  exception
    when exclusion_violation then
      return jsonb_build_object('result', 'conflict');
    when unique_violation then
      select bookings.*
      into v_booking
      from public.bookings as bookings
      where bookings.salon_id = p_salon_id
        and bookings.idempotency_key = p_idempotency_key;
      return jsonb_build_object(
        'result', 'duplicate',
        'booking', to_jsonb(v_booking)
      );
  end;

  return jsonb_build_object(
    'result', 'claimed',
    'booking', to_jsonb(v_booking)
  );
end;
$$;

create or replace function public.confirm_reserved_booking(
  p_booking_id uuid,
  p_google_calendar_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
begin
  update public.bookings
  set
    status = 'confirmed',
    treatwell_status = 'to_sync',
    google_calendar_event_id = p_google_calendar_event_id,
    failure_reason = null
  where id = p_booking_id
    and status = 'pending'
  returning * into v_booking;

  if v_booking.id is null then
    select bookings.* into v_booking
    from public.bookings as bookings
    where bookings.id = p_booking_id;

    if v_booking.status = 'confirmed' then
      return jsonb_build_object('result', 'duplicate', 'booking', to_jsonb(v_booking));
    end if;
    raise exception 'Prenotazione non confermabile: %', p_booking_id;
  end if;

  return jsonb_build_object('result', 'confirmed', 'booking', to_jsonb(v_booking));
end;
$$;

create or replace function public.fail_reserved_booking(
  p_booking_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
begin
  update public.bookings
  set
    status = 'failed',
    treatwell_status = 'none',
    failure_reason = left(p_reason, 500)
  where id = p_booking_id
    and status = 'pending'
  returning * into v_booking;

  return jsonb_build_object(
    'result', case when v_booking.id is null then 'not_changed' else 'failed' end,
    'booking', case when v_booking.id is null then null else to_jsonb(v_booking) end
  );
end;
$$;

create or replace function public.get_reserved_booking_for_service(
  p_booking_id uuid,
  p_salon_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select jsonb_build_object('result', 'found', 'booking', to_jsonb(bookings))
      from public.bookings as bookings
      where bookings.id = p_booking_id
        and bookings.salon_id = p_salon_id
    ),
    jsonb_build_object('result', 'not_found')
  );
$$;

create or replace function public.find_reserved_bookings_by_phone(
  p_salon_id uuid,
  p_customer_phone text
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'result', 'ok',
    'bookings', coalesce(jsonb_agg(to_jsonb(results) order by results.starts_at), '[]'::jsonb)
  )
  from (
    select bookings.*
    from public.bookings as bookings
    where bookings.salon_id = p_salon_id
      and bookings.customer_phone = p_customer_phone
      and bookings.status = 'confirmed'
      and bookings.ends_at >= now()
    order by bookings.starts_at
    limit 20
  ) as results;
$$;

create or replace function public.cancel_reserved_booking(
  p_booking_id uuid,
  p_salon_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select bookings.* into v_booking
  from public.bookings as bookings
  where bookings.id = p_booking_id
    and bookings.salon_id = p_salon_id
  for update;

  if v_booking.id is null then
    return jsonb_build_object('result', 'not_found');
  end if;
  if v_booking.status = 'cancelled' then
    return jsonb_build_object('result', 'duplicate', 'booking', to_jsonb(v_booking));
  end if;

  update public.bookings
  set
    status = 'cancelled',
    treatwell_status = case
      when v_booking.treatwell_status in ('synced', 'update_required')
        then 'cancellation_required'::public.treatwell_sync_status
      else 'none'::public.treatwell_sync_status
    end
  where id = p_booking_id
  returning * into v_booking;

  return jsonb_build_object('result', 'cancelled', 'booking', to_jsonb(v_booking));
end;
$$;

create or replace function public.complete_treatwell_operation(
  p_booking_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_allowed boolean;
begin
  select
    private.is_platform_admin()
    or exists (
      select 1
      from public.salon_memberships as memberships
      join public.bookings as bookings
        on bookings.salon_id = memberships.salon_id
      where bookings.id = p_booking_id
        and memberships.user_id = (select auth.uid())
        and memberships.status = 'active'
        and memberships.role in ('owner', 'manager', 'support')
    )
  into v_allowed;

  if not coalesce(v_allowed, false) then
    raise exception 'Operazione non autorizzata';
  end if;

  update public.bookings
  set treatwell_status = case
    when treatwell_status = 'cancellation_required'
      then 'none'::public.treatwell_sync_status
    else 'synced'::public.treatwell_sync_status
  end
  where id = p_booking_id
    and treatwell_status in ('to_sync', 'update_required', 'cancellation_required')
  returning * into v_booking;

  if v_booking.id is null then
    raise exception 'Operazione Treatwell non trovata o già completata';
  end if;

  return jsonb_build_object('result', 'completed', 'booking', to_jsonb(v_booking));
end;
$$;

revoke all on function public.claim_reserved_booking(uuid, text, text, text, text, integer, timestamptz, timestamptz, public.booking_channel, text) from public, anon, authenticated;
revoke all on function public.confirm_reserved_booking(uuid, text) from public, anon, authenticated;
revoke all on function public.fail_reserved_booking(uuid, text) from public, anon, authenticated;
revoke all on function public.get_reserved_booking_for_service(uuid, uuid) from public, anon, authenticated;
revoke all on function public.find_reserved_bookings_by_phone(uuid, text) from public, anon, authenticated;
revoke all on function public.cancel_reserved_booking(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_treatwell_operation(uuid) from public, anon;

grant execute on function public.claim_reserved_booking(uuid, text, text, text, text, integer, timestamptz, timestamptz, public.booking_channel, text) to service_role;
grant execute on function public.confirm_reserved_booking(uuid, text) to service_role;
grant execute on function public.fail_reserved_booking(uuid, text) to service_role;
grant execute on function public.get_reserved_booking_for_service(uuid, uuid) to service_role;
grant execute on function public.find_reserved_bookings_by_phone(uuid, text) to service_role;
grant execute on function public.cancel_reserved_booking(uuid, uuid) to service_role;
grant execute on function public.complete_treatwell_operation(uuid) to authenticated;
