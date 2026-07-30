import {
  CalendarCheck2,
  ChevronRight,
  CircleAlert,
  Clock3,
  PhoneCall,
  Timer,
} from "lucide-react";

import { CallPagination } from "@/components/calls/call-pagination";
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
import {
  formatCallDuration,
  formatPhoneNumber,
} from "@/lib/calls/formatters";
import {
  callOutcomeLabels,
  callProcessingStatusLabels,
} from "@/lib/calls/labels";
import type { CallOutcome } from "@/lib/domain";
import { interventionStatusLabels } from "@/lib/interventions/labels";
import { formatDateTime } from "@/lib/overview/formatters";
import type { CallListItem } from "@/lib/services/dashboard-service";
import { cn } from "@/lib/utils";

interface CallListProps {
  items: CallListItem[];
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onSelect: (callId: string) => void;
  page: number;
  selectedId: string | null;
  timeZone: string;
  totalItems: number;
  totalPages: number;
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

export function CallList({
  items,
  onPageChange,
  onResetFilters,
  onSelect,
  page,
  selectedId,
  timeZone,
  totalItems,
  totalPages,
}: CallListProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="border-b bg-muted/15">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Storico delle chiamate</CardTitle>
            <CardDescription className="mt-1">
              Le più recenti sono in alto. Apri una voce per leggere esito,
              riferimenti e trascrizione disponibile.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {totalItems} {totalItems === 1 ? "voce" : "voci"}
          </Badge>
        </div>
      </CardHeader>

      {items.length === 0 ? (
        <CardContent className="pt-5 sm:pt-6">
          <EmptyState
            className="min-h-[28rem]"
            description="Non risultano chiamate con l’esito e il periodo selezionati. Puoi ampliare l’intervallo oppure azzerare i filtri."
            eyebrow="Storico filtrato"
            title="Nessuna chiamata trovata"
          >
            <Button onClick={onResetFilters} type="button" variant="outline">
              Azzera i filtri
            </Button>
          </EmptyState>
        </CardContent>
      ) : (
        <>
          <CardContent className="pt-5 sm:pt-6">
            <ol className="space-y-3">
              {items.map(({ call, intervention, bookingReference }) => {
                const selected = selectedId === call.id;

                return (
                  <li key={call.id}>
                    <button
                      aria-label={`Apri chiamata di ${call.customerName ?? formatPhoneNumber(call.customerPhone)}`}
                      aria-pressed={selected}
                      className={cn(
                        "group w-full rounded-2xl border p-4 text-left transition duration-200 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none sm:p-5",
                        selected
                          ? "border-primary/35 bg-primary/[0.065] shadow-[0_10px_30px_oklch(0.55_0.2_285/0.09)]"
                          : "bg-background/45 hover:border-primary/25 hover:bg-muted/35",
                      )}
                      onClick={() => onSelect(call.id)}
                      type="button"
                    >
                      <div className="flex min-w-0 items-start gap-3.5">
                        <div
                          className={cn(
                            "grid size-10 shrink-0 place-items-center rounded-2xl",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground",
                          )}
                        >
                          <PhoneCall aria-hidden="true" className="size-4.5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-semibold tracking-tight">
                                {call.customerName ?? "Cliente non identificato"}
                              </p>
                              <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                                {formatPhoneNumber(call.customerPhone)}
                              </p>
                            </div>
                            <ChevronRight
                              aria-hidden="true"
                              className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                            />
                          </div>

                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {call.summary ??
                              "Nessun riepilogo disponibile per questa chiamata."}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant={outcomeVariants[call.outcome]}>
                              {callOutcomeLabels[call.outcome]}
                            </Badge>
                            {intervention ? (
                              <Badge
                                variant={
                                  ["open", "in_progress"].includes(
                                    intervention.status,
                                  )
                                    ? "warning"
                                    : "outline"
                                }
                              >
                                <CircleAlert
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                                {interventionStatusLabels[intervention.status]}
                              </Badge>
                            ) : null}
                            {bookingReference ? (
                              <Badge variant="outline">
                                <CalendarCheck2
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                                Appuntamento
                              </Badge>
                            ) : null}
                            {call.processingStatus !== "processed" ? (
                              <Badge variant="destructive">
                                {
                                  callProcessingStatusLabels[
                                    call.processingStatus
                                  ]
                                }
                              </Badge>
                            ) : null}
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Clock3 aria-hidden="true" className="size-3.5" />
                              {formatDateTime(call.startedAt, timeZone)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Timer
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              {formatCallDuration(call.durationSeconds)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </CardContent>

          <CallPagination
            onPageChange={onPageChange}
            page={page}
            totalItems={totalItems}
            totalPages={totalPages}
          />
        </>
      )}
    </Card>
  );
}
