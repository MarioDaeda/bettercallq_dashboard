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
- loading, empty ed error state condivisi.

Le pagine operative restano intenzionalmente minimali. Verranno completate una
alla volta nelle task successive, iniziando dalla Panoramica.

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
│   ├── shared/           # intestazioni e stati condivisi
│   └── ui/               # primitive UI
└── lib/
    ├── domain/           # schemi Zod e tipi TypeScript
    ├── fixtures/         # soli dati dimostrativi
    └── services/         # contratto e implementazione mock
```

Le specifiche del prodotto e dell’architettura si trovano nella cartella
`docs/`.
