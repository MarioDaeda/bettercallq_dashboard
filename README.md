# BetterCallQ Dashboard

Dashboard privata per configurare e monitorare la receptionist IA BetterCallQ.
Treatwell rimane il sistema degli appuntamenti: questa applicazione non crea un
calendario parallelo.

## Stato del progetto

La Task 2 prepara soltanto le fondamenta tecniche. Le pagine operative, i dati
dimostrativi, il database e le integrazioni verranno aggiunti nelle attività
successive.

## Stack

- Next.js con App Router
- React e TypeScript in modalità `strict`
- Tailwind CSS
- shadcn/ui con primitive Radix
- Zod
- Recharts
- Framer Motion
- Lucide Icons

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
npm run build
```

## Struttura iniziale

```text
src/
├── app/                  # App Router, layout e pagine
├── components/ui/        # componenti shadcn/ui
└── lib/                  # utilità condivise
```

Le specifiche del prodotto e dell’architettura si trovano nella cartella
`docs/`.
