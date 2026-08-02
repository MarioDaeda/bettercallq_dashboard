# Repository read-only — Task 8C.4

## Obiettivo

La dashboard cliente può leggere le viste Supabase protette da RLS senza
modificare la console amministrativa e senza esporre colonne sensibili.

## Selettore della sorgente dati

La variabile server-side controlla la sorgente:

```env
BETTERCALLQ_CLIENT_DATA_SOURCE=fixtures
```

Valori ammessi:

- `fixtures`: comportamento predefinito e sicuro durante la transizione;
- `supabase`: lettura reale delle viste protette.

Il valore non usa il prefisso `NEXT_PUBLIC_` e non viene inviato al browser.

## Repository unico

Le tre pagine cliente caricano uno snapshot mensile comune:

- salone;
- periodo di utilizzo;
- chiamate;
- conversazioni WhatsApp;
- stato dei canali.

Il repository Supabase interroga esclusivamente:

- `client_salons`;
- `client_usage_periods`;
- `client_calls`;
- `client_whatsapp_conversations`;
- `client_channel_statuses`.

La sessione autenticata viene propagata dal client SSR Supabase. RLS determina
le righe accessibili.

## Difesa aggiuntiva

Oltre a RLS, il mapping applicativo:

- valida ogni risposta con Zod;
- richiede che ogni riga abbia il `salon_id` atteso;
- rifiuta risultati multi-salone;
- filtra gli eventi usando la timezone del salone;
- non contiene campi per transcript, recording o messaggi.

## Attivazione

Non attivare la modalità reale prima di:

```bash
npm run supabase:reset
npm run supabase:test
```

e, sul progetto remoto:

```bash
npx supabase link --project-ref IL_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
npm run supabase:bootstrap-pilot
```

Dopo il bootstrap, impostare in locale o su Vercel:

```env
BETTERCALLQ_CLIENT_DATA_SOURCE=supabase
```

La Task 8C.5 alimenterà chiamate, WhatsApp e consumi con eventi reali. Fino ad
allora le viste possono essere correttamente vuote.
