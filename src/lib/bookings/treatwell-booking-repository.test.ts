import { describe, expect, it } from "vitest";

import { treatwellBookingRowSchema } from "@/lib/persistence/database-contracts";

const base = {
  channel: "vapi",
  created_at: "2026-08-12T10:00:00.000Z",
  customer_name: "Mario Rossi",
  customer_phone: "+393331234567",
  duration_minutes: 45,
  ends_at: "2026-08-20T08:45:00.000Z",
  google_calendar_event_id: "bcq-event",
  id: "20000000-0000-4000-8000-000000000001",
  salon_id: "10000000-0000-4000-8000-000000000001",
  service_code: "taglio_uomo",
  service_name: "Taglio uomo",
  starts_at: "2026-08-20T08:00:00.000Z",
  status: "confirmed",
  treatwell_status: "to_sync",
  updated_at: "2026-08-12T10:00:00.000Z",
} as const;

describe("treatwellBookingRowSchema", () => {
  it("accetta solo operazioni reali da mostrare in coda", () => {
    expect(treatwellBookingRowSchema.parse(base).treatwell_status).toBe(
      "to_sync",
    );
  });

  it("esclude prenotazioni pending e failed dalla superficie UI", () => {
    expect(
      treatwellBookingRowSchema.safeParse({ ...base, status: "pending" })
        .success,
    ).toBe(false);
    expect(
      treatwellBookingRowSchema.safeParse({ ...base, status: "failed" })
        .success,
    ).toBe(false);
  });

  it("esclude stati Treatwell già completati", () => {
    expect(
      treatwellBookingRowSchema.safeParse({
        ...base,
        treatwell_status: "synced",
      }).success,
    ).toBe(false);
  });
});
