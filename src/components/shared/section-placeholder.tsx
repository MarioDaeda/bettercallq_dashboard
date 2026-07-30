import { CheckCircle2, Layers3, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";

interface SectionPlaceholderProps {
  description: string;
  nextTask: string;
  title: string;
}

const readinessItems = [
  {
    icon: CheckCircle2,
    label: "Route attiva",
    description: "La sezione è raggiungibile dalla navigazione.",
  },
  {
    icon: Layers3,
    label: "Stati condivisi",
    description: "Loading, vuoto ed errore sono già disponibili.",
  },
  {
    icon: ShieldCheck,
    label: "Confini protetti",
    description: "Nessuna integrazione reale viene anticipata.",
  },
];

export function SectionPlaceholder({
  description,
  nextTask,
  title,
}: SectionPlaceholderProps) {
  return (
    <div className="space-y-7">
      <PageHeader
        badge="Struttura pronta"
        description={description}
        title={title}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Area operativa</CardTitle>
            <CardDescription>
              I contenuti specifici verranno implementati nella relativa task,
              usando esclusivamente il service layer.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 sm:pt-6">
            <EmptyState
              description={`La shell è completa. ${nextTask} aggiungerà funzioni e dati dimostrativi senza collegare provider reali.`}
              eyebrow="Prossima attività"
              title="Contenuto intenzionalmente minimale"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pronta per crescere</CardTitle>
            <CardDescription>
              La base comune resta stabile mentre le pagine vengono completate
              una alla volta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {readinessItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li className="flex gap-3" key={item.label}>
                    <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon aria-hidden="true" className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
