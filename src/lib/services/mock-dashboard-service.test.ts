import { beforeEach, describe, expect, it } from "vitest";

import {
  bookingReferenceSchema,
  callOutcomeSchema,
  callSchema,
  channelStatusSchema,
  conversationSchema,
  conversationStatusSchema,
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
  ConversationNotFoundError,
  ConversationTransitionError,
  InterventionNotFoundError,
  InterventionTransitionError,
  MockDashboardService,
  SalonNotFoundError,
} from "./mock-dashboard-service";

let service: MockDashboardService;

beforeEach(() => {
  service = new MockDashboardService();
});

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

  it("copre tutti gli stati previsti per le conversazioni", () => {
    const expectedStatuses = conversationStatusSchema.options.toSorted();
    const fixtureStatuses = [
      ...new Set(
        pilotFixtureSet.conversations.map(
          (conversation) => conversation.status,
        ),
      ),
    ].toSorted();

    expect(fixtureStatuses).toEqual(expectedStatuses);
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

  it("pagina lo storico chiamate e calcola il riepilogo sui risultati filtrati", async () => {
    const history = await service.listCallHistory(PILOT_SALON_ID, {
      page: 1,
      pageSize: 3,
    });

    expect(history).toMatchObject({
      page: 1,
      pageSize: 3,
      totalItems: 7,
      totalPages: 3,
      summary: {
        totalCalls: 7,
        averageDurationSeconds: 59,
        completedAutomatically: 2,
        needsAttention: 3,
      },
    });
    expect(history.items.map((item) => item.call.externalCallId)).toEqual([
      "demo-call-abandoned",
      "demo-call-error",
      "demo-call-incomplete",
    ]);
    expect(history.summary.outcomeCounts).toEqual({
      booking_completed: 1,
      information_provided: 1,
      change_or_cancellation: 1,
      transferred: 1,
      incomplete: 1,
      technical_error: 1,
      abandoned: 1,
    });
  });

  it("filtra lo storico per data locale ed esito prima della paginazione", async () => {
    const history = await service.listCallHistory(PILOT_SALON_ID, {
      outcomes: ["technical_error"],
      from: "2026-07-30",
      to: "2026-07-30",
      pageSize: 1,
    });

    expect(history).toMatchObject({
      totalItems: 1,
      totalPages: 1,
      summary: {
        totalCalls: 1,
        completedAutomatically: 0,
        needsAttention: 1,
      },
    });
    expect(history.items[0]).toMatchObject({
      call: { externalCallId: "demo-call-error" },
      intervention: {
        reason: "booking_sync_failed",
        status: "open",
      },
      bookingReference: { syncStatus: "failed" },
    });
  });

  it("restituisce il dettaglio della chiamata con i riferimenti correlati", async () => {
    const detail = await service.getCall(
      PILOT_SALON_ID,
      pilotFixtureSet.calls[3].id,
    );

    expect(detail).toMatchObject({
      call: { outcome: "transferred" },
      intervention: {
        reason: "human_requested",
        status: "resolved",
      },
      bookingReference: null,
    });
    await expect(
      service.getCall(
        PILOT_SALON_ID,
        "20000000-0000-4000-8000-000000000099",
      ),
    ).resolves.toBeNull();
  });

  it("riflette nel dettaglio chiamata lo stato corrente dell'intervento", async () => {
    const intervention = pilotFixtureSet.interventions[1];

    await service.resolveIntervention(PILOT_SALON_ID, intervention.id, {
      resolutionNote: "Prenotazione verificata nella simulazione.",
      occurredAt: "2026-07-30T11:58:00.000Z",
    });
    const detail = await service.getCall(
      PILOT_SALON_ID,
      pilotFixtureSet.calls[5].id,
    );

    expect(detail?.intervention).toMatchObject({
      id: intervention.id,
      status: "resolved",
      resolutionNote: "Prenotazione verificata nella simulazione.",
    });
  });

  it("valida intervallo e parametri di paginazione delle chiamate", async () => {
    await expect(
      service.listCallHistory(PILOT_SALON_ID, {
        from: "2026-07-31",
        to: "2026-07-30",
      }),
    ).rejects.toBeInstanceOf(RangeError);
    await expect(
      service.listCallHistory(PILOT_SALON_ID, { page: 0 }),
    ).rejects.toBeInstanceOf(RangeError);
    await expect(
      service.listCallHistory(PILOT_SALON_ID, { pageSize: 51 }),
    ).rejects.toBeInstanceOf(RangeError);
  });

  it("filtra gli interventi per stato e priorità", async () => {
    const interventions = await service.listInterventions(PILOT_SALON_ID, {
      statuses: ["open"],
      priorities: ["urgent"],
    });

    expect(interventions).toHaveLength(1);
    expect(interventions[0].reason).toBe("booking_sync_failed");
  });

  it("filtra gli interventi per canale, motivo e intervallo locale", async () => {
    const interventions = await service.listInterventions(PILOT_SALON_ID, {
      sources: ["whatsapp"],
      reasons: ["special_request"],
      from: "2026-07-30",
      to: "2026-07-30",
    });

    expect(interventions).toHaveLength(1);
    expect(interventions[0]).toMatchObject({
      source: "whatsapp",
      reason: "special_request",
    });
  });

  it("mantiene la priorità come ordine principale della coda attiva", async () => {
    const interventions = await service.listInterventions(PILOT_SALON_ID, {
      statuses: ["open", "in_progress"],
    });

    expect(interventions.map((item) => item.priority)).toEqual([
      "urgent",
      "high",
      "medium",
    ]);

    await service.markInterventionInProgress(
      PILOT_SALON_ID,
      pilotFixtureSet.interventions[1].id,
      "2026-07-30T11:40:00.000Z",
    );
    const updatedQueue = await service.listInterventions(PILOT_SALON_ID, {
      statuses: ["open", "in_progress"],
    });
    expect(updatedQueue[0].priority).toBe("urgent");
  });

  it("restituisce il dettaglio con i riferimenti correlati", async () => {
    const detail = await service.getIntervention(
      PILOT_SALON_ID,
      pilotFixtureSet.interventions[1].id,
    );

    expect(detail?.intervention.reason).toBe("booking_sync_failed");
    expect(detail?.call?.outcome).toBe("technical_error");
    expect(detail?.bookingReference?.syncStatus).toBe("failed");
    expect(detail?.conversation).toBeNull();
  });

  it("restituisce null per un intervento inesistente", async () => {
    await expect(
      service.getIntervention(
        PILOT_SALON_ID,
        "40000000-0000-4000-8000-000000000099",
      ),
    ).resolves.toBeNull();
  });

  it("prende in carico e risolve aggiornando coda e panoramica", async () => {
    const interventionId = pilotFixtureSet.interventions[0].id;

    await expect(
      service.markInterventionInProgress(
        PILOT_SALON_ID,
        interventionId,
        "2026-07-30T11:45:00.000Z",
      ),
    ).resolves.toMatchObject({ status: "in_progress" });

    await expect(
      service.resolveIntervention(PILOT_SALON_ID, interventionId, {
        resolutionNote: "Cliente richiamato nella simulazione.",
        occurredAt: "2026-07-30T11:50:00.000Z",
      }),
    ).resolves.toMatchObject({
      status: "resolved",
      resolutionNote: "Cliente richiamato nella simulazione.",
      resolvedAt: "2026-07-30T11:50:00.000Z",
    });

    const [active, overview] = await Promise.all([
      service.listInterventions(PILOT_SALON_ID, {
        statuses: ["open", "in_progress"],
      }),
      service.getOverview(PILOT_SALON_ID, {
        from: "2026-07-30",
        to: "2026-07-30",
      }),
    ]);

    expect(active).toHaveLength(2);
    expect(overview.openInterventions).toBe(2);
  });

  it("riapre una richiesta e ripristina il KPI attivo", async () => {
    const interventionId = pilotFixtureSet.interventions[3].id;

    const reopened = await service.reopenIntervention(
      PILOT_SALON_ID,
      interventionId,
      "2026-07-30T11:55:00.000Z",
    );
    const overview = await service.getOverview(PILOT_SALON_ID, {
      from: "2026-07-30",
      to: "2026-07-30",
    });

    expect(reopened).toMatchObject({
      status: "open",
      updatedAt: "2026-07-30T11:55:00.000Z",
    });
    expect(reopened.resolvedAt).toBeUndefined();
    expect(reopened.resolutionNote).toBeUndefined();
    expect(overview.openInterventions).toBe(4);
  });

  it("rifiuta transizioni non valide e interventi sconosciuti", async () => {
    const resolvedInterventionId = pilotFixtureSet.interventions[3].id;

    await expect(
      service.markInterventionInProgress(
        PILOT_SALON_ID,
        resolvedInterventionId,
      ),
    ).rejects.toBeInstanceOf(InterventionTransitionError);
    await expect(
      service.resolveIntervention(
        PILOT_SALON_ID,
        "40000000-0000-4000-8000-000000000099",
        { resolutionNote: "Nota demo" },
      ),
    ).rejects.toBeInstanceOf(InterventionNotFoundError);
  });

  it("rifiuta intervalli degli interventi invertiti", async () => {
    await expect(
      service.listInterventions(PILOT_SALON_ID, {
        from: "2026-07-31",
        to: "2026-07-30",
      }),
    ).rejects.toBeInstanceOf(RangeError);
  });

  it("ordina le conversazioni dalla più recente", async () => {
    const conversations = await service.listConversations(PILOT_SALON_ID);

    expect(conversations[0].externalConversationKey).toBe(
      "demo-conversation-needs-intervention",
    );
  });

  it("filtra la inbox e calcola il riepilogo sull'insieme completo", async () => {
    const inbox = await service.listConversationInbox(PILOT_SALON_ID, {
      statuses: ["human_control", "waiting_customer"],
      controls: ["human"],
      query: "demo",
    });

    expect(inbox.items).toHaveLength(2);
    expect(inbox.items.map((item) => item.conversation.status)).toEqual([
      "human_control",
      "waiting_customer",
    ]);
    expect(inbox.summary).toMatchObject({
      totalConversations: 5,
      needsIntervention: 1,
      humanControlled: 2,
      waitingCustomer: 1,
      completed: 1,
    });
    expect(inbox.summary.statusCounts).toEqual({
      ai_handled: 1,
      needs_intervention: 1,
      human_control: 1,
      waiting_customer: 1,
      completed: 1,
    });
  });

  it("restituisce i messaggi della conversazione in ordine cronologico", async () => {
    const detail = await service.getConversation(
      PILOT_SALON_ID,
      pilotFixtureSet.conversations[0].id,
    );

    expect(detail?.messages).toHaveLength(2);
    expect(detail?.messages[0].author).toBe("customer");
    expect(detail?.messages[1].author).toBe("ai");
    expect(detail?.aiRepliesAllowed).toBe(true);
    expect(detail?.intervention).toBeNull();
  });

  it("prende il controllo e sospende le risposte IA", async () => {
    const conversationId = pilotFixtureSet.conversations[1].id;

    await service.takeConversationControl(
      PILOT_SALON_ID,
      conversationId,
      "2026-07-30T11:40:00.000Z",
    );
    const detail = await service.getConversation(
      PILOT_SALON_ID,
      conversationId,
    );

    expect(detail).toMatchObject({
      conversation: {
        control: "human",
        status: "human_control",
        lastMessageAt: "2026-07-30T11:40:00.000Z",
      },
      intervention: { status: "in_progress" },
      aiRepliesAllowed: false,
    });
    expect(detail?.messages.at(-1)).toMatchObject({
      author: "system",
      body: expect.stringContaining("risposte automatiche sono sospese"),
    });
  });

  it("invia un messaggio manuale soltanto sotto controllo umano", async () => {
    const conversationId = pilotFixtureSet.conversations[0].id;
    const messageId = "31000000-0000-4000-8000-000000000099";

    await expect(
      service.sendManualMessage(PILOT_SALON_ID, conversationId, {
        body: "Messaggio non consentito",
      }),
    ).rejects.toBeInstanceOf(ConversationTransitionError);

    await service.takeConversationControl(
      PILOT_SALON_ID,
      conversationId,
      "2026-07-30T11:41:00.000Z",
    );
    await expect(
      service.sendManualMessage(PILOT_SALON_ID, conversationId, {
        body: "  Risposta manuale dimostrativa.  ",
        messageId,
        occurredAt: "2026-07-30T11:42:00.000Z",
      }),
    ).resolves.toMatchObject({
      id: messageId,
      author: "human",
      body: "Risposta manuale dimostrativa.",
      status: "sent",
    });

    const detail = await service.getConversation(
      PILOT_SALON_ID,
      conversationId,
    );
    expect(detail?.conversation).toMatchObject({
      control: "human",
      status: "waiting_customer",
      lastMessageAt: "2026-07-30T11:42:00.000Z",
    });
    expect(detail?.aiRepliesAllowed).toBe(false);
    expect(detail?.messages.at(-1)?.id).toBe(messageId);
  });

  it("restituisce la conversazione all'IA e risolve l'intervento collegato", async () => {
    const conversationId = pilotFixtureSet.conversations[1].id;

    await service.takeConversationControl(
      PILOT_SALON_ID,
      conversationId,
      "2026-07-30T11:43:00.000Z",
    );
    await service.releaseConversationControl(
      PILOT_SALON_ID,
      conversationId,
      "2026-07-30T11:44:00.000Z",
    );
    const detail = await service.getConversation(
      PILOT_SALON_ID,
      conversationId,
    );

    expect(detail).toMatchObject({
      conversation: { control: "ai", status: "ai_handled" },
      intervention: {
        status: "resolved",
        resolutionNote:
          "Richiesta gestita e conversazione restituita all'IA nella simulazione.",
      },
      aiRepliesAllowed: true,
    });
  });

  it("completa una conversazione e blocca altri invii", async () => {
    const conversationId = pilotFixtureSet.conversations[2].id;

    await service.completeConversation(
      PILOT_SALON_ID,
      conversationId,
      "2026-07-30T11:45:00.000Z",
    );
    const detail = await service.getConversation(
      PILOT_SALON_ID,
      conversationId,
    );

    expect(detail?.conversation.status).toBe("completed");
    expect(detail?.aiRepliesAllowed).toBe(false);
    await expect(
      service.sendManualMessage(PILOT_SALON_ID, conversationId, {
        body: "Messaggio dopo la chiusura",
      }),
    ).rejects.toBeInstanceOf(ConversationTransitionError);
  });

  it("valida testo, transizioni e conversazioni sconosciute", async () => {
    const humanConversationId = pilotFixtureSet.conversations[2].id;

    await expect(
      service.sendManualMessage(PILOT_SALON_ID, humanConversationId, {
        body: " ",
      }),
    ).rejects.toBeInstanceOf(RangeError);
    await expect(
      service.releaseConversationControl(
        PILOT_SALON_ID,
        pilotFixtureSet.conversations[0].id,
      ),
    ).rejects.toBeInstanceOf(ConversationTransitionError);
    await expect(
      service.takeConversationControl(
        PILOT_SALON_ID,
        "30000000-0000-4000-8000-000000000099",
      ),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("restituisce null per una conversazione inesistente", async () => {
    await expect(
      service.getConversation(
        PILOT_SALON_ID,
        "30000000-0000-4000-8000-000000000099",
      ),
    ).resolves.toBeNull();
  });

  it("salva e versiona le impostazioni senza pubblicarle su Vapi", async () => {
    const current = await service.getReceptionistSettings(PILOT_SALON_ID);
    const nextInput = {
      salonProfile: {
        ...current.salonProfile,
        description:
          "Nuova descrizione dimostrativa salvata soltanto nel service mock.",
      },
      openingHours: current.openingHours,
      closures: current.closures,
      services: current.services,
      faqs: current.faqs,
      policies: current.policies,
      escalation: current.escalation,
      voiceAndTone: current.voiceAndTone,
      bookingRules: current.bookingRules,
    };

    const saved = await service.updateReceptionistSettings(
      PILOT_SALON_ID,
      nextInput,
      "2026-07-30T12:00:00.000Z",
    );

    expect(saved).toMatchObject({
      version: current.version + 1,
      updatedAt: "2026-07-30T12:00:00.000Z",
      publishedAt: current.publishedAt,
      salonProfile: {
        description:
          "Nuova descrizione dimostrativa salvata soltanto nel service mock.",
      },
    });

    saved.salonProfile.description = "Mutazione esterna";
    await expect(
      service.getReceptionistSettings(PILOT_SALON_ID),
    ).resolves.toMatchObject({
      salonProfile: {
        description:
          "Nuova descrizione dimostrativa salvata soltanto nel service mock.",
      },
    });
  });

  it("non modifica le impostazioni quando l’aggiornamento non è valido", async () => {
    const current = await service.getReceptionistSettings(PILOT_SALON_ID);
    const invalidInput = {
      salonProfile: {
        ...current.salonProfile,
        description: "",
      },
      openingHours: current.openingHours,
      closures: current.closures,
      services: current.services,
      faqs: current.faqs,
      policies: current.policies,
      escalation: current.escalation,
      voiceAndTone: current.voiceAndTone,
      bookingRules: current.bookingRules,
    };

    await expect(
      service.updateReceptionistSettings(PILOT_SALON_ID, invalidInput),
    ).rejects.toThrow();
    await expect(
      service.getReceptionistSettings(PILOT_SALON_ID),
    ).resolves.toEqual(current);
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
      costTotalUsdMicros: 970000,
      projectedMonthlyCostUsdMicros: 14550000,
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
      costTotalUsdMicros: 480000,
      projectedMonthlyCostUsdMicros: 14400000,
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
