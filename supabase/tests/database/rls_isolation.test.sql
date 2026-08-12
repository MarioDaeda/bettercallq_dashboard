begin;

create extension if not exists pgtap with schema extensions;

set local search_path = extensions, public, pg_catalog;

select plan(24);

select has_schema(
  'private',
  'lo schema privato delle policy esiste'
);

select has_function(
  'private',
  'is_platform_admin',
  array[]::text[],
  'is_platform_admin esiste'
);

select has_function(
  'private',
  'current_user_salon_ids',
  array[]::text[],
  'current_user_salon_ids esiste'
);

select has_function(
  'private',
  'current_user_plan_ids',
  array[]::text[],
  'current_user_plan_ids esiste'
);

select ok(
  (
    select pg_proc.prosecdef
    from pg_proc
    join pg_namespace
      on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'private'
      and pg_proc.proname = 'is_platform_admin'
      and pg_proc.pronargs = 0
  ),
  'is_platform_admin è security definer'
);

select ok(
  (
    select pg_proc.prosecdef
    from pg_proc
    join pg_namespace
      on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'private'
      and pg_proc.proname = 'current_user_salon_ids'
      and pg_proc.pronargs = 0
  ),
  'current_user_salon_ids è security definer'
);

select policies_are(
  'public',
  'calls',
  array['calls_select_accessible'],
  'calls ha una sola policy read-only'
);

select policies_are(
  'public',
  'whatsapp_conversations',
  array['whatsapp_conversations_select_accessible'],
  'WhatsApp ha una sola policy read-only'
);

select policies_are(
  'public',
  'usage_periods',
  array['usage_periods_select_accessible'],
  'usage_periods ha una sola policy read-only'
);

select ok(
  has_table_privilege(
    'authenticated',
    'public.client_calls',
    'SELECT'
  ),
  'authenticated può leggere client_calls'
);

select ok(
  not has_table_privilege(
    'anon',
    'public.client_calls',
    'SELECT'
  ),
  'anon non può leggere client_calls'
);

select ok(
  has_column_privilege(
    'authenticated',
    'public.calls',
    'customer_phone',
    'SELECT'
  ),
  'il numero completo è leggibile'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.calls',
    'transcript',
    'SELECT'
  ),
  'la trascrizione non è leggibile'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.calls',
    'recording_url',
    'SELECT'
  ),
  'la registrazione non è leggibile'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.calls',
    'external_call_id',
    'SELECT'
  ),
  'l ID provider della chiamata non è leggibile'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.whatsapp_messages',
    'body',
    'SELECT'
  ),
  'i corpi dei messaggi WhatsApp non sono leggibili'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.whatsapp_conversations',
    'external_conversation_key',
    'SELECT'
  ),
  'la chiave provider WhatsApp non è leggibile'
);

select ok(
  (
    select 'security_invoker=true' = any(
      coalesce(pg_class.reloptions, array[]::text[])
    )
    from pg_class
    join pg_namespace
      on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname = 'client_calls'
  ),
  'client_calls rispetta RLS delle tabelle sottostanti'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '91000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'admin-rls@example.com',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '91000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'owner-a@example.com',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '91000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'owner-b@example.com',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

update public.profiles
set
  display_name = 'Admin RLS',
  platform_role = 'admin'
where user_id = '91000000-0000-4000-8000-000000000001';

update public.profiles
set
  display_name = 'Owner A',
  platform_role = 'standard'
where user_id = '91000000-0000-4000-8000-000000000002';

update public.profiles
set
  display_name = 'Owner B',
  platform_role = 'standard'
where user_id = '91000000-0000-4000-8000-000000000003';

insert into public.salons (
  id,
  name,
  slug,
  status
)
values
  (
    '92000000-0000-4000-8000-000000000001',
    'Salone A',
    'salone-a-rls',
    'active'
  ),
  (
    '92000000-0000-4000-8000-000000000002',
    'Salone B',
    'salone-b-rls',
    'active'
  );

insert into public.salon_memberships (
  salon_id,
  user_id,
  role,
  status
)
values
  (
    '92000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000002',
    'owner',
    'active'
  ),
  (
    '92000000-0000-4000-8000-000000000002',
    '91000000-0000-4000-8000-000000000003',
    'owner',
    'active'
  );

insert into public.subscription_plans (
  id,
  code,
  name,
  included_voice_minutes
)
values (
  '93000000-0000-4000-8000-000000000001',
  'rls-test-300',
  'RLS Test 300',
  300
);

insert into public.salon_subscriptions (
  id,
  salon_id,
  plan_id,
  status,
  starts_on
)
values
  (
    '94000000-0000-4000-8000-000000000001',
    '92000000-0000-4000-8000-000000000001',
    '93000000-0000-4000-8000-000000000001',
    'active',
    '2026-08-01'
  ),
  (
    '94000000-0000-4000-8000-000000000002',
    '92000000-0000-4000-8000-000000000002',
    '93000000-0000-4000-8000-000000000001',
    'active',
    '2026-08-01'
  );

insert into public.usage_periods (
  salon_id,
  subscription_id,
  period_start,
  period_end,
  included_voice_minutes,
  used_voice_seconds
)
values
  (
    '92000000-0000-4000-8000-000000000001',
    '94000000-0000-4000-8000-000000000001',
    '2026-08-01',
    '2026-08-31',
    300,
    120
  ),
  (
    '92000000-0000-4000-8000-000000000002',
    '94000000-0000-4000-8000-000000000002',
    '2026-08-01',
    '2026-08-31',
    300,
    240
  );

insert into public.calls (
  salon_id,
  external_call_id,
  customer_phone,
  started_at,
  duration_seconds,
  outcome,
  transcript,
  recording_url,
  processing_status
)
values
  (
    '92000000-0000-4000-8000-000000000001',
    'rls-call-a',
    '+393331111111',
    '2026-08-02T08:00:00Z',
    120,
    'information_provided',
    '[{"speaker":"customer","text":"dato sensibile"}]'::jsonb,
    'https://example.test/a.mp3',
    'processed'
  ),
  (
    '92000000-0000-4000-8000-000000000002',
    'rls-call-b',
    '+393332222222',
    '2026-08-02T09:00:00Z',
    240,
    'booking_completed',
    '[{"speaker":"customer","text":"altro dato"}]'::jsonb,
    'https://example.test/b.mp3',
    'processed'
  );

insert into public.whatsapp_conversations (
  salon_id,
  external_conversation_key,
  customer_phone,
  status,
  control,
  summary
)
values
  (
    '92000000-0000-4000-8000-000000000001',
    'rls-wa-a',
    '+393333333333',
    'ai_handled',
    'ai',
    'Conversazione A'
  ),
  (
    '92000000-0000-4000-8000-000000000002',
    'rls-wa-b',
    '+393334444444',
    'completed',
    'ai',
    'Conversazione B'
  );

set local role authenticated;

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '91000000-0000-4000-8000-000000000002',
    'role',
    'authenticated'
  )::text,
  true
);

select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  'select count(*)::bigint from public.client_salons',
  'values (1::bigint)',
  'Owner A vede un solo salone'
);

select results_eq(
  'select salon_id from public.client_calls',
  $$
    values (
      '92000000-0000-4000-8000-000000000001'::uuid
    )
  $$,
  'Owner A vede soltanto le proprie chiamate'
);

select results_eq(
  'select salon_id from public.client_whatsapp_conversations',
  $$
    values (
      '92000000-0000-4000-8000-000000000001'::uuid
    )
  $$,
  'Owner A vede soltanto il proprio WhatsApp'
);

select results_eq(
  'select salon_id from public.client_usage_periods',
  $$
    values (
      '92000000-0000-4000-8000-000000000001'::uuid
    )
  $$,
  'Owner A vede soltanto il proprio consumo'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '91000000-0000-4000-8000-000000000003',
    'role',
    'authenticated'
  )::text,
  true
);

select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  'select customer_phone from public.client_calls',
  $$ values ('+393332222222'::text) $$,
  'Owner B non vede il numero del salone A'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '91000000-0000-4000-8000-000000000001',
    'role',
    'authenticated'
  )::text,
  true
);

select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  'select count(*)::bigint from public.client_calls',
  'values (2::bigint)',
  'L admin vede entrambi i saloni'
);

reset role;

select * from finish();

rollback;
