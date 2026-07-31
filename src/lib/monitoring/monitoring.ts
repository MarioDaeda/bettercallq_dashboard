import type { DailyMetric } from "@/lib/domain";
import type { DateRange } from "@/lib/services/dashboard-service";

export const monitoringPeriods = ["today", "7d"] as const;
export type MonitoringPeriod = (typeof monitoringPeriods)[number];

export const monitoringPeriodLabels: Record<MonitoringPeriod, string> = {
  today: "Oggi",
  "7d": "Ultimi 7 giorni",
};

export const monitoringPeriodDays: Record<MonitoringPeriod, number> = {
  today: 1,
  "7d": 7,
};

export interface MonitoringRanges {
  current: DateRange;
  previous: DateRange;
  days: number;
}

export interface CostBreakdown {
  transcriptionCents: number;
  languageModelCents: number;
  speechSynthesisCents: number;
  whatsappCents: number;
  telephonyAndPlatformCents: number;
  totalCents: number;
}

export interface MonitoringSummary {
  callsReceived: number;
  callsCompleted: number;
  contactsHandled: number;
  completionRate: number;
  callDurationSeconds: number;
  averageCallDurationSeconds: number;
  whatsappConversations: number;
  whatsappMessages: number;
  bookingsAttributed: number;
  interventionsCreated: number;
  interventionsResolved: number;
  interventionRate: number;
  integrationErrors: number;
  estimatedCostCents: number;
  projectedMonthlyCostCents: number;
  costPerContactCents: number;
  costBreakdown: CostBreakdown;
}

export interface MetricDelta {
  absolute: number;
  percent: number | null;
  direction: "up" | "down" | "flat";
}

export const demoCostRates = {
  transcriptionPerMinuteCents: 1,
  languageModelPerMinuteCents: 1,
  speechSynthesisPerMinuteCents: 2.2,
  whatsappPerMessageCents: 0.1,
} as const;

const addUtcDays = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const sum = <T>(items: T[], select: (item: T) => number) =>
  items.reduce((total, item) => total + select(item), 0);

const ratio = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : numerator / denominator;

export function parseMonitoringPeriod(
  value: string | string[] | undefined,
): MonitoringPeriod {
  const candidate = Array.isArray(value) ? value[0] : value;
  return monitoringPeriods.includes(candidate as MonitoringPeriod)
    ? (candidate as MonitoringPeriod)
    : "7d";
}

export function resolveMonitoringRanges(
  reportingDate: string,
  period: MonitoringPeriod,
): MonitoringRanges {
  const days = monitoringPeriodDays[period];
  const currentFrom = addUtcDays(reportingDate, -(days - 1));
  const previousTo = addUtcDays(currentFrom, -1);

  return {
    current: { from: currentFrom, to: reportingDate },
    previous: {
      from: addUtcDays(previousTo, -(days - 1)),
      to: previousTo,
    },
    days,
  };
}

export function calculateCostBreakdown(
  metrics: DailyMetric[],
): CostBreakdown {
  const totalCents = sum(metrics, (metric) => metric.estimatedCostCents);
  const durationMinutes =
    sum(metrics, (metric) => metric.callDurationSeconds) / 60;
  const whatsappMessages = sum(
    metrics,
    (metric) =>
      metric.whatsappMessagesInbound + metric.whatsappMessagesOutbound,
  );

  const transcriptionCents = Math.round(
    durationMinutes * demoCostRates.transcriptionPerMinuteCents,
  );
  const languageModelCents = Math.round(
    durationMinutes * demoCostRates.languageModelPerMinuteCents,
  );
  const speechSynthesisCents = Math.round(
    durationMinutes * demoCostRates.speechSynthesisPerMinuteCents,
  );
  const whatsappCents = Math.round(
    whatsappMessages * demoCostRates.whatsappPerMessageCents,
  );
  const knownCents =
    transcriptionCents +
    languageModelCents +
    speechSynthesisCents +
    whatsappCents;

  return {
    transcriptionCents,
    languageModelCents,
    speechSynthesisCents,
    whatsappCents,
    telephonyAndPlatformCents: Math.max(0, totalCents - knownCents),
    totalCents,
  };
}

export function aggregateMonitoringMetrics(
  metrics: DailyMetric[],
  periodDays: number,
): MonitoringSummary {
  const callsReceived = sum(metrics, (metric) => metric.callsReceived);
  const callsCompleted = sum(metrics, (metric) => metric.callsCompleted);
  const callDurationSeconds = sum(
    metrics,
    (metric) => metric.callDurationSeconds,
  );
  const whatsappConversations = sum(
    metrics,
    (metric) => metric.whatsappConversations,
  );
  const whatsappMessages = sum(
    metrics,
    (metric) =>
      metric.whatsappMessagesInbound + metric.whatsappMessagesOutbound,
  );
  const contactsHandled = callsReceived + whatsappConversations;
  const interventionsCreated = sum(
    metrics,
    (metric) => metric.interventionsCreated,
  );
  const estimatedCostCents = sum(
    metrics,
    (metric) => metric.estimatedCostCents,
  );

  return {
    callsReceived,
    callsCompleted,
    contactsHandled,
    completionRate: ratio(callsCompleted, callsReceived),
    callDurationSeconds,
    averageCallDurationSeconds:
      callsReceived === 0 ? 0 : Math.round(callDurationSeconds / callsReceived),
    whatsappConversations,
    whatsappMessages,
    bookingsAttributed: sum(
      metrics,
      (metric) => metric.bookingsAttributed,
    ),
    interventionsCreated,
    interventionsResolved: sum(
      metrics,
      (metric) => metric.interventionsResolved,
    ),
    interventionRate: ratio(interventionsCreated, contactsHandled),
    integrationErrors: sum(
      metrics,
      (metric) => metric.integrationErrors,
    ),
    estimatedCostCents,
    projectedMonthlyCostCents:
      periodDays <= 0
        ? 0
        : Math.round((estimatedCostCents / periodDays) * 30),
    costPerContactCents:
      contactsHandled === 0
        ? 0
        : Math.round(estimatedCostCents / contactsHandled),
    costBreakdown: calculateCostBreakdown(metrics),
  };
}

export function calculateMetricDelta(
  current: number,
  previous: number,
): MetricDelta {
  const absolute = current - previous;

  return {
    absolute,
    percent:
      previous === 0 ? (current === 0 ? 0 : null) : absolute / previous,
    direction: absolute === 0 ? "flat" : absolute > 0 ? "up" : "down",
  };
}
