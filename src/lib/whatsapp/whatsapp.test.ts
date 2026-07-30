import { describe, expect, it } from "vitest";

import {
  formatConversationActivity,
  formatMessageTime,
} from "./formatters";

describe("formattazione WhatsApp", () => {
  it("rende leggibile l'attività rispetto al riferimento demo", () => {
    const reference = "2026-07-30T12:00:00.000Z";

    expect(
      formatConversationActivity("2026-07-30T11:59:30.000Z", reference),
    ).toBe("adesso");
    expect(
      formatConversationActivity("2026-07-30T11:42:00.000Z", reference),
    ).toBe("18 min fa");
    expect(
      formatConversationActivity("2026-07-30T09:00:00.000Z", reference),
    ).toBe("3 ore fa");
    expect(
      formatConversationActivity("2026-07-29T10:00:00.000Z", reference),
    ).toBe("1 giorno fa");
  });

  it("non mostra un tempo negativo per eventi futuri", () => {
    expect(
      formatConversationActivity(
        "2026-07-30T13:00:00.000Z",
        "2026-07-30T12:00:00.000Z",
      ),
    ).toBe("adesso");
  });

  it("formatta l'orario nella timezone del salone", () => {
    expect(
      formatMessageTime(
        "2026-07-30T09:14:00.000Z",
        "Europe/Rome",
      ),
    ).toBe("11:14");
  });
});
