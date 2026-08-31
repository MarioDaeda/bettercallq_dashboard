# Pilot BetterCallQ con slot riservati

## Obiettivo

Il salone affida a BetterCallQ fasce precise su un Google Calendar dedicato.
L'assistente può proporre e prenotare soltanto quelle fasce. Treatwell rimane il
gestionale definitivo: l'operatore riporta manualmente le operazioni mostrate
nella pagina **Da gestire**.

## Flusso

1. Il parrucchiere crea un evento Calendar con titolo `BCQ_AVAILABLE`.
2. Il backend legge gli eventi del giorno e sottrae gli appuntamenti esistenti.
3. Al momento della conferma, Supabase reclama atomicamente l'intervallo.
4. Il backend crea l'evento Calendar con il `bookingId` nelle proprietà private.
5. Supabase porta la prenotazione a `confirmed` e `treatwell_status=to_sync`.
6. La dashboard mostra l'operazione e l'operatore la marca come completata.

Le prenotazioni `pending` o `failed` non entrano mai nella coda Treatwell.

## Preparazione staging

1. Creare o scegliere un progetto Supabase di staging.
2. Applicare tutte le migrazioni, inclusa
   `20260810190000_reserved_slot_booking.sql`.
3. Eseguire `supabase test db`; il file
   `reserved_slot_booking.test.sql` contiene 16 verifiche.
4. Configurare sul backend `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e
   `BETTERCALLQ_SALON_ID` dello staging.
5. Creare un Google Calendar di prova e condividerlo con il service account.
6. Impostare il suo ID in `CALENDAR_ID`.
7. Creare due o tre finestre `BCQ_AVAILABLE` future.
8. Configurare in Vapi le tool presenti in `vapi/tool-definitions.json`.

## Collaudo end-to-end

Verificare, nell'ordine:

- un vuoto dell'agenda senza `BCQ_AVAILABLE` non viene proposto;
- una finestra troppo corta non viene proposta;
- una prenotazione crea una sola riga Supabase e un solo evento Calendar;
- un retry Vapi non duplica la prenotazione;
- due richieste simultanee producono un solo claim;
- Calendar non disponibile produce `failed`, mai `to_sync`;
- la nuova prenotazione appare in **Da gestire**;
- “Segna come inserito” porta lo stato a `synced`;
- la cancellazione di un elemento già sincronizzato produce
  `cancellation_required`;
- lo spostamento prenota il nuovo slot prima di cancellare quello precedente.

## Avvio pilot

Iniziare con pochi slot e con i servizi dalla durata più prevedibile. Il salone
deve bloccare le stesse fasce anche nel proprio processo Treatwell e definire il
tempo massimo entro cui l'operatore riporta la prenotazione manualmente.

Non estendere il pilot prima che prenotazione, retry, cancellazione e
riconciliazione siano stati provati su staging.
