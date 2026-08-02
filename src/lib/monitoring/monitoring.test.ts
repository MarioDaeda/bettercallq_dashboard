import { describe, expect, it } from "vitest";

import type { DailyMetric } from "@/lib/domain";

import {
  aggregateMonitoringMetrics,
  calculateCostBreakdown,
  calculateCoveredCostDelta,
  calculateMetricDelta,
  parseMonitoringPeriod,
  resolveMonitoringRanges,
} from "./monitoring";

const metric = (overrides: Partial<DailyMetric> = {}): DailyMetric => ({
  id: "90000000-0000-4000-8000-000000009999",
  salonId: "10000000-0000-4000-8000-000000000001",
  date: "2026-07-30",
  callsReceived: 10,
  callsCompleted: 8,
  callsWithCostData: 10,
  callDurationSeconds: 600,
  whatsappConversations: 4,
  whatsappMessagesInbound: 10,
  whatsappMessagesOutbound: 10,
  bookingsAttributed: 5,
  interventionsCreated: 2,
  interventionsResolved: 1,
  integrationErrors: 1,
  costTotalUsdMicros: 500_000,
  costSttUsdMicros: 50_000,
  costLlmUsdMicros: 150_000,
  costTtsUsdMicros: 50_000,
  costVapiUsdMicros: 250_000,
  costTransportUsdMicros: 0,
  costChatUsdMicros: 0,
  costKnowledgeBaseUsdMicros: 0,
  createdAt: "2026-07-30T21:59:00.000Z",
  updatedAt: "2026-07-30T21:59:00.000Z",
  ...overrides,
});

describe("monitoring", () => {
  it("usa sette giorni come periodo predefinito", () => {
    expect(parseMonitoringPeriod(undefined)).toBe("7d");
    expect(parseMonitoringPeriod("invalid")).toBe("7d");
    expect(parseMonitoringPeriod(["today", "7d"])).toBe("today");
  });

  it("calcola periodo corrente e precedente della stessa durata", () => {
    expect(resolveMonitoringRanges("2026-07-30", "7d")).toEqual({
      current: { from: "2026-07-24", to: "2026-07-30" },
      previous: { from: "2026-07-17", to: "2026-07-23" },
      days: 7,
    });
  });

  it("aggrega volumi, copertura, costo reale e proiezione mensile", () => {
    const summary = aggregateMonitoringMetrics(
      [
        metric(),
        metric({
          date: "2026-07-29",
          costTotalUsdMicros: 700_000,
          costSttUsdMicros: 70_000,
          costLlmUsdMicros: 210_000,
          costTtsUsdMicros: 70_000,
          costVapiUsdMicros: 350_000,
        }),
      ],
      2,
    );

    expect(summary).toMatchObject({
      callsReceived: 20,
      callsCompleted: 16,
      callsWithCostData: 20,
      callsWithoutCostData: 0,
      costCoverageRate: 1,
      contactsHandled: 28,
      completionRate: 0.8,
      averageCallDurationSeconds: 60,
      whatsappConversations: 8,
      whatsappMessages: 40,
      bookingsAttributed: 10,
      interventionsCreated: 4,
      interventionsResolved: 2,
      interventionRate: 4 / 28,
      integrationErrors: 2,
      costTotalUsdMicros: 1_200_000,
      projectedMonthlyCostUsdMicros: 18_000_000,
      costPerCostedCallUsdMicros: 60_000,
    });
  });

  it("mantiene il breakdown reale uguale al totale", () => {
    const breakdown = calculateCostBreakdown([metric()]);

    expect(
      breakdown.sttUsdMicros +
        breakdown.llmUsdMicros +
        breakdown.ttsUsdMicros +
        breakdown.vapiUsdMicros +
        breakdown.transportUsdMicros +
        breakdown.chatUsdMicros +
        breakdown.knowledgeBaseUsdMicros +
        breakdown.unclassifiedUsdMicros,
    ).toBe(breakdown.totalUsdMicros);
  });

  it("separa le chiamate storiche senza costo", () => {
    const summary = aggregateMonitoringMetrics(
      [
        metric({
          callsReceived: 2,
          callsWithCostData: 1,
        }),
      ],
      1,
    );

    expect(summary.callsWithCostData).toBe(1);
    expect(summary.callsWithoutCostData).toBe(1);
    expect(summary.costCoverageRate).toBe(0.5);
  });

  it("confronta i costi solo con copertura completa", () => {
    const current = aggregateMonitoringMetrics(
      [
        metric({
          callsReceived: 1,
          callsWithCostData: 1,
          costTotalUsdMicros: 500_000,
        }),
      ],
      1,
    );
    const previous = aggregateMonitoringMetrics(
      [
        metric({
          callsReceived: 1,
          callsWithCostData: 1,
          costTotalUsdMicros: 400_000,
        }),
      ],
      1,
    );
    const partial = aggregateMonitoringMetrics(
      [
        metric({
          callsReceived: 2,
          callsWithCostData: 1,
          costTotalUsdMicros: 500_000,
        }),
      ],
      1,
    );

    expect(
      calculateCoveredCostDelta(current, previous),
    ).toEqual({
      absolute: 100_000,
      percent: 0.25,
      direction: "up",
    });
    expect(
      calculateCoveredCostDelta(current, partial),
    ).toBeNull();
  });

  it("gestisce confronti normali e basi uguali a zero", () => {
    expect(calculateMetricDelta(12, 10)).toEqual({
      absolute: 2,
      percent: 0.2,
      direction: "up",
    });
    expect(calculateMetricDelta(3, 0)).toEqual({
      absolute: 3,
      percent: null,
      direction: "up",
    });
  });
});
