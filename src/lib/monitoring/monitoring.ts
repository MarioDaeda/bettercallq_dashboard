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
  sttUsdMicros: number;
  llmUsdMicros: number;
  ttsUsdMicros: number;
  vapiUsdMicros: number;
  transportUsdMicros: number;
  chatUsdMicros: number;
  knowledgeBaseUsdMicros: number;
  unclassifiedUsdMicros: number;
  totalUsdMicros: number;
}

export interface MonitoringSummary {
  callsReceived: number;
  callsCompleted: number;
  callsWithCostData: number;
  callsWithoutCostData: number;
  costCoverageRate: number;
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
  costTotalUsdMicros: number;
  projectedMonthlyCostUsdMicros: number;
  costPerCostedCallUsdMicros: number;
  costBreakdown: CostBreakdown;
}

export interface MetricDelta {
  absolute: number;
  percent: number | null;
  direction: "up" | "down" | "flat";
}

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
  const totalUsdMicros = sum(
    metrics,
    (metric) => metric.costTotalUsdMicros,
  );
  const sttUsdMicros = sum(
    metrics,
    (metric) => metric.costSttUsdMicros,
  );
  const llmUsdMicros = sum(
    metrics,
    (metric) => metric.costLlmUsdMicros,
  );
  const ttsUsdMicros = sum(
    metrics,
    (metric) => metric.costTtsUsdMicros,
  );
  const vapiUsdMicros = sum(
    metrics,
    (metric) => metric.costVapiUsdMicros,
  );
  const transportUsdMicros = sum(
    metrics,
    (metric) => metric.costTransportUsdMicros,
  );
  const chatUsdMicros = sum(
    metrics,
    (metric) => metric.costChatUsdMicros,
  );
  const knowledgeBaseUsdMicros = sum(
    metrics,
    (metric) => metric.costKnowledgeBaseUsdMicros,
  );
  const classifiedUsdMicros =
    sttUsdMicros +
    llmUsdMicros +
    ttsUsdMicros +
    vapiUsdMicros +
    transportUsdMicros +
    chatUsdMicros +
    knowledgeBaseUsdMicros;

  return {
    sttUsdMicros,
    llmUsdMicros,
    ttsUsdMicros,
    vapiUsdMicros,
    transportUsdMicros,
    chatUsdMicros,
    knowledgeBaseUsdMicros,
    unclassifiedUsdMicros: Math.max(
      0,
      totalUsdMicros - classifiedUsdMicros,
    ),
    totalUsdMicros,
  };
}

export function aggregateMonitoringMetrics(
  metrics: DailyMetric[],
  periodDays: number,
): MonitoringSummary {
  const callsReceived = sum(metrics, (metric) => metric.callsReceived);
  const callsCompleted = sum(metrics, (metric) => metric.callsCompleted);
  const callsWithCostData = sum(
    metrics,
    (metric) => metric.callsWithCostData,
  );
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
  const costTotalUsdMicros = sum(
    metrics,
    (metric) => metric.costTotalUsdMicros,
  );

  return {
    callsReceived,
    callsCompleted,
    callsWithCostData,
    callsWithoutCostData: Math.max(
      0,
      callsReceived - callsWithCostData,
    ),
    costCoverageRate: ratio(
      callsWithCostData,
      callsReceived,
    ),
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
    costTotalUsdMicros,
    projectedMonthlyCostUsdMicros:
      periodDays <= 0
        ? 0
        : Math.round((costTotalUsdMicros / periodDays) * 30),
    costPerCostedCallUsdMicros:
      callsWithCostData === 0
        ? 0
        : Math.round(costTotalUsdMicros / callsWithCostData),
    costBreakdown: calculateCostBreakdown(metrics),
  };
}

export function calculateCoveredCostDelta(
  current: MonitoringSummary,
  previous: MonitoringSummary,
): MetricDelta | null {
  const currentHasCompleteCoverage =
    current.callsReceived > 0 &&
    current.callsWithCostData === current.callsReceived;
  const previousHasCompleteCoverage =
    previous.callsReceived > 0 &&
    previous.callsWithCostData === previous.callsReceived;

  if (
    !currentHasCompleteCoverage ||
    !previousHasCompleteCoverage
  ) {
    return null;
  }

  return calculateMetricDelta(
    current.costTotalUsdMicros,
    previous.costTotalUsdMicros,
  );
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
