import type { DateRange } from "@/lib/services/dashboard-service";

export const callPeriods = ["all", "today", "7d", "30d"] as const;
export type CallPeriod = (typeof callPeriods)[number];

export const callPeriodLabels: Record<CallPeriod, string> = {
  all: "Tutto",
  today: "Oggi",
  "7d": "7 giorni",
  "30d": "30 giorni",
};

const periodDays: Record<Exclude<CallPeriod, "all">, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
};

export const resolveCallRange = (
  reportingDate: string,
  period: CallPeriod,
): DateRange | null => {
  if (period === "all") {
    return null;
  }

  const to = new Date(`${reportingDate}T12:00:00.000Z`);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (periodDays[period] - 1));

  return {
    from: from.toISOString().slice(0, 10),
    to: reportingDate,
  };
};
