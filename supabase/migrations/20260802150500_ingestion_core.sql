-- BetterCallQ — Task 8C.5
-- Nucleo di ingestione idempotente per Vapi e WhatsApp.
--
-- Le funzioni sono riservate a service_role e non costituiscono endpoint
-- pubblici. Il server webhook deve validare firma e autenticità del provider
-- prima di invocarle.

create type public.external_event_provider as enum (
  'vapi',
  'whatsapp',
  'booking_provider'
);

create type public.external_event_status as enum (
  'received',
  'processed',
  'failed',
  'ignored'
);

create table public.external_events (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null
    references public.salons(id)
    on delete cascade,
  provider public.external_event_provider not null,
  external_event_id text not null
    check (length(btrim(external_event_id)) > 0),
  event_type text not null
    check (length(btrim(event_type)) > 0),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status public.external_event_status not null default 'received',
  correlation_id text not null
    check (length(btrim(correlation_id)) > 0),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, provider, external_event_id)
);

create index external_events_salon_received_at_idx
  on public.external_events (
    salon_id,
    received_at desc
  );

create trigger external_events_set_updated_at
before update on public.external_events
for each row execute function public.set_updated_at();

alter table public.external_events enable row level security;

revoke all
  on public.external_events
  from anon, authenticated;

grant all
  on public.external_events
  to service_role;

create or replace function private.refresh_voice_usage(
  p_salon_id uuid,
  p_event_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_timezone text;
  v_local_date date;
  v_period_start date;
  v_period_end date;
  v_subscription_id uuid;
  v_included_minutes integer;
  v_usage_period_id uuid;
begin
  select salons.timezone
  into v_timezone
  from public.salons as salons
  where salons.id = p_salon_id
    and salons.status in ('trial', 'active');

  if v_timezone is null then
    raise exception 'Salone non disponibile: %', p_salon_id;
  end if;

  v_local_date := (
    p_event_at at time zone v_timezone
  )::date;

  v_period_start := date_trunc(
    'month',
    v_local_date::timestamp
  )::date;

  v_period_end := (
    v_period_start + interval '1 month - 1 day'
  )::date;

  select
    subscriptions.id,
    coalesce(
      subscriptions.custom_included_voice_minutes,
      plans.included_voice_minutes
    )
  into
    v_subscription_id,
    v_included_minutes
  from public.salon_subscriptions as subscriptions
  join public.subscription_plans as plans
    on plans.id = subscriptions.plan_id
   and plans.active = true
  where subscriptions.salon_id = p_salon_id
    and subscriptions.status = 'active'
    and subscriptions.starts_on <= v_local_date
    and (
      subscriptions.ends_on is null
      or subscriptions.ends_on >= v_local_date
    )
  order by subscriptions.starts_on desc
  limit 1;

  if v_subscription_id is null then
    raise exception
      'Nessun abbonamento attivo per il salone % alla data %',
      p_salon_id,
      v_local_date;
  end if;

  insert into public.usage_periods (
    salon_id,
    subscription_id,
    period_start,
    period_end,
    included_voice_minutes,
    used_voice_seconds,
    calculated_at
  )
  values (
    p_salon_id,
    v_subscription_id,
    v_period_start,
    v_period_end,
    v_included_minutes,
    0,
    now()
  )
  on conflict (
    salon_id,
    period_start,
    period_end
  )
  do update set
    subscription_id = excluded.subscription_id,
    included_voice_minutes =
      excluded.included_voice_minutes,
    calculated_at = now()
  returning id into v_usage_period_id;

  update public.usage_periods as periods
  set
    used_voice_seconds = coalesce(
      (
        select sum(calls.duration_seconds)::bigint
        from public.calls as calls
        where calls.salon_id = p_salon_id
          and calls.duration_seconds is not null
          and (
            calls.started_at at time zone v_timezone
          )::date between v_period_start and v_period_end
      ),
      0
    ),
    calculated_at = now()
  where periods.id = v_usage_period_id;

  return v_usage_period_id;
end;
$$;

revoke all
  on function private.refresh_voice_usage(
    uuid,
    timestamptz
  )
  from public, anon, authenticated;

create or replace function public.ingest_vapi_call(
  p_salon_id uuid,
  p_external_event_id text,
  p_external_call_id text,
  p_customer_phone text,
  p_customer_name text,
  p_started_at timestamptz,
  p_ended_at timestamptz,
  p_duration_seconds integer,
  p_outcome public.call_outcome,
  p_summary text,
  p_requested_service text,
  p_processing_status public.call_processing_status
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_call_id uuid;
  v_usage_period_id uuid;
begin
  if p_duration_seconds is not null
     and p_duration_seconds < 0 then
    raise exception 'duration_seconds non può essere negativo';
  end if;

  insert into public.external_events (
    salon_id,
    provider,
    external_event_id,
    event_type,
    received_at,
    status,
    correlation_id
  )
  values (
    p_salon_id,
    'vapi',
    p_external_event_id,
    'call_snapshot',
    now(),
    'received',
    p_external_call_id
  )
  on conflict (
    salon_id,
    provider,
    external_event_id
  )
  do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select calls.id
    into v_call_id
    from public.calls as calls
    where calls.salon_id = p_salon_id
      and calls.provider = 'vapi'
      and calls.external_call_id = p_external_call_id;

    return jsonb_build_object(
      'duplicateEvent',
      true,
      'callId',
      v_call_id
    );
  end if;

  insert into public.calls (
    salon_id,
    provider,
    external_call_id,
    customer_phone,
    customer_name,
    started_at,
    ended_at,
    duration_seconds,
    outcome,
    summary,
    requested_service,
    processing_status
  )
  values (
    p_salon_id,
    'vapi',
    p_external_call_id,
    p_customer_phone,
    p_customer_name,
    p_started_at,
    p_ended_at,
    p_duration_seconds,
    p_outcome,
    p_summary,
    p_requested_service,
    p_processing_status
  )
  on conflict (
    salon_id,
    provider,
    external_call_id
  )
  do update set
    customer_phone = coalesce(
      excluded.customer_phone,
      calls.customer_phone
    ),
    customer_name = coalesce(
      excluded.customer_name,
      calls.customer_name
    ),
    started_at = least(
      calls.started_at,
      excluded.started_at
    ),
    ended_at = coalesce(
      excluded.ended_at,
      calls.ended_at
    ),
    duration_seconds = coalesce(
      excluded.duration_seconds,
      calls.duration_seconds
    ),
    outcome = excluded.outcome,
    summary = coalesce(
      excluded.summary,
      calls.summary
    ),
    requested_service = coalesce(
      excluded.requested_service,
      calls.requested_service
    ),
    processing_status = excluded.processing_status
  returning id into v_call_id;

  v_usage_period_id := private.refresh_voice_usage(
    p_salon_id,
    p_started_at
  );

  insert into public.channel_statuses (
    salon_id,
    channel,
    status,
    checked_at,
    last_successful_event_at,
    public_message
  )
  values (
    p_salon_id,
    'vapi',
    'operational',
    now(),
    coalesce(p_ended_at, p_started_at),
    'Ultima chiamata acquisita correttamente.'
  )
  on conflict (salon_id, channel)
  do update set
    status = excluded.status,
    checked_at = excluded.checked_at,
    last_successful_event_at =
      excluded.last_successful_event_at,
    public_message = excluded.public_message;

  update public.external_events
  set
    status = 'processed',
    processed_at = now()
  where id = v_event_id;

  return jsonb_build_object(
    'duplicateEvent',
    false,
    'callId',
    v_call_id,
    'usagePeriodId',
    v_usage_period_id
  );
end;
$$;

revoke all
  on function public.ingest_vapi_call(
    uuid,
    text,
    text,
    text,
    text,
    timestamptz,
    timestamptz,
    integer,
    public.call_outcome,
    text,
    text,
    public.call_processing_status
  )
  from public, anon, authenticated;

grant execute
  on function public.ingest_vapi_call(
    uuid,
    text,
    text,
    text,
    text,
    timestamptz,
    timestamptz,
    integer,
    public.call_outcome,
    text,
    text,
    public.call_processing_status
  )
  to service_role;

create or replace function public.ingest_whatsapp_conversation(
  p_salon_id uuid,
  p_external_event_id text,
  p_external_conversation_key text,
  p_customer_phone text,
  p_customer_name text,
  p_status public.conversation_status,
  p_control public.conversation_control,
  p_summary text,
  p_last_message_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_conversation_id uuid;
begin
  insert into public.external_events (
    salon_id,
    provider,
    external_event_id,
    event_type,
    received_at,
    status,
    correlation_id
  )
  values (
    p_salon_id,
    'whatsapp',
    p_external_event_id,
    'conversation_snapshot',
    now(),
    'received',
    p_external_conversation_key
  )
  on conflict (
    salon_id,
    provider,
    external_event_id
  )
  do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select conversations.id
    into v_conversation_id
    from public.whatsapp_conversations as conversations
    where conversations.salon_id = p_salon_id
      and conversations.external_conversation_key =
        p_external_conversation_key;

    return jsonb_build_object(
      'duplicateEvent',
      true,
      'conversationId',
      v_conversation_id
    );
  end if;

  insert into public.whatsapp_conversations (
    salon_id,
    external_conversation_key,
    customer_phone,
    customer_name,
    status,
    control,
    summary,
    last_message_at
  )
  values (
    p_salon_id,
    p_external_conversation_key,
    p_customer_phone,
    p_customer_name,
    p_status,
    p_control,
    p_summary,
    p_last_message_at
  )
  on conflict (
    salon_id,
    external_conversation_key
  )
  do update set
    customer_phone = excluded.customer_phone,
    customer_name = coalesce(
      excluded.customer_name,
      whatsapp_conversations.customer_name
    ),
    status = excluded.status,
    control = excluded.control,
    summary = coalesce(
      excluded.summary,
      whatsapp_conversations.summary
    ),
    last_message_at = greatest(
      coalesce(
        whatsapp_conversations.last_message_at,
        '-infinity'::timestamptz
      ),
      coalesce(
        excluded.last_message_at,
        '-infinity'::timestamptz
      )
    )
  returning id into v_conversation_id;

  insert into public.channel_statuses (
    salon_id,
    channel,
    status,
    checked_at,
    last_successful_event_at,
    public_message
  )
  values (
    p_salon_id,
    'whatsapp',
    'operational',
    now(),
    coalesce(p_last_message_at, now()),
    'Ultima conversazione acquisita correttamente.'
  )
  on conflict (salon_id, channel)
  do update set
    status = excluded.status,
    checked_at = excluded.checked_at,
    last_successful_event_at =
      excluded.last_successful_event_at,
    public_message = excluded.public_message;

  update public.external_events
  set
    status = 'processed',
    processed_at = now()
  where id = v_event_id;

  return jsonb_build_object(
    'duplicateEvent',
    false,
    'conversationId',
    v_conversation_id
  );
end;
$$;

revoke all
  on function public.ingest_whatsapp_conversation(
    uuid,
    text,
    text,
    text,
    text,
    public.conversation_status,
    public.conversation_control,
    text,
    timestamptz
  )
  from public, anon, authenticated;

grant execute
  on function public.ingest_whatsapp_conversation(
    uuid,
    text,
    text,
    text,
    text,
    public.conversation_status,
    public.conversation_control,
    text,
    timestamptz
  )
  to service_role;

comment on table public.external_events is
  'Registro idempotente degli eventi ricevuti dai provider.';
