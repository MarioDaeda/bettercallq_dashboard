import type { Metadata } from "next";

import { MonitoringPageContent } from "@/components/monitoring/monitoring-page-content";
import {
  loadAdminMonitoringPageData,
} from "@/lib/admin-monitoring/admin-monitoring-repository";
import {
  parseMonitoringPeriod,
} from "@/lib/monitoring/monitoring";

export const metadata: Metadata = {
  title: "Monitoraggio",
};

interface MonitoringPageProps {
  searchParams: Promise<{
    period?: string | string[];
    salonId?: string | string[];
  }>;
}

function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MonitoringPage({
  searchParams,
}: MonitoringPageProps) {
  const query = await searchParams;
  const period = parseMonitoringPeriod(query.period);
  const data = await loadAdminMonitoringPageData({
    period,
    salonId: firstValue(query.salonId),
  });

  return (
    <MonitoringPageContent
      current={data.current}
      period={period}
      periodDays={data.periodDays}
      previous={data.previous}
      reportingDate={data.reportingDate}
      salon={data.salon}
    />
  );
}
