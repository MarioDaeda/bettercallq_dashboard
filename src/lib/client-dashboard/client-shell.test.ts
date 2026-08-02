import { describe, expect, it } from "vitest";

import type {
  ChannelStatus,
  Salon,
} from "@/lib/domain";

import type { ClientDashboardSnapshot } from "./client-data";
import { buildClientShellState } from "./client-shell";

const timestamp = "2026-08-02T15:25:34.735Z";
const salonId =
  "10000000-0000-4000-8000-000000000001";

const fixtureSalon: Salon = {
  address: {
    city: "Forlì",
    country: "IT",
    postalCode: "47121",
    province: "FC",
    street: "Via Esempio 10",
  },
  createdAt: timestamp,
  id: salonId,
  locale: "it-IT",
  name: "Studio Chioma Demo",
  status: "active",
  timezone: "Europe/Rome",
  updatedAt: timestamp,
};

const fixtureChannels: ChannelStatus[] = [
  {
    channel: "vapi",
    checkedAt: timestamp,
    createdAt: timestamp,
    id: "70000000-0000-4000-8000-000000000001",
    message: "Fixture",
    salonId,
    status: "not_configured",
    updatedAt: timestamp,
  },
  {
    channel: "whatsapp",
    checkedAt: timestamp,
    createdAt: timestamp,
    id: "70000000-0000-4000-8000-000000000002",
    salonId,
    status: "not_configured",
    updatedAt: timestamp,
  },
];

const snapshot: ClientDashboardSnapshot = {
  calls: [],
  channels: [
    {
      channel: "vapi",
      checkedAt: timestamp,
      publicMessage:
        "Ultima chiamata acquisita correttamente.",
      status: "operational",
    },
    {
      channel: "whatsapp",
      checkedAt: timestamp,
      status: "not_configured",
    },
  ],
  conversations: [],
  range: {
    from: "2026-08-01",
    to: "2026-08-31",
  },
  reportingDate: "2026-08-02",
  salon: {
    id: salonId,
    name: "Gianluca Tadonio",
    timezone: "Europe/Rome",
  },
  source: "supabase",
  usage: {
    extraSeconds: 0,
    includedMinutes: 300,
    includedSeconds: 18_000,
    includedSecondsUsed: 90,
    remainingSeconds: 17_910,
    usagePercentage: 0.5,
    usedSeconds: 90,
  },
};

describe("shell cliente Production", () => {
  it("sostituisce nome e stato fixture con i dati Supabase", () => {
    const result = buildClientShellState(
      fixtureSalon,
      fixtureChannels,
      snapshot,
    );

    expect(result.salon.name).toBe(
      "Gianluca Tadonio",
    );
    expect(result.channels[0]?.status).toBe(
      "operational",
    );
    expect(result.channels[0]?.message).toBe(
      "Ultima chiamata acquisita correttamente.",
    );
    expect(result.showDemoNotice).toBe(false);
  });

  it("mantiene il cartello demo soltanto con sorgente fixture", () => {
    expect(
      buildClientShellState(
        fixtureSalon,
        fixtureChannels,
        {
          ...snapshot,
          source: "fixtures",
        },
      ).showDemoNotice,
    ).toBe(true);
  });
});
