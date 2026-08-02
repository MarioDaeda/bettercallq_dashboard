# Nucleo di ingestione — Task 8C.5

## Obiettivo

Questa task prepara il database a ricevere eventi reali senza creare ancora
endpoint pubblici nella dashboard.

Il server webhook esistente rimane responsabile di:

- ricevere l'evento dal provider;
- verificare firma, secret e autenticità;
- normalizzare il payload;
- determinare il `salon_id`;
- invocare la funzione RPC con una secret key server-side.

## Registro eventi

`external_events` garantisce idempotenza tramite:

```text
UNIQUE (salon_id, provider, external_event_id)
```

Se lo stesso webhook viene consegnato più volte, soltanto la prima elaborazione
modifica i dati applicativi.

## Ingestione Vapi

`ingest_vapi_call` esegue atomicamente:

1. deduplicazione dell'evento;
2. upsert della chiamata tramite `external_call_id`;
3. aggiornamento dello stato Vapi;
4. individuazione del mese nella timezone del salone;
5. individuazione del piano attivo;
6. ricalcolo del consumo mensile dalla somma delle chiamate.

Il consumo viene ricalcolato, non incrementato. Questo evita doppio addebito
quando Vapi consegna più snapshot della stessa chiamata o ritenta un webhook.

## Ingestione WhatsApp

`ingest_whatsapp_conversation` esegue:

1. deduplicazione dell'evento;
2. upsert del riepilogo conversazione;
3. aggiornamento di stato, controllo e ultimo messaggio;
4. aggiornamento dello stato del canale WhatsApp.

Questa task non salva ancora il corpo dei messaggi.

## Privilegi

Le funzioni:

- non sono eseguibili da `anon`;
- non sono eseguibili da `authenticated`;
- sono eseguibili soltanto da `service_role`;
- non devono essere chiamate direttamente dal browser.

## Verifica

```bash
npm run supabase:reset
npm run supabase:test
npm run lint
npm run test
npm run build
```

## Passo successivo

La task seguente applicherà le migrazioni al progetto Supabase remoto e
inizializzerà il salone pilota. Solo dopo verrà modificato il server Render per
invocare queste RPC con eventi Vapi reali.
