# Supabase Database — Task 8C.1

## Scopo

Questa task introduce la prima migrazione versionata del database BetterCallQ.
La dashboard continua a usare le fixture: lo schema non viene ancora interrogato
dalle pagine.

## Tabelle

La migrazione crea:

- `profiles`;
- `salons`;
- `salon_memberships`;
- `subscription_plans`;
- `salon_subscriptions`;
- `usage_periods`;
- `calls`;
- `whatsapp_conversations`;
- `whatsapp_messages`;
- `channel_statuses`;
- `audit_events`.

## Sicurezza iniziale

RLS è abilitata su tutte le tabelle. Non esistono ancora policy per `anon` o
`authenticated`, e i privilegi sono revocati a entrambi i ruoli.

Questa è una chiusura intenzionale: la Task 8C.3 introdurrà policy basate su
profilo, membership e `salonId`. Fino ad allora il frontend non deve interrogare
direttamente queste tabelle.

## Profili

`profiles.user_id` riferisce esclusivamente la chiave primaria di `auth.users`.
Un trigger crea il profilo per i nuovi utenti. La migrazione esegue anche il
backfill degli utenti Auth già presenti.

Il ruolo applicativo persistente è separato in:

- `profiles.platform_role`: `admin` oppure `standard`;
- `salon_memberships.role`: ruolo dell'utente nel singolo salone.

## Piano voce

Il seed locale crea:

```text
Piano pilota 300 minuti
billing cycle: calendar_month
```

`usage_periods` salva i secondi usati e calcola nel database:

- secondi rimanenti;
- secondi oltre il piano.

Il prezzo dei minuti extra resta `NULL` finché non viene definito
contrattualmente.

## Applicazione locale

La migrazione segue il workflow Supabase CLI:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

`db reset` ricrea il database locale applicando le migrazioni e il seed.
I test SQL sono in `supabase/tests/database`.

## Collegamento al progetto remoto

Non eseguire il push prima della revisione della PR.

Dopo il merge:

```bash
npx supabase login
npx supabase link --project-ref IL_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

Da questo momento le modifiche allo schema devono passare tramite migrazioni
versionate, non tramite Table Editor o SQL Editor sul database remoto.

## Passi successivi

- Task 8C.2: profili, membership e bootstrap del salone pilota;
- Task 8C.3: policy RLS e test di isolamento;
- Task 8C.4: repository reali per chiamate e WhatsApp;
- Task 8C.5: calcolo e aggiornamento dei consumi reali.
