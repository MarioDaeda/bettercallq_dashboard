import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  overviewPeriodLabels,
  overviewPeriods,
  type OverviewPeriod,
} from "@/lib/overview/date-range";
import { cn } from "@/lib/utils";

interface PeriodFilterProps {
  activePeriod: OverviewPeriod;
}

export function PeriodFilter({ activePeriod }: PeriodFilterProps) {
  return (
    <nav
      aria-label="Intervallo temporale della Panoramica"
      className="flex w-full gap-1 overflow-x-auto rounded-xl border bg-card/75 p-1 shadow-sm sm:w-fit"
    >
      {overviewPeriods.map((period) => {
        const isActive = period === activePeriod;
        const href = period === "today" ? "/" : `/?period=${period}`;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              buttonVariants({
                size: "lg",
                variant: isActive ? "secondary" : "ghost",
              }),
              "h-9 flex-1 px-3 text-xs sm:flex-none",
            )}
            href={href}
            key={period}
          >
            {overviewPeriodLabels[period]}
          </Link>
        );
      })}
    </nav>
  );
}
