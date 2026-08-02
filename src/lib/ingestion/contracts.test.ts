import { describe, expect, it } from "vitest";

import {
  vapiCallIngestionSchema,
  whatsappConversationIngestionSchema,
} from "./contracts";

const salonId = "10000000-0000-4000-8000-000000000001";

describe("ingestion contracts", () => {
  it("valida uno snapshot Vapi completo", () => {
    expect(
      vapiCallIngestionSchema.parse({
        customerName: "Cliente",
        customerPhone: "+393331234567",
        durationSeconds: 90,
        endedAt: "2026-08-02T10:01:30.000Z",
        externalCallId: "call-1",
        externalEventId: "event-1",
        outcome: "booking_completed",
        processingStatus: "processed",
        requestedService: "Taglio",
        salonId,
        startedAt: "2026-08-02T10:00:00.000Z",
        summary: "Prenotazione completata",
      }).durationSeconds,
    ).toBe(90);
  });

  it("rifiuta durate negative", () => {
    expect(() =>
      vapiCallIngestionSchema.parse({
        customerName: null,
        customerPhone: null,
        durationSeconds: -1,
        endedAt: null,
        externalCallId: "call-1",
        externalEventId: "event-1",
        outcome: "incomplete",
        processingStatus: "receiving",
        requestedService: null,
        salonId,
        startedAt: "2026-08-02T10:00:00.000Z",
        summary: null,
      }),
    ).toThrow();
  });

  it("richiede numeri WhatsApp internazionali", () => {
    expect(() =>
      whatsappConversationIngestionSchema.parse({
        control: "ai",
        customerName: null,
        customerPhone: "3331234567",
        externalConversationKey: "conversation-1",
        externalEventId: "event-1",
        lastMessageAt: null,
        salonId,
        status: "ai_handled",
        summary: null,
      }),
    ).toThrow();
  });
});
