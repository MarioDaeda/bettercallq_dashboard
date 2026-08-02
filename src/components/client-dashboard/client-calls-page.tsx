import {
  CalendarCheck2,
  Clock3,
  PhoneCall,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { resolveClientCallPresentation } from "@/lib/client-dashboard/call-presentation";
import {
  calculateAverageCallDuration,
  countClientBookings,
  type ClientCallData,
  type ClientDashboardSnapshot,
} from "@/lib/client-dashboard/client-data";
import {
  formatCallDuration,
  formatClientDateTime,
  getCallOutcomeLabel,
} from "@/lib/client-dashboard/formatters";

import { VoiceUsageCard } from "./voice-usage-card";

interface ClientCallsPageProps {
  snapshot: ClientDashboardSnapshot;
}

function CallsList({
  calls,
  timeZone,
}: {
  calls: ClientCallData[];
  timeZone: string;
}) {
  if (calls.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nessuna chiamata nel periodo.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {calls.slice(0, 20).map((call) => {
        const presentation =
          resolveClientCallPresentation(call);

        return (
          <div
            className="grid gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-start"
            key={call.id}
          >
            <div className="min-w-0">
              <p className="font-semibold">
                {presentation.primaryLabel}
              </p>

              {presentation.secondaryPhone ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {presentation.secondaryPhone}
                </p>
              ) : null}

              <p className="mt-1 text-xs text-muted-foreground">
                {formatClientDateTime(
                  call.startedAt,
                  timeZone,
                )}
              </p>

              {presentation.requestedService ? (
                <p className="mt-3 text-sm">
                  <span className="font-semibold">
                    Servizio:
                  </span>{" "}
                  {presentation.requestedService}
                </p>
              ) : null}

              {presentation.summary ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {presentation.summary}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <p className="text-sm font-medium text-muted-foreground">
                {formatCallDuration(
                  call.durationSeconds,
                )}
              </p>
              <Badge
                variant={
                  call.outcome === "technical_error"
                    ? "warning"
                    : "secondary"
                }
              >
                {getCallOutcomeLabel(call.outcome)}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ClientCallsPage({
  snapshot,
}: ClientCallsPageProps) {
  const summary = [
    {
      icon: PhoneCall,
      label: "Chiamate",
      value: snapshot.calls.length.toLocaleString(
        "it-IT",
      ),
    },
    {
      icon: Clock3,
      label: "Durata media",
      value: formatCallDuration(
        calculateAverageCallDuration(
          snapshot.calls,
        ),
      ),
    },
    {
      icon: CalendarCheck2,
      label: "Appuntamenti",
      value: countClientBookings(
        snapshot.calls,
      ).toLocaleString("it-IT"),
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        badge={
          snapshot.source === "fixtures"
            ? "Monitoraggio · dati dimostrativi"
            : "Monitoraggio chiamate"
        }
        description="Consulta il consumo mensile e le chiamate ricevute. I numeri sono mostrati integralmente al salone."
        title="Chiamate"
      />

      <VoiceUsageCard
        range={snapshot.range}
        reportingDate={snapshot.reportingDate}
        usage={snapshot.usage}
      />

      <Card>
        <CardHeader>
          <CardTitle>Attività del mese</CardTitle>
          <CardDescription>
            Storico essenziale senza registrazioni,
            trascrizioni o dettagli tecnici.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {summary.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="rounded-xl border bg-muted/25 p-4"
                  key={item.label}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Icon
                      aria-hidden="true"
                      className="size-4"
                    />
                    {item.label}
                  </div>
                  <p className="mt-2 text-xl font-bold">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>

          <CallsList
            calls={snapshot.calls}
            timeZone={snapshot.salon.timezone}
          />
        </CardContent>
      </Card>
    </div>
  );
}
