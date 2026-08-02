import { PageHeader } from "@/components/shared/page-header";
import type { Salon } from "@/lib/domain";
import type {
  CalendarMonthRange,
  VoicePlanUsage,
} from "@/lib/client-dashboard/voice-usage";
import type { Overview } from "@/lib/services/dashboard-service";

import { MonthlyResultsCard } from "./monthly-results-card";
import { ServiceStatusCard } from "./service-status-card";
import { VoiceUsageCard } from "./voice-usage-card";

interface ClientOverviewProps {
  conversationCount: number;
  overview: Overview;
  range: CalendarMonthRange;
  reportingDate: string;
  salon: Salon;
  usage: VoicePlanUsage;
}

export function ClientOverview({
  conversationCount,
  overview,
  range,
  reportingDate,
  salon,
  usage,
}: ClientOverviewProps) {
  return (
    <div className="space-y-7">
      <PageHeader
        badge="Riepilogo del mese"
        description="Controlla l’utilizzo delle chiamate e lo stato complessivo dei servizi, senza configurazioni tecniche."
        title={`Ciao, ${salon.name}.`}
      />

      <VoiceUsageCard
        range={range}
        reportingDate={reportingDate}
        usage={usage}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ServiceStatusCard
          channels={overview.channels}
          timeZone={salon.timezone}
        />
        <MonthlyResultsCard
          bookings={overview.bookingsAttributed}
          calls={overview.callsReceived}
          conversations={conversationCount}
        />
      </div>
    </div>
  );
}
