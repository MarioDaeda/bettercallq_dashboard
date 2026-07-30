import { describe, expect, it } from "vitest";

import {
  parseOverviewPeriod,
  resolveOverviewRange,
} from "./date-range";

describe("filtri temporali della Panoramica", () => {
  it("usa oggi quando il parametro non è valido", () => {
    expect(parseOverviewPeriod(undefined)).toBe("today");
    expect(parseOverviewPeriod("year")).toBe("today");
  });

  it("accetta i periodi supportati", () => {
    expect(parseOverviewPeriod("7d")).toBe("7d");
    expect(parseOverviewPeriod(["30d", "today"])).toBe("30d");
  });

  it("calcola intervalli inclusivi senza dipendere dalla timezone runtime", () => {
    expect(resolveOverviewRange("2026-07-30", "today")).toEqual({
      from: "2026-07-30",
      to: "2026-07-30",
    });
    expect(resolveOverviewRange("2026-07-30", "7d")).toEqual({
      from: "2026-07-24",
      to: "2026-07-30",
    });
    expect(resolveOverviewRange("2026-03-01", "30d")).toEqual({
      from: "2026-01-31",
      to: "2026-03-01",
    });
  });
});
