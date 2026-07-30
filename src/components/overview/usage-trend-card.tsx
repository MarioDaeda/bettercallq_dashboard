import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DailyMetric } from "@/lib/domain";

import { UsageChart } from "./usage-chart";

export interface UsageTrendCardProps {
  metrics: DailyMetric[];
  periodLabel: string;
}

export function UsageTrendCard({
  metrics,
  periodLabel,
}: UsageTrendCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Chiamate e prenotazioni</CardTitle>
          <CardDescription className="mt-1">
            Andamento per {periodLabel.toLocaleLowerCase("it-IT")}.
          </CardDescription>
        </div>
        <div
          aria-label="Legenda del grafico"
          className="flex flex-wrap gap-3 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-1" />
            Chiamate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-2" />
            Prenotazioni
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <EmptyState
            className="min-h-64"
            description="Non ci sono ancora metriche dimostrative per l’intervallo selezionato."
            eyebrow="Periodo vuoto"
            title="Nessun andamento da mostrare"
          />
        ) : (
          <UsageChart metrics={metrics} />
        )}
      </CardContent>
    </Card>
  );
}
