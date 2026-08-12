begin;

create extension if not exists pgtap with schema extensions;

set local search_path = extensions, public, pg_catalog;

select plan(5);

select has_function(
  'public',
  'current_app_identity',
  array[]::text[],
  'current_app_identity esiste senza parametri'
);

select has_index(
  'public',
  'salon_memberships',
  'salon_memberships_user_status_idx',
  'la lookup delle membership è indicizzata'
);

select ok(
  (
    select pg_proc.prosecdef
    from pg_proc
    join pg_namespace
      on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'current_app_identity'
      and pg_proc.pronargs = 0
  ),
  'current_app_identity è security definer'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.current_app_identity()',
    'EXECUTE'
  ),
  'authenticated può eseguire la funzione'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.current_app_identity()',
    'EXECUTE'
  ),
  'anon non può eseguire la funzione'
);

select * from finish();

rollback;
