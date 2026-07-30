import {
  Bot,
  CheckCircle2,
  CircleAlert,
  PhoneIncoming,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCallDuration } from "@/lib/calls/formatters";
import { callOutcomeLabels } from "@/lib/calls/labels";
import type { CallOutcome } from "@/lib/domain";
import type { CallSummary as CallSummaryData } from "@/lib/services/dashboard-service";
import { cn } from "@/lib/utils";

interface CallSummaryProps {
  summary: CallSummaryData;
}

const outcomeVariants: Record<
  CallOutcome,
  "success" | "secondary" | "warning" | "outline" | "destructive"
> = {
  booking_completed: "success",
  information_provided: "secondary",
  change_or_cancellation: "warning",
  transferred: "outline",
  incomplete: "warning",
  technical_error: "destructive",
  abandoned: "outline",
};

export function CallSummary({ summary }: CallSummaryProps) {
  const items: Array<{
    description: string;
    icon: LucideIcon;
    label: string;
    tone: string;
    value: string;
  }> = [
    {
      description: "nel periodo filtrato",
      icon: PhoneIncoming,
      label: "Chiamate",
      tone: "bg-primary/11 text-primary",
      value: summary.totalCalls.toString(),
    },
    {
      description: "sulle chiamate concluse",
      icon: Timer,
      label: "Durata media",
      tone: "bg-info/12 text-info",
      value: formatCallDuration(summary.averageDurationSeconds),
    },
    {
      description: "prenotazioni o informazioni",
      icon: Bot,
      label: "Risolte dall’IA",
      tone: "bg-success/12 text-success",
      value: summary.completedAutomatically.toString(),
    },
    {
      description: "incomplete, errori o abbandoni",
      icon: CircleAlert,
      label: "Da verificare",
      tone: "bg-warning/16 text-warning-foreground dark:text-warning",
      value: summary.needsAttention.toString(),
    },
  ];

  return (
    <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
      <section
        aria-label="Riepilogo chiamate"
        className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2"
      >
        {items.map(({ description, icon: Icon, label, tone, value }) => (
          <Card className="min-w-0 overflow-hidden" key={label}>
            <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:p-5">
              <div
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-2xl",
                  tone,
                )}
              >
                <Icon aria-hidden="true" className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold tracking-[-0.04em] sm:text-2xl">
                  {value}
                </p>
                <p className="text-[0.7rem] font-medium leading-4 sm:text-xs">
                  {label}
                </p>
                <p className="mt-0.5 hidden text-[0.68rem] leading-4 text-muted-foreground sm:block">
                  {description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="border-b bg-muted/15">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <CheckCircle2 aria-hidden="true" className="size-4" />
            </div>
            <CardTitle className="text-sm">Tutti gli esiti previsti</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-5">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(callOutcomeLabels) as CallOutcome[]).map(
              (outcome) => (
                <Badge key={outcome} variant={outcomeVariants[outcome]}>
                  {callOutcomeLabels[outcome]}
                  <span
                    aria-label={`${summary.outcomeCounts[outcome]} chiamate`}
                    className="ml-0.5 rounded-full bg-background/60 px-1.5 py-0.5 text-[0.65rem]"
                  >
                    {summary.outcomeCounts[outcome]}
                  </span>
                </Badge>
              ),
            )}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            I conteggi seguono i filtri attivi e includono anche gli esiti a
            zero, così lo stato del canale resta leggibile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
