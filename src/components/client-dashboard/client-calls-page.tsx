import { CalendarCheck2, Clock3, PhoneCall } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
  formatCallDuration,
  formatClientDateTime,
  getCallOutcomeLabel,
} from "@/lib/client-dashboard/formatters";
import type {
  CalendarMonthRange,
  VoicePlanUsage,
} from "@/lib/client-dashboard/voice-usage";
import type {
  CallHistoryPage,
  CallListItem,
} from "@/lib/services/dashboard-service";

import { VoiceUsageCard } from "./voice-usage-card";

interface ClientCallsPageProps {
  history: CallHistoryPage;
  range: CalendarMonthRange;
  reportingDate: string;
  timeZone: string;
  usage: VoicePlanUsage;
}

function CallsList({
  items,
  timeZone,
}: {
  items: CallListItem[];
  timeZone: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nessuna chiamata nel periodo.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {items.map(({ call }) => (
        <div
          className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
          key={call.id}
        >
          <div className="min-w-0">
            <p className="font-semibold">
              {call.customerPhone ?? "Numero non disponibile"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatClientDateTime(call.startedAt, timeZone)}
            </p>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {formatCallDuration(call.durationSeconds)}
          </p>
          <Badge
            variant={
              call.outcome === "technical_error" ? "warning" : "secondary"
            }
          >
            {getCallOutcomeLabel(call.outcome)}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export function ClientCallsPage({
  history,
  range,
  reportingDate,
  timeZone,
  usage,
}: ClientCallsPageProps) {
  const bookings = history.items.filter(
    ({ call }) => call.outcome === "booking_completed",
  ).length;

  const summary = [
    {
      icon: PhoneCall,
      label: "Chiamate",
      value: history.summary.totalCalls.toLocaleString("it-IT"),
    },
    {
      icon: Clock3,
      label: "Durata media",
      value: formatCallDuration(history.summary.averageDurationSeconds),
    },
    {
      icon: CalendarCheck2,
      label: "Appuntamenti",
      value: bookings.toLocaleString("it-IT"),
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        badge="Monitoraggio chiamate"
        description="Consulta il consumo mensile e le chiamate ricevute. I numeri sono mostrati integralmente al salone."
        title="Chiamate"
      />

      <VoiceUsageCard
        range={range}
        reportingDate={reportingDate}
        usage={usage}
      />

      <Card>
        <CardHeader>
          <CardTitle>Attività del mese</CardTitle>
          <CardDescription>
            Storico essenziale senza registrazioni, trascrizioni o dettagli
            tecnici.
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
                    <Icon aria-hidden="true" className="size-4" />
                    {item.label}
                  </div>
                  <p className="mt-2 text-xl font-bold">{item.value}</p>
                </div>
              );
            })}
          </div>

          <CallsList items={history.items.slice(0, 20)} timeZone={timeZone} />
        </CardContent>
      </Card>
    </div>
  );
}
