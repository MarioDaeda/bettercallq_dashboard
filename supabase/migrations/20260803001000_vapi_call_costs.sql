-- BetterCallQ — Task 8F.2B1
-- Persistenza dei costi Vapi in microdollari.
--
-- Un microdollaro equivale a 0,000001 USD.
-- La funzione v1 resta disponibile durante la migrazione del backend.

alter table public.calls
  add column cost_total_usd_micros bigint
    check (
      cost_total_usd_micros is null
      or cost_total_usd_micros >= 0
    ),
  add column cost_stt_usd_micros bigint
    check (
      cost_stt_usd_micros is null
      or cost_stt_usd_micros >= 0
    ),
  add column cost_llm_usd_micros bigint
    check (
      cost_llm_usd_micros is null
      or cost_llm_usd_micros >= 0
    ),
  add column cost_tts_usd_micros bigint
    check (
      cost_tts_usd_micros is null
      or cost_tts_usd_micros >= 0
    ),
  add column cost_vapi_usd_micros bigint
    check (
      cost_vapi_usd_micros is null
      or cost_vapi_usd_micros >= 0
    ),
  add column cost_transport_usd_micros bigint
    check (
      cost_transport_usd_micros is null
      or cost_transport_usd_micros >= 0
    ),
  add column cost_chat_usd_micros bigint
    check (
      cost_chat_usd_micros is null
      or cost_chat_usd_micros >= 0
    ),
  add column cost_knowledge_base_usd_micros bigint
    check (
      cost_knowledge_base_usd_micros is null
      or cost_knowledge_base_usd_micros >= 0
    );

create or replace function public.ingest_vapi_call_v2(
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
  p_processing_status public.call_processing_status,
  p_cost_total_usd_micros bigint,
  p_cost_stt_usd_micros bigint,
  p_cost_llm_usd_micros bigint,
  p_cost_tts_usd_micros bigint,
  p_cost_vapi_usd_micros bigint,
  p_cost_transport_usd_micros bigint,
  p_cost_chat_usd_micros bigint,
  p_cost_knowledge_base_usd_micros bigint
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
    raise exception
      'duration_seconds non può essere negativo';
  end if;

  if coalesce(
    p_cost_total_usd_micros,
    p_cost_stt_usd_micros,
    p_cost_llm_usd_micros,
    p_cost_tts_usd_micros,
    p_cost_vapi_usd_micros,
    p_cost_transport_usd_micros,
    p_cost_chat_usd_micros,
    p_cost_knowledge_base_usd_micros
  ) < 0 then
    raise exception
      'I costi Vapi non possono essere negativi';
  end if;

  if p_cost_stt_usd_micros is not null
     and p_cost_stt_usd_micros < 0
     or p_cost_llm_usd_micros is not null
     and p_cost_llm_usd_micros < 0
     or p_cost_tts_usd_micros is not null
     and p_cost_tts_usd_micros < 0
     or p_cost_vapi_usd_micros is not null
     and p_cost_vapi_usd_micros < 0
     or p_cost_transport_usd_micros is not null
     and p_cost_transport_usd_micros < 0
     or p_cost_chat_usd_micros is not null
     and p_cost_chat_usd_micros < 0
     or p_cost_knowledge_base_usd_micros is not null
     and p_cost_knowledge_base_usd_micros < 0 then
    raise exception
      'I costi Vapi non possono essere negativi';
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
    'call_snapshot_v2',
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
      and calls.external_call_id =
        p_external_call_id;

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
    processing_status,
    cost_total_usd_micros,
    cost_stt_usd_micros,
    cost_llm_usd_micros,
    cost_tts_usd_micros,
    cost_vapi_usd_micros,
    cost_transport_usd_micros,
    cost_chat_usd_micros,
    cost_knowledge_base_usd_micros
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
    p_processing_status,
    p_cost_total_usd_micros,
    p_cost_stt_usd_micros,
    p_cost_llm_usd_micros,
    p_cost_tts_usd_micros,
    p_cost_vapi_usd_micros,
    p_cost_transport_usd_micros,
    p_cost_chat_usd_micros,
    p_cost_knowledge_base_usd_micros
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
    processing_status = excluded.processing_status,
    cost_total_usd_micros = coalesce(
      excluded.cost_total_usd_micros,
      calls.cost_total_usd_micros
    ),
    cost_stt_usd_micros = coalesce(
      excluded.cost_stt_usd_micros,
      calls.cost_stt_usd_micros
    ),
    cost_llm_usd_micros = coalesce(
      excluded.cost_llm_usd_micros,
      calls.cost_llm_usd_micros
    ),
    cost_tts_usd_micros = coalesce(
      excluded.cost_tts_usd_micros,
      calls.cost_tts_usd_micros
    ),
    cost_vapi_usd_micros = coalesce(
      excluded.cost_vapi_usd_micros,
      calls.cost_vapi_usd_micros
    ),
    cost_transport_usd_micros = coalesce(
      excluded.cost_transport_usd_micros,
      calls.cost_transport_usd_micros
    ),
    cost_chat_usd_micros = coalesce(
      excluded.cost_chat_usd_micros,
      calls.cost_chat_usd_micros
    ),
    cost_knowledge_base_usd_micros = coalesce(
      excluded.cost_knowledge_base_usd_micros,
      calls.cost_knowledge_base_usd_micros
    )
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
  on function public.ingest_vapi_call_v2(
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
    public.call_processing_status,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint
  )
  from public, anon, authenticated;

grant execute
  on function public.ingest_vapi_call_v2(
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
    public.call_processing_status,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint
  )
  to service_role;

grant select (
  cost_total_usd_micros,
  cost_stt_usd_micros,
  cost_llm_usd_micros,
  cost_tts_usd_micros,
  cost_vapi_usd_micros,
  cost_transport_usd_micros,
  cost_chat_usd_micros,
  cost_knowledge_base_usd_micros
)
on public.calls
to authenticated;

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
  updated_at,
  cost_total_usd_micros,
  cost_stt_usd_micros,
  cost_llm_usd_micros,
  cost_tts_usd_micros,
  cost_vapi_usd_micros,
  cost_transport_usd_micros,
  cost_chat_usd_micros,
  cost_knowledge_base_usd_micros
from public.calls;

comment on column public.calls.cost_total_usd_micros is
  'Costo totale Vapi espresso in microdollari USD.';

comment on function public.ingest_vapi_call_v2 is
  'Ingestione Vapi idempotente con costi reali in microdollari USD.';
