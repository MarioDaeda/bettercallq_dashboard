import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";
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
import type { IntegrationError } from "@/lib/domain";
import { formatDateTime } from "@/lib/overview/formatters";

export interface IntegrationErrorCardProps {
  errors: IntegrationError[];
  timeZone: string;
}

const providerLabels: Record<IntegrationError["provider"], string> = {
  vapi: "Telefono",
  whatsapp: "WhatsApp",
  treatwell: "Treatwell",
  google_calendar: "Google Calendar",
  internal: "BetterCallQ",
};

const severityVariants: Record<
  IntegrationError["severity"],
  "outline" | "warning" | "destructive"
> = {
  info: "outline",
  warning: "warning",
  error: "destructive",
  critical: "destructive",
};

const formatOpenErrorCount = (count: number) => {
  if (count === 0) return "Tutto regolare";
  if (count === 1) return "1 aperto";
  return `${count} aperti`;
};

export function IntegrationErrorCard({
  errors,
  timeZone,
}: IntegrationErrorCardProps) {
  const unresolved = errors.filter((error) =>
    ["open", "retrying"].includes(error.status),
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Errori e collegamenti</CardTitle>
          <CardDescription className="mt-1">
            Problemi comprensibili, senza codici tecnici.
          </CardDescription>
        </div>
        <Badge variant={unresolved.length > 0 ? "destructive" : "success"}>
          {formatOpenErrorCount(unresolved.length)}
        </Badge>
      </CardHeader>
      <CardContent>
        {errors.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-success/20 bg-success/[0.055] px-5 py-8 text-center">
            <div className="grid size-11 place-items-center rounded-2xl bg-success/12 text-success">
              <CheckCircle2 aria-hidden="true" className="size-5" />
            </div>
            <p className="mt-4 font-semibold">Nessun errore nel periodo</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Non risultano problemi di integrazione da mostrare.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {errors.slice(0, 3).map((error) => (
              <li className="rounded-2xl border bg-muted/[0.16] p-4" key={error.id}>
                <div className="flex gap-3">
                  <div
                    className={
                      error.status === "resolved"
                        ? "grid size-9 shrink-0 place-items-center rounded-xl bg-success/12 text-success"
                        : "grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/12 text-destructive"
                    }
                  >
                    {error.status === "resolved" ? (
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                    ) : (
                      <AlertTriangle aria-hidden="true" className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        {providerLabels[error.provider]}
                      </p>
                      <Badge variant={severityVariants[error.severity]}>
                        {error.status === "resolved" ? "Risolto" : "Da verificare"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {error.publicMessage}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      {formatDateTime(error.createdAt, timeZone)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button asChild className="mt-4 w-full" variant="outline">
          <Link href="/monitoraggio">
            Apri monitoraggio
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
