import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  persistedCallRowSchema,
  profileRowSchema,
  subscriptionPlanRowSchema,
  usagePeriodRowSchema,
} from "./database-contracts";

const timestamp = "2026-08-02T09:00:00.000Z";
const salonId = "10000000-0000-4000-8000-000000000001";

describe("database row contracts", () => {
  it("valida un profilo amministratore", () => {
    expect(
      profileRowSchema.parse({
        user_id: "95e2a603-e534-4189-be8e-e090c842402f",
        display_name: "Mario",
        platform_role: "admin",
        created_at: timestamp,
        updated_at: timestamp,
      }).platform_role,
    ).toBe("admin");
  });

  it("mantiene il piano pilota a 300 minuti", () => {
    expect(
      subscriptionPlanRowSchema.parse({
        id: "20000000-0000-4000-8000-000000000001",
        code: "pilot-300",
        name: "Piano pilota 300 minuti",
        included_voice_minutes: 300,
        extra_minute_price_cents: null,
        billing_cycle_type: "calendar_month",
        active: true,
        created_at: timestamp,
        updated_at: timestamp,
      }).included_voice_minutes,
    ).toBe(300);
  });

  it("valida residuo ed extra come valori non negativi", () => {
    expect(() =>
      usagePeriodRowSchema.parse({
        id: "40000000-0000-4000-8000-000000000001",
        salon_id: salonId,
        subscription_id: "30000000-0000-4000-8000-000000000001",
        period_start: "2026-08-01",
        period_end: "2026-08-31",
        included_voice_minutes: 300,
        used_voice_seconds: 18_600,
        remaining_voice_seconds: 0,
        extra_voice_seconds: -600,
        calculated_at: timestamp,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    ).toThrow();
  });

  it("accetta numeri telefonici completi in formato internazionale", () => {
    expect(
      persistedCallRowSchema.parse({
        id: "50000000-0000-4000-8000-000000000001",
        salon_id: salonId,
        provider: "vapi",
        external_call_id: "call-demo-1",
        customer_phone: "+393331234567",
        customer_name: null,
        started_at: timestamp,
        ended_at: "2026-08-02T09:01:30.000Z",
        duration_seconds: 90,
        outcome: "booking_completed",
        summary: "Prenotazione completata",
        requested_service: "Taglio",
        booking_reference_id: null,
        transcript: null,
        recording_url: null,
        processing_status: "processed",
        created_at: timestamp,
        updated_at: timestamp,
      }).customer_phone,
    ).toBe("+393331234567");
  });
});

describe("database foundation files", () => {
  const migrationPath = join(
    process.cwd(),
    "supabase/migrations/20260802114600_database_foundation.sql",
  );
  const seedPath = join(process.cwd(), "supabase/seed.sql");
  const migration = readFileSync(migrationPath, "utf8");
  const seed = readFileSync(seedPath, "utf8");

  it("versiona tutte le tabelle fondamentali", () => {
    for (const table of [
      "profiles",
      "salons",
      "salon_memberships",
      "subscription_plans",
      "salon_subscriptions",
      "usage_periods",
      "calls",
      "whatsapp_conversations",
      "whatsapp_messages",
      "channel_statuses",
      "audit_events",
    ]) {
      expect(migration).toContain(`create table public.${table}`);
      expect(migration).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
  });

  it("non apre policy prima della task di autorizzazione", () => {
    expect(migration.toLowerCase()).not.toContain("create policy");
    expect(migration).toContain(
      "revoke all on table public.calls from anon, authenticated",
    );
  });

  it("mantiene seed e fixture sullo stesso salonId", () => {
    expect(seed).toContain(salonId);
    expect(seed).toContain("'pilot-300'");
    expect(seed).toContain("300,");
  });
});
