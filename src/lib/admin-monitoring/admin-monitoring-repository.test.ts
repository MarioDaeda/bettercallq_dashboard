import { describe, expect, it } from "vitest";

import {
  AdminMonitoringDataError,
  buildAdminMonitoringPageData,
} from "./admin-monitoring-repository";

const salonId =
  "10000000-0000-4000-8000-000000000001";

function createRows() {
  return {
    calls: [
      {
        created_at: "2026-08-02T10:00:00.000Z",
        customer_name: "Mario Test",
        customer_phone: null,
        duration_seconds: 90,
        ended_at: "2026-08-02T10:01:30.000Z",
        id: "50000000-0000-4000-8000-000000000001",
        outcome: "booking_completed",
        processing_status: "processed",
        requested_service: "Taglio uomo",
        salon_id: salonId,
        started_at: "2026-08-02T10:00:00.000Z",
        summary: "Prenotazione completata.",
        updated_at: "2026-08-02T10:02:00.000Z",
      },
      {
        created_at: "2026-08-01T10:00:00.000Z",
        customer_name: null,
        customer_phone: null,
        duration_seconds: 30,
        ended_at: "2026-08-01T10:00:30.000Z",
        id: "50000000-0000-4000-8000-000000000002",
        outcome: "technical_error",
        processing_status: "failed",
        requested_service: null,
        salon_id: salonId,
        started_at: "2026-08-01T10:00:00.000Z",
        summary: null,
        updated_at: "2026-08-01T10:01:00.000Z",
      },
    ],
    channels: [
      {
        channel: "vapi",
        checked_at: "2026-08-02T11:00:00.000Z",
        created_at: "2026-08-02T09:00:00.000Z",
        id: "70000000-0000-4000-8000-000000000001",
        last_successful_event_at:
          "2026-08-02T10:01:30.000Z",
        public_message: "Canale temporaneamente degradato.",
        salon_id: salonId,
        status: "degraded",
        updated_at: "2026-08-02T11:00:00.000Z",
      },
    ],
    conversations: [
      {
        control: "human",
        created_at: "2026-08-02T09:00:00.000Z",
        customer_name: "Cliente WhatsApp",
        customer_phone: "+393331234567",
        id: "60000000-0000-4000-8000-000000000001",
        last_message_at: "2026-08-02T09:05:00.000Z",
        salon_id: salonId,
        status: "needs_intervention",
        summary: "Richiesta da verificare.",
        updated_at: "2026-08-02T09:05:00.000Z",
      },
    ],
    now: new Date("2026-08-02T12:00:00.000Z"),
    salon: {
      address: {},
      created_at: "2026-08-01T08:00:00.000Z",
      id: salonId,
      locale: "it-IT",
      name: "Gianluca Tadonio",
      phone_number: "+3905431632730",
      status: "trial",
      timezone: "Europe/Rome",
      updated_at: "2026-08-02T08:00:00.000Z",
      whatsapp_number: "+393926778774",
    },
  };
}

describe("admin monitoring repository", () => {
  it("aggrega chiamate reali senza usare fixture", () => {
    const data = buildAdminMonitoringPageData(
      salonId,
      "7d",
      createRows(),
    );

    const totals = data.current.metrics.reduce(
      (result, metric) => ({
        bookings:
          result.bookings +
          metric.bookingsAttributed,
        calls: result.calls + metric.callsReceived,
        completed:
          result.completed +
          metric.callsCompleted,
        cost:
          result.cost +
          metric.estimatedCostCents,
        duration:
          result.duration +
          metric.callDurationSeconds,
        errors:
          result.errors +
          metric.integrationErrors,
        interventions:
          result.interventions +
          metric.interventionsCreated,
        whatsapp:
          result.whatsapp +
          metric.whatsappConversations,
      }),
      {
        bookings: 0,
        calls: 0,
        completed: 0,
        cost: 0,
        duration: 0,
        errors: 0,
        interventions: 0,
        whatsapp: 0,
      },
    );

    expect(data.reportingDate).toBe("2026-08-02");
    expect(data.salon.name).toBe("Gianluca Tadonio");
    expect(totals).toEqual({
      bookings: 1,
      calls: 2,
      completed: 1,
      cost: 8,
      duration: 120,
      errors: 2,
      interventions: 1,
      whatsapp: 1,
    });
    expect(data.current.recentErrors).toHaveLength(2);
    expect(data.current.openInterventions).toBe(1);
    expect(
      data.previous.metrics.every(
        (metric) => metric.callsReceived === 0,
      ),
    ).toBe(true);
  });

  it("blocca righe appartenenti a un altro salone", () => {
    const rows = createRows();
    rows.calls[0].salon_id =
      "20000000-0000-4000-8000-000000000002";

    expect(() =>
      buildAdminMonitoringPageData(
        salonId,
        "7d",
        rows,
      ),
    ).toThrow(AdminMonitoringDataError);
  });
});
