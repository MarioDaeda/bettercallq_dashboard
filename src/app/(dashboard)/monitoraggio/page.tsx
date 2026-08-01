import type { Metadata } from "next";

import { MonitoringPageContent } from "@/components/monitoring/monitoring-page-content";
import {
  parseMonitoringPeriod,
  resolveMonitoringRanges,
} from "@/lib/monitoring/monitoring";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";

export const metadata: Metadata = {
  title: "Monitoraggio",
};

interface MonitoringPageProps {
  searchParams: Promise<{
    period?: string | string[];
  }>;
}

export default async function MonitoringPage({
  searchParams,
}: MonitoringPageProps) {
  const query = await searchParams;
  const period = parseMonitoringPeriod(query.period);
  const reportingDate = await dashboardService.getReportingDate(PILOT_SALON_ID);
  const ranges = resolveMonitoringRanges(reportingDate, period);
  const [salon, current, previous] = await Promise.all([
    dashboardService.getSalon(PILOT_SALON_ID),
    dashboardService.getOverview(PILOT_SALON_ID, ranges.current),
    dashboardService.getOverview(PILOT_SALON_ID, ranges.previous),
  ]);

  return (
    <MonitoringPageContent
      current={current}
      period={period}
      periodDays={ranges.days}
      previous={previous}
      reportingDate={reportingDate}
      salon={salon}
    />
  );
}
