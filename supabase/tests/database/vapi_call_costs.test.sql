begin;

create extension if not exists pgtap
with schema extensions;

select plan(17);

select has_column(
  'public',
  'calls',
  'cost_total_usd_micros',
  'calls espone il costo totale USD'
);

select has_column(
  'public',
  'calls',
  'cost_stt_usd_micros',
  'calls espone il costo STT'
);

select has_column(
  'public',
  'calls',
  'cost_llm_usd_micros',
  'calls espone il costo LLM'
);

select has_column(
  'public',
  'calls',
  'cost_tts_usd_micros',
  'calls espone il costo TTS'
);

select has_column(
  'public',
  'calls',
  'cost_vapi_usd_micros',
  'calls espone il costo piattaforma Vapi'
);

select has_column(
  'public',
  'calls',
  'cost_transport_usd_micros',
  'calls espone il costo trasporto'
);

select has_column(
  'public',
  'calls',
  'cost_chat_usd_micros',
  'calls espone il costo chat'
);

select has_column(
  'public',
  'calls',
  'cost_knowledge_base_usd_micros',
  'calls espone il costo knowledge base'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace
      on pg_namespace.oid =
        pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname =
        'ingest_vapi_call_v2'
  ),
  'ingest_vapi_call_v2 esiste'
);

select ok(
  exists (
    select 1
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name =
        'ingest_vapi_call_v2'
      and grantee = 'service_role'
      and privilege_type = 'EXECUTE'
  ),
  'service_role può usare la v2'
);

select ok(
  not exists (
    select 1
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name =
        'ingest_vapi_call_v2'
      and grantee = 'authenticated'
      and privilege_type = 'EXECUTE'
  ),
  'authenticated non può usare la v2'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace
      on pg_namespace.oid =
        pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname =
        'ingest_vapi_call'
  ),
  'la funzione v1 resta disponibile'
);

set local role service_role;

select public.ingest_vapi_call_v2(
  '10000000-0000-4000-8000-000000000001',
  'vapi-cost-event-1',
  'vapi-cost-call-1',
  '+393331111111',
  'Cliente Costi',
  '2026-08-02T08:00:00Z',
  '2026-08-02T08:01:30Z',
  90,
  'information_provided',
  'Informazioni fornite',
  null,
  'processed',
  141300,
  15000,
  37000,
  14600,
  74700,
  0,
  0,
  0
);

select public.ingest_vapi_call_v2(
  '10000000-0000-4000-8000-000000000001',
  'vapi-cost-event-1',
  'vapi-cost-call-1',
  '+393331111111',
  'Duplicato',
  '2026-08-02T08:00:00Z',
  '2026-08-02T08:01:30Z',
  90,
  'technical_error',
  'Duplicato da ignorare',
  null,
  'failed',
  999999,
  999999,
  999999,
  999999,
  999999,
  999999,
  999999,
  999999
);

select public.ingest_vapi_call_v2(
  '10000000-0000-4000-8000-000000000001',
  'vapi-cost-event-2',
  'vapi-cost-call-1',
  '+393331111111',
  'Cliente Costi',
  '2026-08-02T08:00:00Z',
  '2026-08-02T08:01:30Z',
  90,
  'booking_completed',
  'Prenotazione completata',
  'Taglio uomo',
  'processed',
  150000,
  16000,
  38000,
  16000,
  80000,
  0,
  0,
  0
);

reset role;

select is(
  (
    select count(*)
    from public.calls
    where external_call_id =
      'vapi-cost-call-1'
  ),
  1::bigint,
  'gli snapshot aggiornano una sola chiamata'
);

select is(
  (
    select cost_total_usd_micros
    from public.calls
    where external_call_id =
      'vapi-cost-call-1'
  ),
  150000::bigint,
  'il nuovo evento aggiorna il costo totale'
);

select is(
  (
    select cost_vapi_usd_micros
    from public.calls
    where external_call_id =
      'vapi-cost-call-1'
  ),
  80000::bigint,
  'il nuovo evento aggiorna il costo Vapi'
);

select is(
  (
    select count(*)
    from public.external_events
    where external_event_id in (
      'vapi-cost-event-1',
      'vapi-cost-event-2'
    )
  ),
  2::bigint,
  'il retry identico non duplica gli eventi'
);

select is(
  (
    select cost_total_usd_micros
    from public.client_calls
    where id = (
      select id
      from public.calls
      where external_call_id =
        'vapi-cost-call-1'
    )
  ),
  150000::bigint,
  'la vista client espone il costo reale'
);

select * from finish();

rollback;
