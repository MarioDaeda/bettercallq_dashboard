import { PageHeader } from "@/components/shared/page-header";
import {
  countClientBookings,
  type ClientDashboardSnapshot,
} from "@/lib/client-dashboard/client-data";

import { MonthlyResultsCard } from "./monthly-results-card";
import { ServiceStatusCard } from "./service-status-card";
import { VoiceUsageCard } from "./voice-usage-card";

interface ClientOverviewProps {
  snapshot: ClientDashboardSnapshot;
}

export function ClientOverview({
  snapshot,
}: ClientOverviewProps) {
  const badge =
    snapshot.source === "fixtures"
      ? "Riepilogo · dati dimostrativi"
      : "Riepilogo del mese";

  return (
    <div className="space-y-7">
      <PageHeader
        badge={badge}
        description="Controlla l’utilizzo delle chiamate e lo stato complessivo dei servizi, senza configurazioni tecniche."
        title={`Ciao, ${snapshot.salon.name}.`}
      />

      <VoiceUsageCard
        range={snapshot.range}
        reportingDate={snapshot.reportingDate}
        usage={snapshot.usage}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ServiceStatusCard
          channels={snapshot.channels}
          timeZone={snapshot.salon.timezone}
        />
        <MonthlyResultsCard
          bookings={countClientBookings(snapshot.calls)}
          calls={snapshot.calls.length}
          conversations={snapshot.conversations.length}
        />
      </div>
    </div>
  );
}
