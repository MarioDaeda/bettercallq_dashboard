# Identità persistente — Task 8C.2

## Obiettivo

La sessione applicativa viene risolta tramite:

```text
auth.users
→ profiles
→ salon_memberships
→ salons
```

`app_metadata` rimane soltanto come fallback quando la funzione database non è
ancora disponibile nel progetto Supabase remoto.

## Funzione `current_app_identity`

La migrazione crea una funzione PostgreSQL senza parametri che usa
esclusivamente `auth.uid()`.

La funzione:

- restituisce un'unica identità admin senza salone;
- restituisce le membership attive degli utenti standard;
- ignora saloni sospesi;
- non accetta uno `user_id` fornito dal client;
- è eseguibile soltanto dal ruolo `authenticated`.

Se un utente standard possiede zero o più di una membership attiva, l'app lo
considera non configurato. Un selettore multi-salone verrà progettato
separatamente.

## Bootstrap pilota

Prima del bootstrap, applicare entrambe le migrazioni al progetto Supabase:

```bash
npx supabase login
npx supabase link --project-ref IL_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

Poi caricare le variabili:

```bash
set -a
source .env.local
set +a

read -rsp "Supabase Secret key: " SUPABASE_SECRET_KEY
echo

export SUPABASE_SECRET_KEY
export ADMIN_USER_ID="UUID_ACCOUNT_ADMIN"
export SALON_OWNER_USER_ID="UUID_ACCOUNT_PARRUCCHIERE"

npm run supabase:bootstrap-pilot
```

La secret key deve essere inserita soltanto nella shell e rimossa dopo l'uso:

```bash
unset \
  SUPABASE_SECRET_KEY \
  ADMIN_USER_ID \
  SALON_OWNER_USER_ID
```

Lo script è idempotente e può essere rilanciato. Crea o aggiorna:

- profilo amministratore;
- profilo proprietario;
- salone pilota;
- membership `owner`;
- piano da 300 minuti;
- abbonamento attivo;
- periodo di utilizzo del mese corrente.

Aggiorna inoltre gli `app_metadata` temporanei, così il fallback continua a
funzionare durante la transizione.

## Comportamento della sessione

Ordine di risoluzione:

1. Supabase Auth verifica l'utente;
2. l'app invoca `current_app_identity`;
3. se la funzione restituisce un'identità valida, usa database e membership;
4. se la funzione esiste ma non trova una configurazione valida, blocca
   l'accesso;
5. se la funzione non è ancora disponibile, usa temporaneamente
   `app_metadata`.

La Task 8C.3 rimuoverà il fallback dopo l'introduzione e la verifica delle policy
RLS.
