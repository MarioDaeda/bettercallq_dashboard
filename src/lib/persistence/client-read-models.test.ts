import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  clientCallRowSchema,
  clientWhatsAppConversationRowSchema,
} from "./client-read-models";

const timestamp = "2026-08-02T10:00:00.000Z";
const salonId = "10000000-0000-4000-8000-000000000001";

describe("client-safe read models", () => {
  const call = {
    id: "50000000-0000-4000-8000-000000000001",
    salon_id: salonId,
    customer_phone: "+393331234567",
    customer_name: "Cliente",
    started_at: timestamp,
    ended_at: "2026-08-02T10:01:30.000Z",
    duration_seconds: 90,
    cost_total_usd_micros: 128_200,
    cost_stt_usd_micros: 13_300,
    cost_llm_usd_micros: 35_900,
    cost_tts_usd_micros: 13_400,
    cost_vapi_usd_micros: 65_600,
    cost_transport_usd_micros: 0,
    cost_chat_usd_micros: 0,
    cost_knowledge_base_usd_micros: 0,
    outcome: "booking_completed",
    summary: "Appuntamento fissato",
    requested_service: "Taglio",
    processing_status: "processed",
    created_at: timestamp,
    updated_at: timestamp,
  };

  it("mantiene il numero completo della chiamata", () => {
    expect(
      clientCallRowSchema.parse(call).customer_phone,
    ).toBe("+393331234567");
  });

  it("espone totale e breakdown Vapi in microdollari", () => {
    const parsed = clientCallRowSchema.parse(call);

    expect(parsed.cost_total_usd_micros).toBe(128_200);
    expect(parsed.cost_vapi_usd_micros).toBe(65_600);
  });

  it("rifiuta transcript e recording nella superficie cliente", () => {
    expect(() =>
      clientCallRowSchema.parse({
        ...call,
        transcript: [],
      }),
    ).toThrow();

    expect(() =>
      clientCallRowSchema.parse({
        ...call,
        recording_url: "https://example.test/audio.mp3",
      }),
    ).toThrow();
  });

  it("rifiuta la chiave provider WhatsApp", () => {
    expect(() =>
      clientWhatsAppConversationRowSchema.parse({
        id: "60000000-0000-4000-8000-000000000001",
        salon_id: salonId,
        customer_phone: "+393337654321",
        customer_name: null,
        status: "ai_handled",
        control: "ai",
        summary: "Richiesta informazioni",
        last_message_at: timestamp,
        created_at: timestamp,
        updated_at: timestamp,
        external_conversation_key: "provider-secret",
      }),
    ).toThrow();
  });
});

describe("RLS migration contract", () => {
  const migration = readFileSync(
    join(
      process.cwd(),
      "supabase/migrations/20260802123500_rls_isolation.sql",
    ),
    "utf8",
  );

  it("crea viste security invoker", () => {
    expect(migration).toContain("security_invoker = true");
    expect(migration).toContain(
      "create or replace view public.client_calls",
    );
    expect(migration).toContain(
      "create or replace view public.client_whatsapp_conversations",
    );
  });

  it("non concede le colonne sensibili", () => {
    const callGrant = migration.match(
      /grant select \([\s\S]*?\)\s*on public\.calls\s*to authenticated;/,
    )?.[0];

    expect(callGrant).toBeDefined();
    expect(callGrant).not.toContain("transcript");
    expect(callGrant).not.toContain("recording_url");
    expect(callGrant).not.toContain("external_call_id");
  });

  it("non crea policy di scrittura per authenticated", () => {
    expect(migration).not.toMatch(
      /create policy[\s\S]*?for (insert|update|delete)/i,
    );
  });
});
