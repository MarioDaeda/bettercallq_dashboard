# Costi reali delle chiamate Vapi

## Unità

I costi sono salvati in **microdollari USD**:

```text
1 USD = 1.000.000 microdollari
```

Il valore Vapi `0.1413` diventa quindi `141300`.

Questa rappresentazione evita l'uso di floating point nel database e preserva
una precisione sufficiente per singola chiamata e aggregazioni mensili.

## Colonne

La tabella `calls` contiene:

- totale;
- STT;
- LLM;
- TTS;
- piattaforma Vapi;
- trasporto;
- chat;
- knowledge base.

I nomi delle colonne includono esplicitamente `usd_micros`, quindi la valuta
non è implicita.

## Compatibilità

La RPC `ingest_vapi_call` resta disponibile durante la transizione. Il backend
aggiornato userà `ingest_vapi_call_v2`; questo evita interruzioni tra migrazione
Supabase e deploy Render.

## Sicurezza

- la RPC v2 è eseguibile soltanto da `service_role`;
- il browser continua a leggere viste `security_invoker`;
- non vengono esposti transcript, registrazioni o ID provider;
- i costi sono read-only per gli utenti autenticati.
