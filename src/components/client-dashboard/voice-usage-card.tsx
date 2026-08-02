import { Clock3, Gauge, PlusCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatRenewalDate,
  formatUsageMonth,
  formatVoiceMinutes,
  type CalendarMonthRange,
  type VoicePlanUsage,
} from "@/lib/client-dashboard/voice-usage";
import { cn } from "@/lib/utils";

interface VoiceUsageCardProps {
  range: CalendarMonthRange;
  reportingDate: string;
  usage: VoicePlanUsage;
}

export function VoiceUsageCard({
  range,
  reportingDate,
  usage,
}: VoiceUsageCardProps) {
  const isNearLimit = usage.usagePercentage >= 80;
  const hasExtra = usage.extraSeconds > 0;
  const progressClassName =
    isNearLimit || hasExtra ? "bg-warning" : "bg-primary";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <Gauge aria-hidden="true" className="size-4" />
            Utilizzo chiamate
          </div>
          <CardTitle className="text-xl capitalize">
            {formatUsageMonth(reportingDate)}
          </CardTitle>
          <CardDescription>
            Il piano include {usage.includedMinutes} minuti di chiamate ogni
            mese.
          </CardDescription>
        </div>
        <Badge variant={hasExtra ? "warning" : "secondary"}>
          Piano {usage.includedMinutes} min
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              {formatVoiceMinutes(usage.includedSecondsUsed)}
              <span className="ml-2 text-base font-semibold text-muted-foreground">
                / {usage.includedMinutes} min
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              minuti inclusi utilizzati
            </p>
          </div>
          <p className="text-sm font-semibold">
            {Math.round(usage.usagePercentage)}%
          </p>
        </div>

        <div
          aria-label="Utilizzo dei minuti inclusi"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(usage.usagePercentage)}
          className="h-3 overflow-hidden rounded-full bg-muted"
          role="progressbar"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width]",
              progressClassName,
            )}
            style={{ width: `${usage.usagePercentage}%` }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-muted/35 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock3
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              Minuti disponibili
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatVoiceMinutes(usage.remainingSeconds)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Il conteggio si azzera il {formatRenewalDate(range)}.
            </p>
          </div>

          <div
            className={cn(
              "rounded-xl border p-4",
              hasExtra
                ? "border-warning/30 bg-warning/10"
                : "bg-muted/35",
            )}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <PlusCircle
                aria-hidden="true"
                className={cn(
                  "size-4",
                  hasExtra ? "text-warning" : "text-muted-foreground",
                )}
              />
              Minuti oltre il piano
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatVoiceMinutes(usage.extraSeconds)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasExtra
                ? "Consumo aggiuntivo maturato nel mese."
                : "Nessun minuto extra utilizzato."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
