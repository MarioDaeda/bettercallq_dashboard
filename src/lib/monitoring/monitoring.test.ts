import { describe, expect, it } from "vitest";

import type { DailyMetric } from "@/lib/domain";

import {
  aggregateMonitoringMetrics,
  calculateCostBreakdown,
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
  callDurationSeconds: 600,
  whatsappConversations: 4,
  whatsappMessagesInbound: 10,
  whatsappMessagesOutbound: 10,
  bookingsAttributed: 5,
  interventionsCreated: 2,
  interventionsResolved: 1,
  integrationErrors: 1,
  estimatedCostCents: 50,
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

  it("aggrega volumi, qualità e proiezione mensile", () => {
    const summary = aggregateMonitoringMetrics(
      [metric(), metric({ date: "2026-07-29", estimatedCostCents: 70 })],
      2,
    );

    expect(summary).toMatchObject({
      callsReceived: 20,
      callsCompleted: 16,
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
      estimatedCostCents: 120,
      projectedMonthlyCostCents: 1800,
      costPerContactCents: 4,
    });
  });

  it("mantiene la ripartizione costi uguale al totale fixture", () => {
    const breakdown = calculateCostBreakdown([metric()]);
    expect(
      breakdown.transcriptionCents +
        breakdown.languageModelCents +
        breakdown.speechSynthesisCents +
        breakdown.whatsappCents +
        breakdown.telephonyAndPlatformCents,
    ).toBe(breakdown.totalCents);
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
