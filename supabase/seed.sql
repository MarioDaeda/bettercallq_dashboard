-- Dati deterministici per il salone pilota locale.
-- Il seed non assegna utenti: le membership richiedono UUID reali di auth.users.

insert into public.subscription_plans (
  id,
  code,
  name,
  included_voice_minutes,
  extra_minute_price_cents,
  billing_cycle_type,
  active
)
values (
  '20000000-0000-4000-8000-000000000001',
  'pilot-300',
  'Piano pilota 300 minuti',
  300,
  null,
  'calendar_month',
  true
)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  included_voice_minutes = excluded.included_voice_minutes,
  extra_minute_price_cents = excluded.extra_minute_price_cents,
  billing_cycle_type = excluded.billing_cycle_type,
  active = excluded.active;

insert into public.salons (
  id,
  name,
  slug,
  timezone,
  locale,
  phone_number,
  whatsapp_number,
  address,
  status
)
values (
  '10000000-0000-4000-8000-000000000001',
  'Studio Chioma Demo',
  'studio-chioma-demo',
  'Europe/Rome',
  'it-IT',
  '+390000000001',
  '+390000000002',
  '{
    "street": "Via Esempio 10",
    "city": "Forlì",
    "postalCode": "47121",
    "province": "FC",
    "country": "IT"
  }'::jsonb,
  'active'
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  timezone = excluded.timezone,
  locale = excluded.locale,
  phone_number = excluded.phone_number,
  whatsapp_number = excluded.whatsapp_number,
  address = excluded.address,
  status = excluded.status;

insert into public.salon_subscriptions (
  id,
  salon_id,
  plan_id,
  status,
  starts_on
)
values (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'active',
  '2026-08-01'
)
on conflict (id) do update set
  salon_id = excluded.salon_id,
  plan_id = excluded.plan_id,
  status = excluded.status,
  starts_on = excluded.starts_on;

insert into public.usage_periods (
  id,
  salon_id,
  subscription_id,
  period_start,
  period_end,
  included_voice_minutes,
  used_voice_seconds,
  calculated_at
)
values (
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '2026-08-01',
  '2026-08-31',
  300,
  0,
  now()
)
on conflict (id) do update set
  included_voice_minutes = excluded.included_voice_minutes,
  used_voice_seconds = excluded.used_voice_seconds,
  calculated_at = excluded.calculated_at;
