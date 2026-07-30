import type { DateRange } from "@/lib/services/dashboard-service";

export const overviewPeriods = ["today", "7d", "30d"] as const;
export type OverviewPeriod = (typeof overviewPeriods)[number];

export const overviewPeriodLabels: Record<OverviewPeriod, string> = {
  today: "Oggi",
  "7d": "Ultimi 7 giorni",
  "30d": "Ultimi 30 giorni",
};

const periodDays: Record<OverviewPeriod, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
};

export const parseOverviewPeriod = (
  value: string | string[] | undefined,
): OverviewPeriod => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return overviewPeriods.includes(candidate as OverviewPeriod)
    ? (candidate as OverviewPeriod)
    : "today";
};

export const resolveOverviewRange = (
  reportingDate: string,
  period: OverviewPeriod,
): DateRange => {
  const to = new Date(`${reportingDate}T12:00:00.000Z`);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (periodDays[period] - 1));

  return {
    from: from.toISOString().slice(0, 10),
    to: reportingDate,
  };
};
