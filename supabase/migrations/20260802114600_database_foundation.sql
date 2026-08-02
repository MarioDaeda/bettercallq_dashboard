-- BetterCallQ — Task 8C.1
-- Fondazione persistente. Tutte le tabelle esposte hanno RLS abilitata,
-- ma nessuna policy applicativa: anon e authenticated non possono ancora
-- leggere o modificare dati. Le policy arrivano nella Task 8C.3.

create type public.platform_role as enum (
  'admin',
  'standard'
);

create type public.salon_status as enum (
  'trial',
  'active',
  'suspended'
);

create type public.salon_membership_role as enum (
  'owner',
  'manager',
  'viewer',
  'support'
);

create type public.membership_status as enum (
  'invited',
  'active',
  'disabled'
);

create type public.billing_cycle_type as enum (
  'calendar_month'
);

create type public.subscription_status as enum (
  'active',
  'paused',
  'cancelled'
);

create type public.call_provider as enum (
  'vapi'
);

create type public.call_outcome as enum (
  'booking_completed',
  'information_provided',
  'change_or_cancellation',
  'transferred',
  'incomplete',
  'technical_error',
  'abandoned'
);

create type public.call_processing_status as enum (
  'receiving',
  'processed',
  'failed'
);

create type public.conversation_status as enum (
  'ai_handled',
  'needs_intervention',
  'human_control',
  'waiting_customer',
  'completed'
);

create type public.conversation_control as enum (
  'ai',
  'human'
);

create type public.message_author as enum (
  'customer',
  'ai',
  'human',
  'system'
);

create type public.message_direction as enum (
  'inbound',
  'outbound'
);

create type public.message_status as enum (
  'received',
  'queued',
  'sent',
  'delivered',
  'read',
  'failed'
);

create type public.channel_kind as enum (
  'vapi',
  'whatsapp',
  'booking_provider'
);

create type public.health_status as enum (
  'operational',
  'degraded',
  'offline',
  'not_configured'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null
    check (length(btrim(display_name)) between 1 and 120),
  platform_role public.platform_role not null default 'standard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text unique
    check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  timezone text not null default 'Europe/Rome',
  locale text not null default 'it-IT',
  phone_number text
    check (
      phone_number is null
      or phone_number ~ '^\+[1-9][0-9]{7,14}$'
    ),
  whatsapp_number text
    check (
      whatsapp_number is null
      or whatsapp_number ~ '^\+[1-9][0-9]{7,14}$'
    ),
  address jsonb not null default '{}'::jsonb
    check (jsonb_typeof(address) = 'object'),
  status public.salon_status not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salon_memberships (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.salon_membership_role not null default 'viewer',
  status public.membership_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, user_id)
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) between 1 and 120),
  included_voice_minutes integer not null
    check (included_voice_minutes > 0),
  extra_minute_price_cents integer
    check (
      extra_minute_price_cents is null
      or extra_minute_price_cents >= 0
    ),
  billing_cycle_type public.billing_cycle_type not null
    default 'calendar_month',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salon_subscriptions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status public.subscription_status not null default 'active',
  starts_on date not null,
  ends_on date,
  custom_included_voice_minutes integer
    check (
      custom_included_voice_minutes is null
      or custom_included_voice_minutes > 0
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create unique index salon_subscriptions_one_active_per_salon
  on public.salon_subscriptions (salon_id)
  where status = 'active';

create table public.usage_periods (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  subscription_id uuid not null
    references public.salon_subscriptions(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  included_voice_minutes integer not null
    check (included_voice_minutes > 0),
  used_voice_seconds bigint not null default 0
    check (used_voice_seconds >= 0),
  remaining_voice_seconds bigint generated always as (
    greatest(
      (included_voice_minutes::bigint * 60) - used_voice_seconds,
      0
    )
  ) stored,
  extra_voice_seconds bigint generated always as (
    greatest(
      used_voice_seconds - (included_voice_minutes::bigint * 60),
      0
    )
  ) stored,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (salon_id, period_start, period_end)
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  provider public.call_provider not null default 'vapi',
  external_call_id text not null check (length(btrim(external_call_id)) > 0),
  customer_phone text
    check (
      customer_phone is null
      or customer_phone ~ '^\+[1-9][0-9]{7,14}$'
    ),
  customer_name text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer
    check (duration_seconds is null or duration_seconds >= 0),
  outcome public.call_outcome not null,
  summary text,
  requested_service text,
  booking_reference_id uuid,
  transcript jsonb
    check (transcript is null or jsonb_typeof(transcript) = 'array'),
  recording_url text,
  processing_status public.call_processing_status not null
    default 'receiving',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at),
  unique (salon_id, provider, external_call_id)
);

create index calls_salon_started_at_idx
  on public.calls (salon_id, started_at desc);

create table public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  external_conversation_key text not null
    check (length(btrim(external_conversation_key)) > 0),
  customer_phone text not null
    check (customer_phone ~ '^\+[1-9][0-9]{7,14}$'),
  customer_name text,
  status public.conversation_status not null default 'ai_handled',
  control public.conversation_control not null default 'ai',
  summary text,
  last_message_at timestamptz,
  booking_reference_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, external_conversation_key),
  unique (id, salon_id)
);

create index whatsapp_conversations_salon_last_message_idx
  on public.whatsapp_conversations (
    salon_id,
    last_message_at desc nulls last
  );

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  conversation_id uuid not null,
  external_message_id text,
  author public.message_author not null,
  direction public.message_direction not null,
  body text not null check (length(body) > 0),
  status public.message_status not null,
  sent_at timestamptz not null,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_messages_conversation_salon_fk
    foreign key (conversation_id, salon_id)
    references public.whatsapp_conversations(id, salon_id)
    on delete cascade
);

create unique index whatsapp_messages_external_id_unique
  on public.whatsapp_messages (salon_id, external_message_id)
  where external_message_id is not null;

create index whatsapp_messages_conversation_sent_at_idx
  on public.whatsapp_messages (conversation_id, sent_at);

create table public.channel_statuses (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  channel public.channel_kind not null,
  status public.health_status not null default 'not_configured',
  checked_at timestamptz not null,
  last_successful_event_at timestamptz,
  public_message text,
  capability jsonb
    check (capability is null or jsonb_typeof(capability) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, channel)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references public.salons(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (length(btrim(action)) > 0),
  entity_type text not null check (length(btrim(entity_type)) > 0),
  entity_id uuid,
  summary text not null check (length(btrim(summary)) > 0),
  correlation_id text,
  created_at timestamptz not null default now()
);

create index audit_events_salon_created_at_idx
  on public.audit_events (salon_id, created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger salons_set_updated_at
before update on public.salons
for each row execute function public.set_updated_at();

create trigger salon_memberships_set_updated_at
before update on public.salon_memberships
for each row execute function public.set_updated_at();

create trigger subscription_plans_set_updated_at
before update on public.subscription_plans
for each row execute function public.set_updated_at();

create trigger salon_subscriptions_set_updated_at
before update on public.salon_subscriptions
for each row execute function public.set_updated_at();

create trigger usage_periods_set_updated_at
before update on public.usage_periods
for each row execute function public.set_updated_at();

create trigger calls_set_updated_at
before update on public.calls
for each row execute function public.set_updated_at();

create trigger whatsapp_conversations_set_updated_at
before update on public.whatsapp_conversations
for each row execute function public.set_updated_at();

create trigger whatsapp_messages_set_updated_at
before update on public.whatsapp_messages
for each row execute function public.set_updated_at();

create trigger channel_statuses_set_updated_at
before update on public.channel_statuses
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    user_id,
    display_name,
    platform_role
  )
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_app_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Utente'
    ),
    case
      when new.raw_app_meta_data ->> 'app_role' = 'admin'
        then 'admin'::public.platform_role
      else 'standard'::public.platform_role
    end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.profiles (
  user_id,
  display_name,
  platform_role
)
select
  users.id,
  coalesce(
    nullif(btrim(users.raw_app_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
    'Utente'
  ),
  case
    when users.raw_app_meta_data ->> 'app_role' = 'admin'
      then 'admin'::public.platform_role
    else 'standard'::public.platform_role
  end
from auth.users as users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.salons enable row level security;
alter table public.salon_memberships enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.salon_subscriptions enable row level security;
alter table public.usage_periods enable row level security;
alter table public.calls enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.channel_statuses enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.salons from anon, authenticated;
revoke all on table public.salon_memberships from anon, authenticated;
revoke all on table public.subscription_plans from anon, authenticated;
revoke all on table public.salon_subscriptions from anon, authenticated;
revoke all on table public.usage_periods from anon, authenticated;
revoke all on table public.calls from anon, authenticated;
revoke all on table public.whatsapp_conversations from anon, authenticated;
revoke all on table public.whatsapp_messages from anon, authenticated;
revoke all on table public.channel_statuses from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;

grant all on table public.profiles to service_role;
grant all on table public.salons to service_role;
grant all on table public.salon_memberships to service_role;
grant all on table public.subscription_plans to service_role;
grant all on table public.salon_subscriptions to service_role;
grant all on table public.usage_periods to service_role;
grant all on table public.calls to service_role;
grant all on table public.whatsapp_conversations to service_role;
grant all on table public.whatsapp_messages to service_role;
grant all on table public.channel_statuses to service_role;
grant all on table public.audit_events to service_role;

comment on table public.profiles is
  'Profilo applicativo collegato alla chiave primaria di auth.users.';

comment on table public.salon_memberships is
  'Collegamento persistente tra utenti e saloni; sostituirà salon_id in app_metadata.';

comment on table public.usage_periods is
  'Consumo voce aggregato per periodo contrattuale.';

comment on table public.calls is
  'Telefonate persistenti; transcript e recording sono dati sensibili.';

comment on table public.whatsapp_conversations is
  'Conversazioni WhatsApp isolate per salon_id.';
