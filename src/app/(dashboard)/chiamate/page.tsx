import type { Metadata } from "next";

import { CallsPageClient } from "@/components/calls/calls-page-client";
import { ClientCallsPage } from "@/components/client-dashboard/client-calls-page";
import { requireAppSession } from "@/lib/auth/session";
import {
  calculateVoicePlanUsage,
  resolveCalendarMonthRange,
} from "@/lib/client-dashboard/voice-usage";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";

export const metadata: Metadata = {
  title: "Chiamate",
};

interface CallsPageProps {
  searchParams: Promise<{
    call?: string | string[];
  }>;
}

export default async function CallsPage({ searchParams }: CallsPageProps) {
  const session = await requireAppSession();

  if (session.role === "salon_owner") {
    const salonId = session.salonId ?? PILOT_SALON_ID;
    const [salon, reportingDate] = await Promise.all([
      dashboardService.getSalon(salonId),
      dashboardService.getReportingDate(salonId),
    ]);
    const range = resolveCalendarMonthRange(reportingDate);
    const history = await dashboardService.listCallHistory(salonId, {
      from: range.from,
      to: range.to,
      page: 1,
      pageSize: 100,
    });

    return (
      <ClientCallsPage
        history={history}
        range={range}
        reportingDate={reportingDate}
        timeZone={salon.timezone}
        usage={calculateVoicePlanUsage(
          history.items.map(({ call }) => call),
        )}
      />
    );
  }

  const query = await searchParams;
  const initialCallId = Array.isArray(query.call) ? query.call[0] : query.call;

  return <CallsPageClient initialCallId={initialCallId} />;
}
