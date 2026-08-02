-- BetterCallQ — Task 8C.3
-- Policy RLS read-only e superfici di lettura prive di colonne sensibili.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = (select auth.uid())
      and platform_role = 'admin'
  );
$$;

create or replace function private.current_user_salon_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select memberships.salon_id
  from public.salon_memberships as memberships
  join public.salons as salons
    on salons.id = memberships.salon_id
   and salons.status in ('trial', 'active')
  where memberships.user_id = (select auth.uid())
    and memberships.status = 'active';
$$;

create or replace function private.current_user_plan_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct subscriptions.plan_id
  from public.salon_subscriptions as subscriptions
  where subscriptions.status = 'active'
    and subscriptions.salon_id = any(
      array(select private.current_user_salon_ids())
    );
$$;

revoke all
  on function private.is_platform_admin()
  from public, anon;

revoke all
  on function private.current_user_salon_ids()
  from public, anon;

revoke all
  on function private.current_user_plan_ids()
  from public, anon;

grant execute
  on function private.is_platform_admin()
  to authenticated;

grant execute
  on function private.current_user_salon_ids()
  to authenticated;

grant execute
  on function private.current_user_plan_ids()
  to authenticated;

drop policy if exists profiles_select_own_or_admin
  on public.profiles;

create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.is_platform_admin())
);

drop policy if exists salons_select_accessible
  on public.salons;

create policy salons_select_accessible
on public.salons
for select
to authenticated
using (
  (select private.is_platform_admin())
  or id = any(
    array(select private.current_user_salon_ids())
  )
);

drop policy if exists salon_memberships_select_own_or_admin
  on public.salon_memberships;

create policy salon_memberships_select_own_or_admin
on public.salon_memberships
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.is_platform_admin())
);

drop policy if exists subscription_plans_select_accessible
  on public.subscription_plans;

create policy subscription_plans_select_accessible
on public.subscription_plans
for select
to authenticated
using (
  (select private.is_platform_admin())
  or id = any(
    array(select private.current_user_plan_ids())
  )
);

drop policy if exists salon_subscriptions_select_accessible
  on public.salon_subscriptions;

create policy salon_subscriptions_select_accessible
on public.salon_subscriptions
for select
to authenticated
using (
  (select private.is_platform_admin())
  or salon_id = any(
    array(select private.current_user_salon_ids())
  )
);

drop policy if exists usage_periods_select_accessible
  on public.usage_periods;

create policy usage_periods_select_accessible
on public.usage_periods
for select
to authenticated
using (
  (select private.is_platform_admin())
  or salon_id = any(
    array(select private.current_user_salon_ids())
  )
);

drop policy if exists calls_select_accessible
  on public.calls;

create policy calls_select_accessible
on public.calls
for select
to authenticated
using (
  (select private.is_platform_admin())
  or salon_id = any(
    array(select private.current_user_salon_ids())
  )
);

drop policy if exists whatsapp_conversations_select_accessible
  on public.whatsapp_conversations;

create policy whatsapp_conversations_select_accessible
on public.whatsapp_conversations
for select
to authenticated
using (
  (select private.is_platform_admin())
  or salon_id = any(
    array(select private.current_user_salon_ids())
  )
);

drop policy if exists whatsapp_messages_select_accessible
  on public.whatsapp_messages;

create policy whatsapp_messages_select_accessible
on public.whatsapp_messages
for select
to authenticated
using (
  (select private.is_platform_admin())
  or salon_id = any(
    array(select private.current_user_salon_ids())
  )
);

drop policy if exists channel_statuses_select_accessible
  on public.channel_statuses;

create policy channel_statuses_select_accessible
on public.channel_statuses
for select
to authenticated
using (
  (select private.is_platform_admin())
  or salon_id = any(
    array(select private.current_user_salon_ids())
  )
);

drop policy if exists audit_events_select_admin
  on public.audit_events;

create policy audit_events_select_admin
on public.audit_events
for select
to authenticated
using (
  (select private.is_platform_admin())
);

-- Privilegi minimi sulle tabelle sottostanti.
-- Non viene concesso SELECT su transcript, recording_url,
-- external_call_id, external_conversation_key o corpo dei messaggi.

grant select (
  user_id,
  display_name,
  platform_role,
  created_at,
  updated_at
)
on public.profiles
to authenticated;

grant select
on public.salons
to authenticated;

grant select (
  id,
  salon_id,
  user_id,
  role,
  status,
  created_at,
  updated_at
)
on public.salon_memberships
to authenticated;

grant select
on public.subscription_plans
to authenticated;

grant select
on public.salon_subscriptions
to authenticated;

grant select
on public.usage_periods
to authenticated;

grant select (
  id,
  salon_id,
  customer_phone,
  customer_name,
  started_at,
  ended_at,
  duration_seconds,
  outcome,
  summary,
  requested_service,
  processing_status,
  created_at,
  updated_at
)
on public.calls
to authenticated;

grant select (
  id,
  salon_id,
  customer_phone,
  customer_name,
  status,
  control,
  summary,
  last_message_at,
  created_at,
  updated_at
)
on public.whatsapp_conversations
to authenticated;

grant select (
  id,
  salon_id,
  channel,
  status,
  checked_at,
  last_successful_event_at,
  public_message,
  created_at,
  updated_at
)
on public.channel_statuses
to authenticated;

grant select
on public.audit_events
to authenticated;

create or replace view public.client_salons
with (
  security_invoker = true,
  security_barrier = true
)
as
select
  id,
  name,
  timezone,
  locale,
  phone_number,
  whatsapp_number,
  address,
  status,
  created_at,
  updated_at
from public.salons;

create or replace view public.client_usage_periods
with (
  security_invoker = true,
  security_barrier = true
)
as
select
  id,
  salon_id,
  subscription_id,
  period_start,
  period_end,
  included_voice_minutes,
  used_voice_seconds,
  remaining_voice_seconds,
  extra_voice_seconds,
  calculated_at,
  created_at,
  updated_at
from public.usage_periods;

create or replace view public.client_calls
with (
  security_invoker = true,
  security_barrier = true
)
as
select
  id,
  salon_id,
  customer_phone,
  customer_name,
  started_at,
  ended_at,
  duration_seconds,
  outcome,
  summary,
  requested_service,
  processing_status,
  created_at,
  updated_at
from public.calls;

create or replace view public.client_whatsapp_conversations
with (
  security_invoker = true,
  security_barrier = true
)
as
select
  id,
  salon_id,
  customer_phone,
  customer_name,
  status,
  control,
  summary,
  last_message_at,
  created_at,
  updated_at
from public.whatsapp_conversations;

create or replace view public.client_channel_statuses
with (
  security_invoker = true,
  security_barrier = true
)
as
select
  id,
  salon_id,
  channel,
  status,
  checked_at,
  last_successful_event_at,
  public_message,
  created_at,
  updated_at
from public.channel_statuses;

revoke all
  on public.client_salons
  from public, anon;

revoke all
  on public.client_usage_periods
  from public, anon;

revoke all
  on public.client_calls
  from public, anon;

revoke all
  on public.client_whatsapp_conversations
  from public, anon;

revoke all
  on public.client_channel_statuses
  from public, anon;

grant select
  on public.client_salons
  to authenticated;

grant select
  on public.client_usage_periods
  to authenticated;

grant select
  on public.client_calls
  to authenticated;

grant select
  on public.client_whatsapp_conversations
  to authenticated;

grant select
  on public.client_channel_statuses
  to authenticated;

comment on schema private is
  'Funzioni interne usate dalle policy RLS; schema non esposto da PostgREST.';

comment on view public.client_calls is
  'Chiamate leggibili dal client senza transcript, recording o ID provider.';

comment on view public.client_whatsapp_conversations is
  'Monitoraggio WhatsApp senza chiavi provider o corpi dei messaggi.';
