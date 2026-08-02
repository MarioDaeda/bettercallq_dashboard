import { describe, expect, it, vi } from "vitest";

import {
  IngestionRepositoryError,
  ingestVapiCall,
  ingestWhatsAppConversation,
  type IngestionRpcClient,
} from "./repository";

const salonId = "10000000-0000-4000-8000-000000000001";

describe("ingestion repository", () => {
  it("mappa una chiamata sui parametri RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        callId: "50000000-0000-4000-8000-000000000001",
        duplicateEvent: false,
        usagePeriodId:
          "40000000-0000-4000-8000-000000000001",
      },
      error: null,
    });
    const client = { rpc } satisfies IngestionRpcClient;

    await ingestVapiCall(client, {
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
    });

    expect(rpc).toHaveBeenCalledWith(
      "ingest_vapi_call",
      expect.objectContaining({
        p_duration_seconds: 90,
        p_external_call_id: "call-1",
        p_external_event_id: "event-1",
        p_salon_id: salonId,
      }),
    );
  });

  it("mappa una conversazione WhatsApp", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        conversationId:
          "60000000-0000-4000-8000-000000000001",
        duplicateEvent: false,
      },
      error: null,
    });
    const client = { rpc } satisfies IngestionRpcClient;

    await ingestWhatsAppConversation(client, {
      control: "ai",
      customerName: "Cliente",
      customerPhone: "+393331234567",
      externalConversationKey: "conversation-1",
      externalEventId: "event-1",
      lastMessageAt: "2026-08-02T10:00:00.000Z",
      salonId,
      status: "ai_handled",
      summary: "Richiesta informazioni",
    });

    expect(rpc).toHaveBeenCalledWith(
      "ingest_whatsapp_conversation",
      expect.objectContaining({
        p_external_conversation_key: "conversation-1",
        p_external_event_id: "event-1",
        p_salon_id: salonId,
      }),
    );
  });

  it("normalizza gli errori RPC", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "database unavailable",
        },
      }),
    } satisfies IngestionRpcClient;

    await expect(
      ingestVapiCall(client, {
        customerName: null,
        customerPhone: null,
        durationSeconds: null,
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
    ).rejects.toBeInstanceOf(IngestionRepositoryError);
  });
});
