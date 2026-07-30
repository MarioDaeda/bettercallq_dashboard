import { describe, expect, it } from "vitest";

import { resolveCallRange } from "./date-range";
import {
  formatCallDuration,
  formatPhoneNumber,
  formatTranscriptOffset,
} from "./formatters";

describe("formattazione chiamate", () => {
  it("formatta durate brevi e composte", () => {
    expect(formatCallDuration(undefined)).toBe("Durata non disponibile");
    expect(formatCallDuration(48)).toBe("48 sec");
    expect(formatCallDuration(60)).toBe("1 min");
    expect(formatCallDuration(90)).toBe("1 min 30 sec");
  });

  it("formatta riferimenti temporali e numeri demo", () => {
    expect(formatTranscriptOffset(4)).toBe("0:04");
    expect(formatTranscriptOffset(72)).toBe("1:12");
    expect(formatPhoneNumber("+390000000101")).toBe("+39 000 000 0101");
  });
});
describe("periodi dello storico chiamate", () => {
  it("risolve intervalli inclusivi senza dipendere dalla timezone runtime", () => {
    expect(resolveCallRange("2026-07-30", "all")).toBeNull();
    expect(resolveCallRange("2026-07-30", "today")).toEqual({
      from: "2026-07-30",
      to: "2026-07-30",
    });
    expect(resolveCallRange("2026-07-30", "7d")).toEqual({
      from: "2026-07-24",
      to: "2026-07-30",
    });
    expect(resolveCallRange("2026-03-01", "30d")).toEqual({
      from: "2026-01-31",
      to: "2026-03-01",
    });
  });
});
