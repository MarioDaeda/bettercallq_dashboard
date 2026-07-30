import { ArrowRight, CheckCircle2, Clock3, Siren } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Intervention } from "@/lib/domain";
import { formatDateTime } from "@/lib/overview/formatters";

export interface InterventionQueueProps {
  interventions: Intervention[];
  timeZone: string;
}

export function InterventionQueue({
  interventions,
  timeZone,
}: InterventionQueueProps) {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4 border-b bg-muted/15">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Coda urgente</CardTitle>
            {interventions.length > 0 ? (
              <Badge variant="destructive">
                {interventions.length} da vedere
              </Badge>
            ) : null}
          </div>
          <CardDescription className="mt-1">
            Prima le situazioni che richiedono una persona.
          </CardDescription>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/da-gestire">
            Apri coda
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-5 sm:pt-6">
        {interventions.length === 0 ? (
          <div className="flex min-h-36 items-center gap-4 rounded-2xl border border-success/20 bg-success/[0.055] p-5">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-success/12 text-success">
              <CheckCircle2 aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Nessuna urgenza aperta</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                BetterCallQ non segnala interventi urgenti in questo momento.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {interventions.map((intervention) => (
              <li key={intervention.id}>
                <Link
                  className="group flex gap-3 rounded-2xl border border-destructive/18 bg-destructive/[0.045] p-4 transition-colors hover:bg-destructive/[0.075] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  href="/da-gestire"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-destructive/12 text-destructive">
                    <Siren aria-hidden="true" className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{intervention.title}</p>
                      <Badge variant="destructive">Urgente</Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {intervention.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {intervention.customerName ? (
                        <span>{intervention.customerName}</span>
                      ) : null}
                      <span className="flex items-center gap-1.5">
                        <Clock3 aria-hidden="true" className="size-3.5" />
                        {formatDateTime(intervention.createdAt, timeZone)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
