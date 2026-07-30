import {
  CalendarClock,
  ChevronRight,
  Clock3,
  MessageCircle,
  Phone,
  PlugZap,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  Intervention,
  InterventionPriority,
  InterventionSource,
  InterventionStatus,
} from "@/lib/domain";
import { formatInterventionAge } from "@/lib/interventions/formatters";
import {
  interventionPriorityLabels,
  interventionReasonLabels,
  interventionSourceLabels,
  interventionStatusLabels,
} from "@/lib/interventions/labels";
import { formatDateTime } from "@/lib/overview/formatters";
import { cn } from "@/lib/utils";

interface InterventionListProps {
  interventions: Intervention[];
  onResetFilters: () => void;
  onSelect: (interventionId: string) => void;
  referenceTime: string;
  selectedId: string | null;
  timeZone: string;
}

const sourceIcons: Record<InterventionSource, LucideIcon> = {
  call: Phone,
  whatsapp: MessageCircle,
  booking: CalendarClock,
  integration: PlugZap,
};

const priorityVariants: Record<
  InterventionPriority,
  "destructive" | "warning" | "secondary" | "outline"
> = {
  urgent: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

const statusVariants: Record<
  InterventionStatus,
  "destructive" | "warning" | "success" | "outline"
> = {
  open: "destructive",
  in_progress: "warning",
  resolved: "success",
  dismissed: "outline",
};

export function InterventionList({
  interventions,
  onResetFilters,
  onSelect,
  referenceTime,
  selectedId,
  timeZone,
}: InterventionListProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="border-b bg-muted/15">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Coda degli interventi</CardTitle>
            <CardDescription className="mt-1">
              Ordinata per priorità e stato, con le richieste più importanti in
              alto.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {interventions.length}{" "}
            {interventions.length === 1 ? "elemento" : "elementi"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 sm:pt-6">
        {interventions.length === 0 ? (
          <EmptyState
            className="min-h-[28rem]"
            description="Non ci sono richieste che corrispondono ai filtri selezionati. Puoi ampliare la ricerca oppure tornare alla coda attiva."
            eyebrow="Coda filtrata"
            title="Nessun intervento trovato"
          >
            <Button onClick={onResetFilters} type="button" variant="outline">
              Azzera i filtri
            </Button>
          </EmptyState>
        ) : (
          <ol className="space-y-3">
            {interventions.map((intervention) => {
              const SourceIcon = sourceIcons[intervention.source];
              const selected = intervention.id === selectedId;

              return (
                <li key={intervention.id}>
                  <button
                    aria-label={`Apri il dettaglio: ${intervention.title}`}
                    aria-pressed={selected}
                    className={cn(
                      "group w-full rounded-2xl border p-4 text-left transition duration-200 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none sm:p-5",
                      selected
                        ? "border-primary/35 bg-primary/[0.065] shadow-[0_10px_30px_oklch(0.55_0.2_285/0.09)]"
                        : "bg-background/45 hover:border-primary/25 hover:bg-muted/35",
                    )}
                    onClick={() => onSelect(intervention.id)}
                    type="button"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-2xl",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        <SourceIcon aria-hidden="true" className="size-4.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold tracking-tight">
                              {intervention.title}
                            </p>
                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                              {interventionSourceLabels[intervention.source]}
                              {" · "}
                              {interventionReasonLabels[intervention.reason]}
                            </p>
                          </div>
                          <ChevronRight
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                          />
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {intervention.summary}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge
                            variant={priorityVariants[intervention.priority]}
                          >
                            Priorità{" "}
                            {interventionPriorityLabels[
                              intervention.priority
                            ].toLowerCase()}
                          </Badge>
                          <Badge variant={statusVariants[intervention.status]}>
                            {interventionStatusLabels[intervention.status]}
                          </Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <UserRound
                              aria-hidden="true"
                              className="size-3.5"
                            />
                            {intervention.customerName ?? "Cliente non indicato"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock3 aria-hidden="true" className="size-3.5" />
                            Da{" "}
                            {formatInterventionAge(
                              intervention.createdAt,
                              referenceTime,
                            )}
                          </span>
                          <span className="sr-only sm:not-sr-only">
                            {formatDateTime(
                              intervention.createdAt,
                              timeZone,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
