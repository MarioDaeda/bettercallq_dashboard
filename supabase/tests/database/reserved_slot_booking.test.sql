begin;

create extension if not exists pgtap with schema extensions;

set local search_path = extensions, public, pg_catalog;

select plan(16);

select has_table('public', 'bookings', 'bookings esiste');

select has_index(
  'public',
  'bookings',
  'bookings_treatwell_queue_idx',
  'la coda Treatwell è indicizzata'
);

select ok(
  (
    select pg_class.relrowsecurity
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname = 'bookings'
  ),
  'bookings ha RLS abilitata'
);

select ok(exists (
  select 1 from pg_proc join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
  where pg_namespace.nspname = 'public' and pg_proc.proname = 'claim_reserved_booking'
), 'claim_reserved_booking esiste');

select ok(exists (
  select 1 from pg_proc join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
  where pg_namespace.nspname = 'public' and pg_proc.proname = 'confirm_reserved_booking'
), 'confirm_reserved_booking esiste');

select ok(exists (
  select 1 from pg_proc join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
  where pg_namespace.nspname = 'public' and pg_proc.proname = 'cancel_reserved_booking'
), 'cancel_reserved_booking esiste');

select ok(exists (
  select 1 from pg_proc join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
  where pg_namespace.nspname = 'public' and pg_proc.proname = 'complete_treatwell_operation'
), 'complete_treatwell_operation esiste');

select ok(exists (
  select 1 from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name = 'claim_reserved_booking'
    and grantee = 'service_role'
    and privilege_type = 'EXECUTE'
), 'service_role può reclamare slot');

select ok(not exists (
  select 1 from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name = 'claim_reserved_booking'
    and grantee = 'authenticated'
    and privilege_type = 'EXECUTE'
), 'authenticated non può reclamare slot');

set local role service_role;

select public.claim_reserved_booking(
  '10000000-0000-4000-8000-000000000001',
  'Cliente Uno',
  '+393331111111',
  'taglio_uomo',
  'Taglio uomo',
  45,
  '2026-09-01T07:00:00Z',
  '2026-09-01T07:45:00Z',
  'vapi',
  'claim-uno'
);

select is(
  (select status::text from public.bookings where idempotency_key = 'claim-uno'),
  'pending',
  'il claim crea una prenotazione pending'
);

select public.claim_reserved_booking(
  '10000000-0000-4000-8000-000000000001',
  'Cliente Uno',
  '+393331111111',
  'taglio_uomo',
  'Taglio uomo',
  45,
  '2026-09-01T07:00:00Z',
  '2026-09-01T07:45:00Z',
  'vapi',
  'claim-uno'
);

select is(
  (select count(*) from public.bookings where idempotency_key = 'claim-uno'),
  1::bigint,
  'il retry idempotente non duplica la prenotazione'
);

select public.claim_reserved_booking(
  '10000000-0000-4000-8000-000000000001',
  'Cliente Due',
  '+393332222222',
  'taglio_uomo',
  'Taglio uomo',
  45,
  '2026-09-01T07:15:00Z',
  '2026-09-01T08:00:00Z',
  'vapi',
  'claim-conflitto'
);

select is(
  (select count(*) from public.bookings where idempotency_key = 'claim-conflitto'),
  0::bigint,
  'il vincolo atomico impedisce la sovrapposizione'
);

select public.confirm_reserved_booking(
  (select id from public.bookings where idempotency_key = 'claim-uno'),
  'bcq-event-uno'
);

select is(
  (select status::text from public.bookings where idempotency_key = 'claim-uno'),
  'confirmed',
  'la conferma cambia lo stato applicativo'
);

select is(
  (select treatwell_status::text from public.bookings where idempotency_key = 'claim-uno'),
  'to_sync',
  'solo una prenotazione confermata entra nella coda Treatwell'
);

select public.claim_reserved_booking(
  '10000000-0000-4000-8000-000000000001',
  'Cliente Tre',
  '+393333333333',
  'taglio_uomo',
  'Taglio uomo',
  45,
  '2026-09-01T09:00:00Z',
  '2026-09-01T09:45:00Z',
  'vapi',
  'claim-fallito'
);

select public.fail_reserved_booking(
  (select id from public.bookings where idempotency_key = 'claim-fallito'),
  'Calendar offline'
);

select is(
  (select treatwell_status::text from public.bookings where idempotency_key = 'claim-fallito'),
  'none',
  'una prenotazione fallita non entra nella coda Treatwell'
);

update public.bookings
set treatwell_status = 'synced'
where idempotency_key = 'claim-uno';

select public.cancel_reserved_booking(
  (select id from public.bookings where idempotency_key = 'claim-uno'),
  '10000000-0000-4000-8000-000000000001'
);

select is(
  (select treatwell_status::text from public.bookings where idempotency_key = 'claim-uno'),
  'cancellation_required',
  'una cancellazione già sincronizzata richiede intervento Treatwell'
);

select * from finish();

rollback;
