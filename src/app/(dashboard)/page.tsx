import type { Metadata } from "next";
import {
  CalendarCheck2,
  CircleAlert,
  PhoneCall,
  WalletCards,
} from "lucide-react";

import {
  DashboardWidgetRenderer,
  type DashboardWidget,
} from "@/components/overview/dashboard-widget-renderer";
import { InterventionAttentionValue } from "@/components/interventions/intervention-session-context";
import { PeriodFilter } from "@/components/overview/period-filter";
import { PageHeader } from "@/components/shared/page-header";
import {
  overviewPeriodLabels,
  parseOverviewPeriod,
  resolveOverviewRange,
} from "@/lib/overview/date-range";
import {
  formatCurrencyCents,
  formatInteger,
  formatLocalDate,
} from "@/lib/overview/formatters";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";

export const metadata: Metadata = {
  title: "Panoramica",
};

interface OverviewPageProps {
  searchParams: Promise<{
    period?: string | string[];
  }>;
}

export default async function OverviewPage({
  searchParams,
}: OverviewPageProps) {
  const query = await searchParams;
  const period = parseOverviewPeriod(query.period);
  const [salon, reportingDate] = await Promise.all([
    dashboardService.getSalon(PILOT_SALON_ID),
    dashboardService.getReportingDate(PILOT_SALON_ID),
  ]);
  const range = resolveOverviewRange(reportingDate, period);
  const overview = await dashboardService.getOverview(
    PILOT_SALON_ID,
    range,
  );
  const periodLabel = overviewPeriodLabels[period];

  const widgets: DashboardWidget[] = [
    {
      id: "calls-received",
      kind: "kpi",
      layout: "kpi",
      props: {
        description: `${periodLabel}: richieste entrate sul canale vocale.`,
        icon: PhoneCall,
        label: "Chiamate ricevute",
        tone: "primary",
        value: formatInteger(overview.callsReceived),
      },
    },
    {
      id: "bookings-attributed",
      kind: "kpi",
      layout: "kpi",
      props: {
        description: "Appuntamenti attribuiti a BetterCallQ nel periodo.",
        icon: CalendarCheck2,
        label: "Prenotazioni",
        tone: "success",
        value: formatInteger(overview.bookingsAttributed),
      },
    },
    {
      id: "open-interventions",
      kind: "kpi",
      layout: "kpi",
      props: {
        description: "Richieste ancora aperte o in lavorazione, adesso.",
        icon: CircleAlert,
        label: "Da gestire",
        tone: overview.openInterventions > 0 ? "warning" : "success",
        value: (
          <InterventionAttentionValue fallback={overview.openInterventions} />
        ),
      },
    },
    {
      id: "monthly-cost",
      kind: "kpi",
      layout: "kpi",
      props: {
        description: `${formatCurrencyCents(overview.estimatedCostCents)} nel periodo; proiezione su 30 giorni.`,
        icon: WalletCards,
        label: "Costo mensile stimato",
        tone: "info",
        value: formatCurrencyCents(overview.estimatedMonthlyCostCents),
      },
    },
    {
      id: "channels",
      kind: "channels",
      layout: "channels",
      props: {
        channels: overview.channels,
        timeZone: salon.timezone,
      },
    },
    {
      id: "urgent-queue",
      kind: "queue",
      layout: "queue",
      props: {
        interventions: overview.urgentInterventions,
        timeZone: salon.timezone,
      },
    },
    {
      id: "usage-trend",
      kind: "trend",
      layout: "trend",
      props: {
        metrics: overview.metrics,
        periodLabel,
      },
    },
    {
      id: "integration-errors",
      kind: "errors",
      layout: "errors",
      props: {
        errors: overview.recentErrors,
        timeZone: salon.timezone,
      },
    },
    {
      id: "recent-activity",
      kind: "activity",
      layout: "activity",
      props: {
        activities: overview.recentActivities,
        timeZone: salon.timezone,
      },
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader
          badge="Panoramica · dati dimostrativi"
          description="Controlla in pochi secondi se la receptionist è operativa, cosa richiede attenzione e ciò che ha gestito per il salone."
          title="Il salone, sotto controllo a colpo d’occhio."
        />
        <div className="shrink-0">
          <PeriodFilter activePeriod={period} />
          <p className="mt-2 text-right text-[0.7rem] text-muted-foreground">
            Dati disponibili fino al {formatLocalDate(reportingDate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
        {widgets.map((widget) => (
          <DashboardWidgetRenderer key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  );
}
