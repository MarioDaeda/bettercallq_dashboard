import Link from "next/link";

import { monitoringPeriodLabels, monitoringPeriods, type MonitoringPeriod } from "@/lib/monitoring/monitoring";
import { cn } from "@/lib/utils";

interface MonitoringPeriodFilterProps {
  activePeriod: MonitoringPeriod;
}

export function MonitoringPeriodFilter({
  activePeriod,
}: MonitoringPeriodFilterProps) {
  return (
    <nav
      aria-label="Periodo del monitoraggio"
      className="inline-flex rounded-2xl border bg-card/80 p-1 shadow-sm"
    >
      {monitoringPeriods.map((period) => (
        <Link
          aria-current={activePeriod === period ? "page" : undefined}
          className={cn(
            "rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
            activePeriod === period
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          href={`/monitoraggio?period=${period}`}
          key={period}
        >
          {monitoringPeriodLabels[period]}
        </Link>
      ))}
    </nav>
  );
}
