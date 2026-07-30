import { describe, expect, it } from "vitest";

import {
  formatDemoPhoneNumber,
  formatInterventionAge,
} from "./formatters";

describe("formattazione interventi", () => {
  it("rende leggibile l'anzianità rispetto al riferimento demo", () => {
    const reference = "2026-07-30T12:00:00.000Z";

    expect(
      formatInterventionAge("2026-07-30T11:59:30.000Z", reference),
    ).toBe("adesso");
    expect(
      formatInterventionAge("2026-07-30T11:42:00.000Z", reference),
    ).toBe("18 min");
    expect(
      formatInterventionAge("2026-07-30T09:00:00.000Z", reference),
    ).toBe("3 ore");
    expect(
      formatInterventionAge("2026-07-29T10:00:00.000Z", reference),
    ).toBe("1 giorno");
  });

  it("non mostra un tempo negativo per eventi futuri", () => {
    expect(
      formatInterventionAge(
        "2026-07-30T13:00:00.000Z",
        "2026-07-30T12:00:00.000Z",
      ),
    ).toBe("adesso");
  });

  it("spazia i numeri demo italiani senza alterare altri formati", () => {
    expect(formatDemoPhoneNumber("+390000000105")).toBe("+39 000 000 0105");
    expect(formatDemoPhoneNumber("+441234567890")).toBe("+441234567890");
  });
});
