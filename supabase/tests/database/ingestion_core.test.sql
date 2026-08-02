begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

select has_table(
  'public',
  'external_events',
  'external_events esiste'
);

select has_index(
  'public',
  'external_events',
  'external_events_salon_received_at_idx',
  'external_events è indicizzata'
);

select ok(
  (
    select pg_class.relrowsecurity
    from pg_class
    join pg_namespace
      on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname = 'external_events'
  ),
  'external_events ha RLS abilitata'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace
      on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'ingest_vapi_call'
  ),
  'ingest_vapi_call esiste'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace
      on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname =
        'ingest_whatsapp_conversation'
  ),
  'ingest_whatsapp_conversation esiste'
);

select ok(
  exists (
    select 1
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name = 'ingest_vapi_call'
      and grantee = 'service_role'
      and privilege_type = 'EXECUTE'
  ),
  'service_role può ingerire chiamate'
);

select ok(
  not exists (
    select 1
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name = 'ingest_vapi_call'
      and grantee = 'authenticated'
      and privilege_type = 'EXECUTE'
  ),
  'authenticated non può ingerire chiamate'
);

select ok(
  exists (
    select 1
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name =
        'ingest_whatsapp_conversation'
      and grantee = 'service_role'
      and privilege_type = 'EXECUTE'
  ),
  'service_role può ingerire WhatsApp'
);

select ok(
  not exists (
    select 1
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name =
        'ingest_whatsapp_conversation'
      and grantee = 'authenticated'
      and privilege_type = 'EXECUTE'
  ),
  'authenticated non può ingerire WhatsApp'
);

set local role service_role;

select public.ingest_vapi_call(
  '10000000-0000-4000-8000-000000000001',
  'vapi-event-1',
  'vapi-call-1',
  '+393331111111',
  'Cliente Uno',
  '2026-08-02T08:00:00Z',
  '2026-08-02T08:01:30Z',
  90,
  'information_provided',
  'Informazioni fornite',
  null,
  'processed'
);

select public.ingest_vapi_call(
  '10000000-0000-4000-8000-000000000001',
  'vapi-event-1',
  'vapi-call-1',
  '+393331111111',
  'Cliente Uno',
  '2026-08-02T08:00:00Z',
  '2026-08-02T08:16:39Z',
  999,
  'technical_error',
  'Duplicato da ignorare',
  null,
  'failed'
);

select public.ingest_vapi_call(
  '10000000-0000-4000-8000-000000000001',
  'vapi-event-2',
  'vapi-call-1',
  '+393331111111',
  'Cliente Uno',
  '2026-08-02T08:00:00Z',
  '2026-08-02T08:02:00Z',
  120,
  'booking_completed',
  'Prenotazione completata',
  'Taglio',
  'processed'
);

select public.ingest_vapi_call(
  '10000000-0000-4000-8000-000000000001',
  'vapi-event-3',
  'vapi-call-2',
  '+393332222222',
  'Cliente Due',
  '2026-08-03T09:00:00Z',
  '2026-08-03T09:01:00Z',
  60,
  'information_provided',
  'Orari comunicati',
  null,
  'processed'
);

select public.ingest_whatsapp_conversation(
  '10000000-0000-4000-8000-000000000001',
  'wa-event-1',
  'wa-conversation-1',
  '+393333333333',
  'Cliente WhatsApp',
  'ai_handled',
  'ai',
  'Prima versione',
  '2026-08-02T10:00:00Z'
);

select public.ingest_whatsapp_conversation(
  '10000000-0000-4000-8000-000000000001',
  'wa-event-1',
  'wa-conversation-1',
  '+393333333333',
  'Cliente WhatsApp',
  'needs_intervention',
  'human',
  'Duplicato da ignorare',
  '2026-08-02T11:00:00Z'
);

select public.ingest_whatsapp_conversation(
  '10000000-0000-4000-8000-000000000001',
  'wa-event-2',
  'wa-conversation-1',
  '+393333333333',
  'Cliente WhatsApp',
  'completed',
  'ai',
  'Conversazione aggiornata',
  '2026-08-02T12:00:00Z'
);

reset role;

select is(
  (
    select count(*)
    from public.calls
    where salon_id =
      '10000000-0000-4000-8000-000000000001'
  ),
  2::bigint,
  'due chiamate provider producono due righe'
);

select is(
  (
    select duration_seconds
    from public.calls
    where salon_id =
      '10000000-0000-4000-8000-000000000001'
      and external_call_id = 'vapi-call-1'
  ),
  120,
  'un nuovo evento aggiorna la chiamata esistente'
);

select is(
  (
    select used_voice_seconds
    from public.usage_periods
    where salon_id =
      '10000000-0000-4000-8000-000000000001'
      and period_start = '2026-08-01'
  ),
  180::bigint,
  'il consumo viene ricalcolato senza duplicati'
);

select is(
  (
    select count(*)
    from public.external_events
    where provider = 'vapi'
  ),
  3::bigint,
  'gli eventi Vapi duplicati non vengono registrati due volte'
);

select is(
  (
    select count(*)
    from public.whatsapp_conversations
    where salon_id =
      '10000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'una conversazione provider produce una sola riga'
);

select is(
  (
    select summary
    from public.whatsapp_conversations
    where salon_id =
      '10000000-0000-4000-8000-000000000001'
      and external_conversation_key =
        'wa-conversation-1'
  ),
  'Conversazione aggiornata',
  'un nuovo evento aggiorna il riepilogo WhatsApp'
);

select is(
  (
    select count(*)
    from public.external_events
    where provider = 'whatsapp'
  ),
  2::bigint,
  'gli eventi WhatsApp duplicati non vengono registrati due volte'
);

select is(
  (
    select count(*)
    from public.external_events
    where status = 'processed'
  ),
  5::bigint,
  'tutti gli eventi distinti risultano processati'
);

select is(
  (
    select count(*)
    from public.channel_statuses
    where salon_id =
      '10000000-0000-4000-8000-000000000001'
      and channel in ('vapi', 'whatsapp')
      and status = 'operational'
  ),
  2::bigint,
  'entrambi i canali risultano operativi'
);

select * from finish();

rollback;
