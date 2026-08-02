import { describe, expect, it } from "vitest";

import {
  calculateVoicePlanUsage,
  formatRenewalDate,
  isDateTimeInRange,
  resolveCalendarMonthRange,
} from "./voice-usage";

describe("voice plan usage", () => {
  it("gestisce un periodo senza chiamate", () => {
    expect(calculateVoicePlanUsage([])).toMatchObject({
      includedMinutes: 300,
      usedSeconds: 0,
      remainingSeconds: 18_000,
      extraSeconds: 0,
      usagePercentage: 0,
    });
  });

  it("calcola consumo e residuo senza arrotondare le chiamate", () => {
    const usage = calculateVoicePlanUsage([
      { durationSeconds: 7_200 },
      { durationSeconds: 5_670 },
    ]);

    expect(usage.usedSeconds).toBe(12_870);
    expect(usage.remainingSeconds).toBe(5_130);
    expect(usage.extraSeconds).toBe(0);
    expect(usage.usagePercentage).toBeCloseTo(71.5);
  });

  it("ferma la barra al cento per cento", () => {
    const usage = calculateVoicePlanUsage([
      { durationSeconds: 19_620 },
    ]);

    expect(usage.includedSecondsUsed).toBe(18_000);
    expect(usage.remainingSeconds).toBe(0);
    expect(usage.extraSeconds).toBe(1_620);
    expect(usage.usagePercentage).toBe(100);
  });

  it("rifiuta un limite non valido", () => {
    expect(() => calculateVoicePlanUsage([], 0)).toThrow(RangeError);
  });
});

describe("calendar month range", () => {
  it("risolve correttamente anche febbraio bisestile", () => {
    expect(resolveCalendarMonthRange("2028-02-14")).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });

  it("calcola la data di rinnovo", () => {
    expect(
      formatRenewalDate({
        from: "2026-08-01",
        to: "2026-08-31",
      }),
    ).toBe("1 settembre");
  });

  it("filtra timestamp all'interno del mese", () => {
    const range = {
      from: "2026-08-01",
      to: "2026-08-31",
    };

    expect(isDateTimeInRange("2026-08-31T23:59:59+02:00", range)).toBe(true);
    expect(isDateTimeInRange("2026-09-01T00:00:00+02:00", range)).toBe(false);
  });
});
