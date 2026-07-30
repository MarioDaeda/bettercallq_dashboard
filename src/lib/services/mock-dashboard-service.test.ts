import { describe, expect, it } from "vitest";

import {
  bookingReferenceSchema,
  callOutcomeSchema,
  callSchema,
  channelStatusSchema,
  conversationSchema,
  dailyMetricSchema,
  integrationErrorSchema,
  interventionSchema,
  messageSchema,
  receptionistSettingsSchema,
  salonSchema,
} from "@/lib/domain";
import {
  PILOT_SALON_ID,
  pilotFixtureSet,
} from "@/lib/fixtures/pilot-salon";

import {
  MockDashboardService,
  SalonNotFoundError,
} from "./mock-dashboard-service";

const service = new MockDashboardService();

describe("fixture del salone pilota", () => {
  it("valida il salone", () => {
    expect(salonSchema.parse(pilotFixtureSet.salon).id).toBe(PILOT_SALON_ID);
  });

  it("valida tutti i contratti operativi", () => {
    expect(() => {
      pilotFixtureSet.calls.forEach((item) => callSchema.parse(item));
      pilotFixtureSet.conversations.forEach((item) =>
        conversationSchema.parse(item),
      );
      pilotFixtureSet.messages.forEach((item) => messageSchema.parse(item));
      pilotFixtureSet.interventions.forEach((item) =>
        interventionSchema.parse(item),
      );
      pilotFixtureSet.bookingReferences.forEach((item) =>
        bookingReferenceSchema.parse(item),
      );
      pilotFixtureSet.channelStatuses.forEach((item) =>
        channelStatusSchema.parse(item),
      );
      receptionistSettingsSchema.parse(pilotFixtureSet.receptionistSettings);
      pilotFixtureSet.integrationErrors.forEach((item) =>
        integrationErrorSchema.parse(item),
      );
      pilotFixtureSet.dailyMetrics.forEach((item) =>
        dailyMetricSchema.parse(item),
      );
    }).not.toThrow();
  });

  it("copre tutti gli esiti previsti per le chiamate", () => {
    const expectedOutcomes = callOutcomeSchema.options.toSorted();
    const fixtureOutcomes = [
      ...new Set(pilotFixtureSet.calls.map((call) => call.outcome)),
    ].toSorted();

    expect(fixtureOutcomes).toEqual(expectedOutcomes);
  });

  it("associa ogni entità operativa al salone", () => {
    const entities = [
      ...pilotFixtureSet.calls,
      ...pilotFixtureSet.conversations,
      ...pilotFixtureSet.messages,
      ...pilotFixtureSet.interventions,
      ...pilotFixtureSet.bookingReferences,
      ...pilotFixtureSet.channelStatuses,
      pilotFixtureSet.receptionistSettings,
      ...pilotFixtureSet.integrationErrors,
      ...pilotFixtureSet.dailyMetrics,
    ];

    expect(entities.every((entity) => entity.salonId === PILOT_SALON_ID)).toBe(
      true,
    );
  });

  it("mantiene Treatwell esplicitamente non configurato", () => {
    const bookingChannel = pilotFixtureSet.channelStatuses.find(
      (channel) => channel.channel === "booking_provider",
    );

    expect(bookingChannel?.status).toBe("not_configured");
    expect(bookingChannel?.capability).toEqual({
      readAvailability: false,
      createBooking: false,
      updateBooking: false,
      cancelBooking: false,
    });
  });
});

describe("MockDashboardService", () => {
  it("isola i dati usando salonId", async () => {
    await expect(
      service.getSalon("10000000-0000-4000-8000-000000000099"),
    ).rejects.toBeInstanceOf(SalonNotFoundError);
  });

  it("restituisce copie e non espone le fixture mutabili", async () => {
    const salon = await service.getSalon(PILOT_SALON_ID);
    salon.name = "Nome modificato nel test";

    await expect(service.getSalon(PILOT_SALON_ID)).resolves.toMatchObject({
      name: "Studio Chioma Demo",
    });
  });

  it("espone la data più recente disponibile senza leggere le fixture dalla pagina", async () => {
    await expect(service.getReportingDate(PILOT_SALON_ID)).resolves.toBe(
      "2026-07-30",
    );
  });

  it("filtra le chiamate per esito", async () => {
    const calls = await service.listCalls(PILOT_SALON_ID, {
      outcomes: ["technical_error"],
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].outcome).toBe("technical_error");
  });

  it("filtra le chiamate per intervallo temporale", async () => {
    const calls = await service.listCalls(PILOT_SALON_ID, {
      from: "2026-07-30T10:00:00.000Z",
      to: "2026-07-30T11:00:00.000Z",
    });

    expect(calls.map((call) => call.externalCallId)).toEqual([
      "demo-call-error",
    ]);
  });

  it("filtra gli interventi per stato e priorità", async () => {
    const interventions = await service.listInterventions(PILOT_SALON_ID, {
      statuses: ["open"],
      priorities: ["urgent"],
    });

    expect(interventions).toHaveLength(1);
    expect(interventions[0].reason).toBe("booking_sync_failed");
  });

  it("ordina le conversazioni dalla più recente", async () => {
    const conversations = await service.listConversations(PILOT_SALON_ID);

    expect(conversations[0].externalConversationKey).toBe(
      "demo-conversation-human",
    );
  });

  it("restituisce i messaggi della conversazione in ordine cronologico", async () => {
    const detail = await service.getConversation(
      PILOT_SALON_ID,
      pilotFixtureSet.conversations[0].id,
    );

    expect(detail?.messages).toHaveLength(2);
    expect(detail?.messages[0].author).toBe("customer");
    expect(detail?.messages[1].author).toBe("ai");
  });

  it("restituisce null per una conversazione inesistente", async () => {
    await expect(
      service.getConversation(
        PILOT_SALON_ID,
        "30000000-0000-4000-8000-000000000099",
      ),
    ).resolves.toBeNull();
  });

  it("calcola il riepilogo dal service layer", async () => {
    const overview = await service.getOverview(PILOT_SALON_ID, {
      from: "2026-07-29",
      to: "2026-07-30",
    });

    expect(overview).toMatchObject({
      callsReceived: 16,
      bookingsAttributed: 5,
      openInterventions: 3,
      estimatedCostCents: 97,
      estimatedMonthlyCostCents: 1455,
    });
    expect(overview.metrics).toHaveLength(2);
    expect(overview.recentActivities).toHaveLength(6);
  });

  it("collega il periodo a metriche, chiamate, attività ed errori", async () => {
    const overview = await service.getOverview(PILOT_SALON_ID, {
      from: "2026-07-27",
      to: "2026-07-27",
    });

    expect(overview).toMatchObject({
      callsReceived: 8,
      bookingsAttributed: 3,
      estimatedCostCents: 48,
      estimatedMonthlyCostCents: 1440,
    });
    expect(overview.recentCalls).toEqual([]);
    expect(overview.recentActivities).toEqual([]);
    expect(overview.recentErrors).toEqual([]);
  });

  it("rifiuta intervalli temporali invertiti", async () => {
    await expect(
      service.getOverview(PILOT_SALON_ID, {
        from: "2026-07-30",
        to: "2026-07-29",
      }),
    ).rejects.toBeInstanceOf(RangeError);
  });
});
