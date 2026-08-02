# Configurazione Supabase Auth — Task 8B

## 1. Crea il progetto

Creare un progetto Supabase dedicato a BetterCallQ. Per il pilota è sufficiente
il piano gratuito, tenendo presente che i progetti free possono essere sospesi
dopo inattività.

## 2. Variabili locali

Copiare:

```bash
cp .env.example .env.local
```

Inserire in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

La publishable key è destinata al client. Non usare né pubblicare la
`service_role`.

## 3. Impostazioni Auth

Nel pannello Supabase:

1. disabilitare la registrazione pubblica;
2. configurare il Site URL locale e quello Vercel;
3. aggiungere gli URL di redirect `/auth/callback`;
4. creare manualmente gli utenti pilota.

## 4. Metadati applicativi temporanei

La Task 8B legge ruolo e salone da `app_metadata`, non da `user_metadata`.

Esempio amministratore:

```json
{
  "app_role": "admin",
  "display_name": "Mario"
}
```

Esempio parrucchiere:

```json
{
  "app_role": "salon_owner",
  "display_name": "Nome parrucchiere",
  "salon_id": "salon-pilot"
}
```

Il valore `salon_id` deve coincidere con l'identificatore della fixture finché
la Task 8C non introduce il database e le membership persistenti.

## 5. Verifica locale

```bash
npm run dev
```

Aprire `http://localhost:3000`. Senza sessione la dashboard deve reindirizzare
a `/accedi`. Dopo il login:

- un admin vede sette sezioni;
- un proprietario vede quattro sezioni;
- un utente privo di metadati va a `/accesso-non-configurato`.

## 6. Limiti intenzionali

La Task 8B non introduce ancora:

- tabelle applicative;
- membership persistenti;
- Row Level Security;
- inviti automatici;
- recupero password personalizzato;
- autorizzazione di ogni service e mutazione.

Questi elementi appartengono alla Task 8C.
