begin;

create extension if not exists pgtap with schema extensions;

set local search_path = extensions, public, pg_catalog;

select plan(16);

select has_table('public', 'profiles', 'profiles esiste');
select has_table('public', 'salons', 'salons esiste');
select has_table(
  'public',
  'salon_memberships',
  'salon_memberships esiste'
);
select has_table(
  'public',
  'subscription_plans',
  'subscription_plans esiste'
);
select has_table(
  'public',
  'salon_subscriptions',
  'salon_subscriptions esiste'
);
select has_table('public', 'usage_periods', 'usage_periods esiste');
select has_table('public', 'calls', 'calls esiste');
select has_table(
  'public',
  'whatsapp_conversations',
  'whatsapp_conversations esiste'
);
select has_table(
  'public',
  'whatsapp_messages',
  'whatsapp_messages esiste'
);
select has_table(
  'public',
  'channel_statuses',
  'channel_statuses esiste'
);
select has_table('public', 'audit_events', 'audit_events esiste');

select col_is_pk(
  'public',
  'profiles',
  'user_id',
  'profiles.user_id è la chiave primaria'
);

select col_is_pk(
  'public',
  'salons',
  'id',
  'salons.id è la chiave primaria'
);

select has_index(
  'public',
  'calls',
  'calls_salon_started_at_idx',
  'calls ha indice per salone e data'
);

select has_index(
  'public',
  'whatsapp_conversations',
  'whatsapp_conversations_salon_last_message_idx',
  'WhatsApp ha indice per salone e ultimo messaggio'
);

select ok(
  (
    select bool_and(pg_class.relrowsecurity)
    from pg_class
    join pg_namespace
      on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname = any(
        array[
          'profiles',
          'salons',
          'salon_memberships',
          'subscription_plans',
          'salon_subscriptions',
          'usage_periods',
          'calls',
          'whatsapp_conversations',
          'whatsapp_messages',
          'channel_statuses',
          'audit_events'
        ]
      )
  ),
  'RLS è abilitata su tutte le tabelle applicative'
);

select * from finish();

rollback;
