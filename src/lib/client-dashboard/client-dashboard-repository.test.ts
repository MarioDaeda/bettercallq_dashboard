import { describe, expect, it } from "vitest";

import {
  buildSupabaseClientDashboardSnapshot,
  getLocalDateInTimeZone,
  resolveClientDashboardDataSource,
} from "./client-dashboard-repository";

const salonId = "10000000-0000-4000-8000-000000000001";
const timestamp = "2026-08-02T10:00:00.000Z";

const salon = {
  address: {},
  created_at: timestamp,
  id: salonId,
  locale: "it-IT",
  name: "Studio Chioma",
  phone_number: "+390000000001",
  status: "active",
  timezone: "Europe/Rome",
  updated_at: timestamp,
  whatsapp_number: "+390000000002",
};

const usagePeriod = {
  calculated_at: timestamp,
  created_at: timestamp,
  extra_voice_seconds: 600,
  id: "40000000-0000-4000-8000-000000000001",
  included_voice_minutes: 300,
  period_end: "2026-08-31",
  period_start: "2026-08-01",
  remaining_voice_seconds: 0,
  salon_id: salonId,
  subscription_id:
    "30000000-0000-4000-8000-000000000001",
  updated_at: timestamp,
  used_voice_seconds: 18_600,
};

const call = {
  created_at: timestamp,
  customer_name: "Cliente",
  customer_phone: "+393331234567",
  duration_seconds: 90,
  ended_at: "2026-08-02T10:01:30.000Z",
  id: "50000000-0000-4000-8000-000000000001",
  outcome: "booking_completed",
  processing_status: "processed",
  requested_service: "Taglio",
  salon_id: salonId,
  started_at: timestamp,
  summary: "Appuntamento fissato",
  updated_at: timestamp,
};

describe("client dashboard data source", () => {
  it("usa fixture per impostazione predefinita", () => {
    expect(resolveClientDashboardDataSource(undefined)).toBe(
      "fixtures",
    );
  });

  it("accetta esplicitamente Supabase", () => {
    expect(resolveClientDashboardDataSource(" SUPABASE ")).toBe(
      "supabase",
    );
  });

  it("rifiuta valori non riconosciuti", () => {
    expect(() =>
      resolveClientDashboardDataSource("automatic"),
    ).toThrow();
  });
});

describe("Supabase client snapshot", () => {
  it("mantiene numero completo e consumo extra", () => {
    const snapshot =
      buildSupabaseClientDashboardSnapshot(salonId, {
        calls: [call],
        channels: [],
        conversations: [],
        now: new Date("2026-08-02T12:00:00.000Z"),
        salon,
        usagePeriod,
      });

    expect(snapshot.source).toBe("supabase");
    expect(snapshot.calls[0]?.customerPhone).toBe(
      "+393331234567",
    );
    expect(snapshot.usage.extraSeconds).toBe(600);
    expect(snapshot.usage.usagePercentage).toBe(100);
    expect(snapshot.reportingDate).toBe("2026-08-02");
  });

  it("esclude eventi fuori dal mese locale", () => {
    const snapshot =
      buildSupabaseClientDashboardSnapshot(salonId, {
        calls: [
          call,
          {
            ...call,
            id: "50000000-0000-4000-8000-000000000002",
            started_at: "2026-09-01T10:00:00.000Z",
          },
        ],
        channels: [],
        conversations: [],
        now: new Date("2026-08-02T12:00:00.000Z"),
        salon,
        usagePeriod,
      });

    expect(snapshot.calls).toHaveLength(1);
  });

  it("rifiuta righe appartenenti a un altro salone", () => {
    expect(() =>
      buildSupabaseClientDashboardSnapshot(salonId, {
        calls: [
          {
            ...call,
            salon_id:
              "10000000-0000-4000-8000-000000000002",
          },
        ],
        channels: [],
        conversations: [],
        salon,
        usagePeriod,
      }),
    ).toThrow(/altro salone/);
  });

  it("calcola correttamente il giorno nella timezone", () => {
    expect(
      getLocalDateInTimeZone(
        "2026-07-31T22:30:00.000Z",
        "Europe/Rome",
      ),
    ).toBe("2026-08-01");
  });
});
