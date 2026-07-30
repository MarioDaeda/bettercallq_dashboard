import { CheckCircle2, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

const foundations = [
  "Next.js App Router",
  "TypeScript strict",
  "Tailwind CSS",
  "shadcn/ui + Radix",
  "Zod",
  "Recharts",
  "Framer Motion",
];

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <section className="w-full max-w-3xl rounded-3xl border bg-card p-8 shadow-sm sm:p-12">
        <div className="mb-8 flex items-center gap-3">
          <div
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground"
          >
            BQ
          </div>
          <div>
            <p className="font-semibold">BetterCallQ</p>
            <p className="text-sm text-muted-foreground">
              Dashboard per il salone
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Base tecnica pronta
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Le fondamenta della dashboard sono configurate.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            Questa è la pagina iniziale minimale della Task 2. Le sezioni
            operative verranno aggiunte una alla volta nelle prossime attività.
          </p>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {foundations.map((foundation) => (
            <li
              key={foundation}
              className="flex items-center gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm"
            >
              <CheckCircle2
                aria-hidden="true"
                className="size-4 shrink-0 text-emerald-600"
              />
              {foundation}
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t pt-6">
          <Button asChild variant="outline">
            <a
              href="https://github.com/MarioDaeda/bettercallq_dashboard"
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink aria-hidden="true" data-icon="inline-start" />
              Apri il repository
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
