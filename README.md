# BetterCallQ Dashboard

Dashboard privata per configurare e monitorare la receptionist IA BetterCallQ.
Treatwell rimane il sistema degli appuntamenti: questa applicazione non crea un
calendario parallelo.

## Stato del progetto

Le fondamenta del prototipo sono complete:

- scaffold Next.js con TypeScript strict;
- contratti runtime Zod e tipi derivati;
- fixture fittizie isolate tramite `salonId`;
- service layer mock;
- design system chiaro/scuro;
- app shell responsive;
- sette sezioni navigabili;
- Panoramica completa con KPI, canali, coda, grafico, attività ed errori;
- filtri temporali collegati al service mock;
- coda “Da gestire” con filtri, dettaglio, azioni simulate, risoluzione e
  riapertura;
- conteggi e urgenze sincronizzati tra coda, navigazione e Panoramica durante la
  sessione demo;
- storico “Chiamate” con riepilogo, filtri, paginazione, dettaglio, collegamenti
  a interventi e appuntamenti e trascrizioni espandibili;
- deep link bidirezionali tra chiamate e richieste “Da gestire”;
- inbox “WhatsApp” a due pannelli con ricerca, stati completi, cronologia,
  riferimenti e deep link verso “Da gestire”;
- presa e rilascio del controllo, invio manuale e completamento simulati con
  blocco delle risposte IA durante la gestione umana;
- “Impostazioni IA” completa con profilo informativo, servizi, orari e
  chiusure, FAQ, politiche, tono, regole di prenotazione ed escalation;
- validazione Zod, versionamento nel service mock e protezione delle modifiche
  non salvate, senza aggiornamento automatico di Vapi;
- “QR e canali” completa con numeri, stato connessioni, link `wa.me`,
  messaggio precompilato, anteprima e download QR in PNG e SVG;
- generazione QR locale dal solo numero e testo configurati, senza token Meta;
- “Monitoraggio” completo con volumi, durata, completamento, interventi,
  diagnostica, costo stimato e confronto tra periodi equivalenti;
- formule economiche centralizzate e fixture giornaliere estese a 14 giorni;
- loading, empty ed error state condivisi.

La milestone M1 del frontend con fixture è completa. Le Task 8A e 8B hanno
introdotto ruoli, navigazione per ruolo, Supabase Auth, sessioni cookie, login e
logout. Database, membership persistenti, isolamento `salonId` e autorizzazione
dei service proseguono nella Task 8C.

## Stack

- Next.js con App Router
- React e TypeScript in modalità `strict`
- Tailwind CSS
- shadcn/ui con primitive Radix
- Zod
- Recharts
- Framer Motion
- Lucide Icons
- Vitest

Non sono installati Gemini, Vercel AI SDK o strumenti per generare dashboard da
prompt.

## Avvio locale

Requisiti: Node.js 20.9 o successivo e npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Verifiche

```bash
npm run lint
npm run test
npm run build
```

## Struttura

```text
src/
├── app/                  # route, layout e stati Next.js
├── components/
│   ├── app-shell/        # sidebar, drawer, header e tema
│   ├── calls/            # storico, filtri, paginazione e dettaglio chiamate
│   ├── channels/         # stato canali, link WhatsApp e download QR
│   ├── interventions/    # coda, filtri, dettaglio e azioni simulate
│   ├── monitoring/       # KPI, confronti, costi e diagnostica
│   ├── overview/         # widget tipizzati della Panoramica
│   ├── settings/         # moduli strutturati delle Impostazioni IA
│   ├── shared/           # intestazioni e stati condivisi
│   ├── whatsapp/         # inbox, messaggi, controllo e invio simulato
│   └── ui/               # primitive UI
└── lib/
    ├── domain/           # schemi Zod e tipi TypeScript
    ├── fixtures/         # soli dati dimostrativi
    ├── calls/            # etichette, periodi e formattazione chiamate
    ├── channels/         # validazione e costruzione link WhatsApp
    ├── interventions/    # etichette e formattazione della coda
    ├── monitoring/       # periodi, aggregazioni, confronti e stime
    ├── overview/         # filtri e formattazione della Panoramica
    ├── settings/         # sezioni, helper e validazione del form
    ├── whatsapp/         # etichette e formattazione conversazioni
    └── services/         # contratto e implementazione mock
```

Le specifiche del prodotto e dell’architettura si trovano nella cartella
`docs/`.
