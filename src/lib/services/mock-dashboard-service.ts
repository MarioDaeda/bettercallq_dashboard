import type {
  BookingReference,
  Call,
  CallOutcome,
  Conversation,
  ConversationStatus,
  DailyMetric,
  IntegrationError,
  Intervention,
  Message,
} from "@/lib/domain";
import {
  callOutcomeSchema,
  conversationSchema,
  conversationStatusSchema,
  interventionSchema,
  messageSchema,
} from "@/lib/domain";
import {
  PILOT_SALON_ID,
  pilotFixtureSet,
  type PilotFixtureSet,
} from "@/lib/fixtures/pilot-salon";

import type {
  CallDetail,
  CallFilters,
  CallHistoryPage,
  CallHistoryQuery,
  CallListItem,
  CallSummary,
  ConversationFilters,
  ConversationInbox,
  ConversationInboxSummary,
  ConversationListItem,
  ConversationDetail,
  DashboardService,
  DateRange,
  InterventionDetail,
  InterventionFilters,
  Overview,
  OverviewActivity,
  ResolveInterventionInput,
  SendManualMessageInput,
} from "./dashboard-service";

export class SalonNotFoundError extends Error {
  constructor(salonId: string) {
    super(`Salone non disponibile: ${salonId}`);
    this.name = "SalonNotFoundError";
  }
}

export class InterventionNotFoundError extends Error {
  constructor(interventionId: string) {
    super(`Intervento non disponibile: ${interventionId}`);
    this.name = "InterventionNotFoundError";
  }
}

export class InterventionTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterventionTransitionError";
  }
}

export class ConversationNotFoundError extends Error {
  constructor(conversationId: string) {
    super(`Conversazione non disponibile: ${conversationId}`);
    this.name = "ConversationNotFoundError";
  }
}

export class ConversationTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConversationTransitionError";
  }
}

const copy = <T>(value: T): T => structuredClone(value);

const isWithinDateTimeRange = (
  value: string,
  from?: string,
  to?: string,
) => {
  const timestamp = Date.parse(value);
  return (
    (from === undefined || timestamp >= Date.parse(from)) &&
    (to === undefined || timestamp <= Date.parse(to))
  );
};

const isWithinLocalDateRange = (date: string, range: DateRange) =>
  date >= range.from && date <= range.to;

const toLocalDate = (value: string, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
};

const isDateTimeWithinLocalDateRange = (
  value: string,
  range: DateRange,
  timeZone: string,
) => isWithinLocalDateRange(toLocalDate(value, timeZone), range);

const isWithinOptionalLocalDateRange = (
  value: string,
  from: string | undefined,
  to: string | undefined,
  timeZone: string,
) => {
  const localDate = toLocalDate(value, timeZone);

  return (
    (from === undefined || localDate >= from) &&
    (to === undefined || localDate <= to)
  );
};

const DEFAULT_CALL_PAGE_SIZE = 5;
const MAX_CALL_PAGE_SIZE = 50;

const emptyOutcomeCounts = (): Record<CallOutcome, number> =>
  Object.fromEntries(
    callOutcomeSchema.options.map((outcome) => [outcome, 0]),
  ) as Record<CallOutcome, number>;

const completedAutomaticallyOutcomes: CallOutcome[] = [
  "booking_completed",
  "information_provided",
];

const needsAttentionOutcomes: CallOutcome[] = [
  "incomplete",
  "technical_error",
  "abandoned",
];

const emptyConversationStatusCounts = (): Record<
  ConversationStatus,
  number
> =>
  Object.fromEntries(
    conversationStatusSchema.options.map((status) => [status, 0]),
  ) as Record<ConversationStatus, number>;

const interventionPriorityOrder: Record<Intervention["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const interventionStatusOrder: Record<Intervention["status"], number> = {
  open: 0,
  in_progress: 1,
  resolved: 2,
  dismissed: 3,
};

const sortInterventions = (left: Intervention, right: Intervention) => {
  const leftIsActive = ["open", "in_progress"].includes(left.status);
  const rightIsActive = ["open", "in_progress"].includes(right.status);
  if (leftIsActive !== rightIsActive) {
    return leftIsActive ? -1 : 1;
  }

  const priorityDifference =
    interventionPriorityOrder[left.priority] -
    interventionPriorityOrder[right.priority];
  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const statusDifference =
    interventionStatusOrder[left.status] -
    interventionStatusOrder[right.status];
  if (statusDifference !== 0) {
    return statusDifference;
  }

  return leftIsActive
    ? left.createdAt.localeCompare(right.createdAt)
    : right.updatedAt.localeCompare(left.updatedAt);
};

export class MockDashboardService implements DashboardService {
  private readonly fixtures: PilotFixtureSet;
  private interventions: Intervention[];
  private conversations: Conversation[];
  private messages: Message[];

  constructor(fixtures: PilotFixtureSet = pilotFixtureSet) {
    this.fixtures = fixtures;
    this.interventions = copy(fixtures.interventions);
    this.conversations = copy(fixtures.conversations);
    this.messages = copy(fixtures.messages);
  }

  private assertSalon(salonId: string) {
    if (salonId !== this.fixtures.salon.id) {
      throw new SalonNotFoundError(salonId);
    }
  }

  async getSalon(salonId: string) {
    this.assertSalon(salonId);
    return copy(this.fixtures.salon);
  }

  async getReportingDate(salonId: string) {
    this.assertSalon(salonId);

    return (
      this.fixtures.dailyMetrics
        .filter((metric) => metric.salonId === salonId)
        .toSorted((left, right) => right.date.localeCompare(left.date))
        .at(0)?.date ?? toLocalDate(this.fixtures.salon.updatedAt, this.fixtures.salon.timezone)
    );
  }

  async getChannelStatuses(salonId: string) {
    this.assertSalon(salonId);
    return copy(
      this.fixtures.channelStatuses.filter(
        (channel) => channel.salonId === salonId,
      ),
    );
  }

  async listCalls(salonId: string, filters: CallFilters = {}) {
    this.assertSalon(salonId);

    const calls = this.fixtures.calls
      .filter((call) => call.salonId === salonId)
      .filter(
        (call) =>
          filters.outcomes === undefined ||
          filters.outcomes.includes(call.outcome),
      )
      .filter((call) =>
        isWithinDateTimeRange(call.startedAt, filters.from, filters.to),
      )
      .toSorted((left, right) =>
        right.startedAt.localeCompare(left.startedAt),
      );

    return copy(calls);
  }

  async listCallHistory(
    salonId: string,
    query: CallHistoryQuery = {},
  ): Promise<CallHistoryPage> {
    this.assertSalon(salonId);
    if (
      query.from !== undefined &&
      query.to !== undefined &&
      query.from > query.to
    ) {
      throw new RangeError("L'intervallo delle chiamate non è valido.");
    }

    const requestedPage = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_CALL_PAGE_SIZE;
    if (!Number.isInteger(requestedPage) || requestedPage < 1) {
      throw new RangeError("La pagina delle chiamate deve essere positiva.");
    }
    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_CALL_PAGE_SIZE
    ) {
      throw new RangeError(
        `La pagina delle chiamate può contenere da 1 a ${MAX_CALL_PAGE_SIZE} elementi.`,
      );
    }

    const calls = this.fixtures.calls
      .filter((call) => call.salonId === salonId)
      .filter(
        (call) =>
          query.outcomes === undefined ||
          query.outcomes.includes(call.outcome),
      )
      .filter((call) =>
        isWithinOptionalLocalDateRange(
          call.startedAt,
          query.from,
          query.to,
          this.fixtures.salon.timezone,
        ),
      )
      .toSorted((left, right) =>
        right.startedAt.localeCompare(left.startedAt),
      );

    const totalItems = calls.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const start = (page - 1) * pageSize;
    const items = calls
      .slice(start, start + pageSize)
      .map((call) => this.toCallListItem(salonId, call));

    return copy({
      items,
      page,
      pageSize,
      totalItems,
      totalPages,
      summary: calculateCallSummary(calls),
    });
  }

  async getCall(
    salonId: string,
    callId: string,
  ): Promise<CallDetail | null> {
    this.assertSalon(salonId);
    const call = this.fixtures.calls.find(
      (item) => item.salonId === salonId && item.id === callId,
    );

    return call ? copy(this.toCallListItem(salonId, call)) : null;
  }

  async listInterventions(
    salonId: string,
    filters: InterventionFilters = {},
  ) {
    this.assertSalon(salonId);
    if (
      filters.from !== undefined &&
      filters.to !== undefined &&
      filters.from > filters.to
    ) {
      throw new RangeError("L'intervallo degli interventi non è valido.");
    }

    const interventions = this.interventions
      .filter((intervention) => intervention.salonId === salonId)
      .filter(
        (intervention) =>
          filters.statuses === undefined ||
          filters.statuses.includes(intervention.status),
      )
      .filter(
        (intervention) =>
          filters.priorities === undefined ||
          filters.priorities.includes(intervention.priority),
      )
      .filter(
        (intervention) =>
          filters.sources === undefined ||
          filters.sources.includes(intervention.source),
      )
      .filter(
        (intervention) =>
          filters.reasons === undefined ||
          filters.reasons.includes(intervention.reason),
      )
      .filter((intervention) =>
        isWithinOptionalLocalDateRange(
          intervention.createdAt,
          filters.from,
          filters.to,
          this.fixtures.salon.timezone,
        ),
      )
      .toSorted(sortInterventions);

    return copy(interventions);
  }

  async getIntervention(
    salonId: string,
    interventionId: string,
  ): Promise<InterventionDetail | null> {
    this.assertSalon(salonId);
    const intervention = this.interventions.find(
      (item) => item.salonId === salonId && item.id === interventionId,
    );

    if (intervention === undefined) {
      return null;
    }

    const call =
      this.fixtures.calls.find(
        (item) =>
          item.salonId === salonId && item.id === intervention.callId,
      ) ?? null;
    const conversation =
      this.conversations.find(
        (item) =>
          item.salonId === salonId &&
          item.id === intervention.conversationId,
      ) ?? null;
    const bookingReference =
      this.fixtures.bookingReferences.find(
        (item) =>
          item.salonId === salonId &&
          item.id === intervention.bookingReferenceId,
      ) ?? null;

    return copy({ intervention, call, conversation, bookingReference });
  }

  async markInterventionInProgress(
    salonId: string,
    interventionId: string,
    occurredAt = new Date().toISOString(),
  ) {
    const current = this.requireIntervention(salonId, interventionId);

    if (current.status === "in_progress") {
      return copy(current);
    }
    if (current.status !== "open") {
      throw new InterventionTransitionError(
        "Solo una richiesta aperta può essere presa in carico.",
      );
    }

    return this.replaceIntervention(
      interventionSchema.parse({
        ...current,
        status: "in_progress",
        updatedAt: occurredAt,
      }),
    );
  }

  async resolveIntervention(
    salonId: string,
    interventionId: string,
    input: ResolveInterventionInput,
  ) {
    const current = this.requireIntervention(salonId, interventionId);
    if (!["open", "in_progress"].includes(current.status)) {
      throw new InterventionTransitionError(
        "Solo una richiesta attiva può essere segnata come risolta.",
      );
    }

    const resolutionNote = input.resolutionNote.trim();
    if (resolutionNote.length === 0) {
      throw new RangeError("Inserisci una breve nota di risoluzione.");
    }

    const occurredAt = input.occurredAt ?? new Date().toISOString();
    return this.replaceIntervention(
      interventionSchema.parse({
        ...current,
        status: "resolved",
        resolvedAt: occurredAt,
        resolutionNote,
        resolvedByUserId: input.resolvedByUserId,
        updatedAt: occurredAt,
      }),
    );
  }

  async reopenIntervention(
    salonId: string,
    interventionId: string,
    occurredAt = new Date().toISOString(),
  ) {
    const current = this.requireIntervention(salonId, interventionId);
    if (!["resolved", "dismissed"].includes(current.status)) {
      throw new InterventionTransitionError(
        "Solo una richiesta chiusa può essere riaperta.",
      );
    }

    const reopened = copy(current);
    delete reopened.resolutionNote;
    delete reopened.resolvedAt;
    delete reopened.resolvedByUserId;

    return this.replaceIntervention(
      interventionSchema.parse({
        ...reopened,
        status: "open",
        updatedAt: occurredAt,
      }),
    );
  }

  async listConversations(salonId: string) {
    this.assertSalon(salonId);
    return copy(
      this.conversations
        .filter((conversation) => conversation.salonId === salonId)
        .toSorted((left, right) =>
          (right.lastMessageAt ?? right.createdAt).localeCompare(
            left.lastMessageAt ?? left.createdAt,
          ),
        ),
    );
  }

  async listConversationInbox(
    salonId: string,
    filters: ConversationFilters = {},
  ): Promise<ConversationInbox> {
    this.assertSalon(salonId);
    const conversations = this.conversations.filter(
      (conversation) => conversation.salonId === salonId,
    );
    const query = filters.query?.trim().toLocaleLowerCase("it-IT");
    const filtered = conversations
      .filter(
        (conversation) =>
          filters.statuses === undefined ||
          filters.statuses.includes(conversation.status),
      )
      .filter(
        (conversation) =>
          filters.controls === undefined ||
          filters.controls.includes(conversation.control),
      )
      .filter((conversation) => {
        if (!query) {
          return true;
        }

        const searchableConversation = [
          conversation.customerName,
          conversation.customerPhone,
          conversation.summary,
        ]
          .filter((value): value is string => value !== undefined)
          .join(" ")
          .toLocaleLowerCase("it-IT");
        const searchableMessages = this.messages
          .filter(
            (message) =>
              message.salonId === salonId &&
              message.conversationId === conversation.id,
          )
          .map((message) => message.body)
          .join(" ")
          .toLocaleLowerCase("it-IT");

        return (
          searchableConversation.includes(query) ||
          searchableMessages.includes(query)
        );
      })
      .toSorted((left, right) =>
        (right.lastMessageAt ?? right.createdAt).localeCompare(
          left.lastMessageAt ?? left.createdAt,
        ),
      );

    return copy({
      items: filtered.map((conversation) =>
        this.toConversationListItem(salonId, conversation),
      ),
      totalItems: filtered.length,
      summary: calculateConversationSummary(conversations),
    });
  }

  async getConversation(
    salonId: string,
    conversationId: string,
  ): Promise<ConversationDetail | null> {
    this.assertSalon(salonId);
    const conversation = this.conversations.find(
      (item) => item.salonId === salonId && item.id === conversationId,
    );

    if (conversation === undefined) {
      return null;
    }

    return copy(this.toConversationDetail(salonId, conversation));
  }

  async takeConversationControl(
    salonId: string,
    conversationId: string,
    occurredAt = new Date().toISOString(),
  ) {
    const current = this.requireConversation(salonId, conversationId);
    if (current.status === "completed") {
      throw new ConversationTransitionError(
        "Una conversazione completata non può essere presa in carico.",
      );
    }
    if (current.control === "human") {
      return copy(current);
    }

    const updated = this.replaceConversation(
      conversationSchema.parse({
        ...current,
        control: "human",
        status: "human_control",
        lastMessageAt: occurredAt,
        updatedAt: occurredAt,
      }),
    );
    this.appendSystemMessage(
      salonId,
      conversationId,
      "Il salone ha preso il controllo. Le risposte automatiche sono sospese.",
      occurredAt,
    );

    const intervention = this.findConversationIntervention(
      salonId,
      conversationId,
    );
    if (intervention?.status === "open") {
      await this.markInterventionInProgress(
        salonId,
        intervention.id,
        occurredAt,
      );
    }

    return copy(updated);
  }

  async releaseConversationControl(
    salonId: string,
    conversationId: string,
    occurredAt = new Date().toISOString(),
  ) {
    const current = this.requireConversation(salonId, conversationId);
    if (current.status === "completed") {
      throw new ConversationTransitionError(
        "Una conversazione completata non può essere restituita all'IA.",
      );
    }
    if (current.control !== "human") {
      throw new ConversationTransitionError(
        "Il controllo appartiene già all'IA.",
      );
    }

    const updated = this.replaceConversation(
      conversationSchema.parse({
        ...current,
        control: "ai",
        status: "ai_handled",
        lastMessageAt: occurredAt,
        updatedAt: occurredAt,
      }),
    );
    this.appendSystemMessage(
      salonId,
      conversationId,
      "Il controllo è stato restituito all'IA nella simulazione.",
      occurredAt,
    );
    await this.resolveConversationIntervention(
      salonId,
      conversationId,
      "Richiesta gestita e conversazione restituita all'IA nella simulazione.",
      occurredAt,
    );

    return copy(updated);
  }

  async completeConversation(
    salonId: string,
    conversationId: string,
    occurredAt = new Date().toISOString(),
  ) {
    const current = this.requireConversation(salonId, conversationId);
    if (current.status === "completed") {
      return copy(current);
    }
    if (current.control !== "human") {
      throw new ConversationTransitionError(
        "Prendi il controllo prima di completare la conversazione.",
      );
    }

    const updated = this.replaceConversation(
      conversationSchema.parse({
        ...current,
        status: "completed",
        lastMessageAt: occurredAt,
        updatedAt: occurredAt,
      }),
    );
    this.appendSystemMessage(
      salonId,
      conversationId,
      "Conversazione completata manualmente nella simulazione.",
      occurredAt,
    );
    await this.resolveConversationIntervention(
      salonId,
      conversationId,
      "Conversazione completata manualmente nella simulazione.",
      occurredAt,
    );

    return copy(updated);
  }

  async sendManualMessage(
    salonId: string,
    conversationId: string,
    input: SendManualMessageInput,
  ) {
    const current = this.requireConversation(salonId, conversationId);
    if (
      current.control !== "human" ||
      current.status === "completed"
    ) {
      throw new ConversationTransitionError(
        "L'invio manuale richiede il controllo del salone.",
      );
    }

    const body = input.body.trim();
    if (body.length === 0 || body.length > 1000) {
      throw new RangeError(
        "Il messaggio deve contenere da 1 a 1000 caratteri.",
      );
    }

    const occurredAt = input.occurredAt ?? new Date().toISOString();
    const message = messageSchema.parse({
      id: input.messageId ?? globalThis.crypto.randomUUID(),
      salonId,
      conversationId,
      author: "human",
      direction: "outbound",
      body,
      status: "sent",
      sentAt: occurredAt,
      createdAt: occurredAt,
      updatedAt: occurredAt,
    });
    this.messages.push(message);
    this.replaceConversation(
      conversationSchema.parse({
        ...current,
        status: "waiting_customer",
        lastMessageAt: occurredAt,
        updatedAt: occurredAt,
      }),
    );

    return copy(message);
  }

  private toConversationDetail(
    salonId: string,
    conversation: Conversation,
  ): ConversationDetail {
    const messages = this.messages
      .filter(
        (message) =>
          message.salonId === salonId &&
          message.conversationId === conversation.id,
      )
      .toSorted((left, right) => left.sentAt.localeCompare(right.sentAt));
    const intervention = this.findConversationIntervention(
      salonId,
      conversation.id,
    );
    const bookingReference =
      this.fixtures.bookingReferences.find(
        (item) =>
          item.salonId === salonId &&
          item.id === conversation.bookingReferenceId,
      ) ?? null;

    return {
      conversation,
      messages,
      intervention,
      bookingReference,
      aiRepliesAllowed:
        conversation.control === "ai" &&
        conversation.status === "ai_handled",
    };
  }

  async getReceptionistSettings(salonId: string) {
    this.assertSalon(salonId);
    return copy(this.fixtures.receptionistSettings);
  }

  async getOverview(
    salonId: string,
    range: DateRange,
  ): Promise<Overview> {
    this.assertSalon(salonId);
    if (range.from > range.to) {
      throw new RangeError("L'intervallo della panoramica non è valido.");
    }

    const timeZone = this.fixtures.salon.timezone;
    const metrics = this.fixtures.dailyMetrics
      .filter(
        (metric) =>
          metric.salonId === salonId &&
          isWithinLocalDateRange(metric.date, range),
      )
      .toSorted((left, right) => left.date.localeCompare(right.date));
    const estimatedCostCents = sum(
      metrics,
      (metric) => metric.estimatedCostCents,
    );
    const openInterventions = this.interventions.filter(
      (intervention) =>
        intervention.salonId === salonId &&
        ["open", "in_progress"].includes(intervention.status),
    );

    return copy({
      salonId,
      range,
      channels: await this.getChannelStatuses(salonId),
      callsReceived: sum(metrics, (metric) => metric.callsReceived),
      bookingsAttributed: sum(
        metrics,
        (metric) => metric.bookingsAttributed,
      ),
      openInterventions: openInterventions.length,
      estimatedCostCents,
      estimatedMonthlyCostCents: estimateMonthlyCost(
        estimatedCostCents,
        metrics.length,
      ),
      urgentInterventions: openInterventions.filter(
        (intervention) => intervention.priority === "urgent",
      ),
      recentCalls: newestCalls(
        this.fixtures.calls,
        salonId,
        range,
        timeZone,
        5,
      ),
      recentActivities: newestActivities(
        this.fixtures,
        this.interventions,
        this.conversations,
        salonId,
        range,
        timeZone,
        6,
      ),
      recentErrors: newestErrors(
        this.fixtures.integrationErrors,
        salonId,
        range,
        timeZone,
        5,
      ),
      metrics,
    });
  }

  private requireConversation(salonId: string, conversationId: string) {
    this.assertSalon(salonId);
    const conversation = this.conversations.find(
      (item) => item.salonId === salonId && item.id === conversationId,
    );

    if (conversation === undefined) {
      throw new ConversationNotFoundError(conversationId);
    }

    return conversation;
  }

  private findConversationIntervention(
    salonId: string,
    conversationId: string,
  ) {
    return (
      this.interventions
        .filter(
          (item) =>
            item.salonId === salonId &&
            item.conversationId === conversationId,
        )
        .toSorted(sortInterventions)
        .at(0) ?? null
    );
  }

  private toConversationListItem(
    salonId: string,
    conversation: Conversation,
  ): ConversationListItem {
    const lastMessage =
      this.messages
        .filter(
          (message) =>
            message.salonId === salonId &&
            message.conversationId === conversation.id,
        )
        .toSorted((left, right) =>
          right.sentAt.localeCompare(left.sentAt),
        )
        .at(0) ?? null;

    return {
      conversation,
      lastMessage,
      intervention: this.findConversationIntervention(
        salonId,
        conversation.id,
      ),
    };
  }

  private replaceConversation(conversation: Conversation) {
    const index = this.conversations.findIndex(
      (item) => item.id === conversation.id,
    );
    this.conversations[index] = conversation;
    return copy(conversation);
  }

  private appendSystemMessage(
    salonId: string,
    conversationId: string,
    body: string,
    occurredAt: string,
  ) {
    this.messages.push(
      messageSchema.parse({
        id: globalThis.crypto.randomUUID(),
        salonId,
        conversationId,
        author: "system",
        direction: "outbound",
        body,
        status: "sent",
        sentAt: occurredAt,
        createdAt: occurredAt,
        updatedAt: occurredAt,
      }),
    );
  }

  private async resolveConversationIntervention(
    salonId: string,
    conversationId: string,
    resolutionNote: string,
    occurredAt: string,
  ) {
    const intervention = this.findConversationIntervention(
      salonId,
      conversationId,
    );
    if (
      intervention &&
      ["open", "in_progress"].includes(intervention.status)
    ) {
      await this.resolveIntervention(salonId, intervention.id, {
        resolutionNote,
        occurredAt,
      });
    }
  }

  private requireIntervention(salonId: string, interventionId: string) {
    this.assertSalon(salonId);
    const intervention = this.interventions.find(
      (item) => item.salonId === salonId && item.id === interventionId,
    );

    if (intervention === undefined) {
      throw new InterventionNotFoundError(interventionId);
    }

    return intervention;
  }

  private toCallListItem(salonId: string, call: Call): CallListItem {
    const intervention =
      this.interventions
        .filter(
          (item) => item.salonId === salonId && item.callId === call.id,
        )
        .toSorted(sortInterventions)
        .at(0) ?? null;
    const bookingReference =
      this.fixtures.bookingReferences.find(
        (item) =>
          item.salonId === salonId &&
          item.id === call.bookingReferenceId,
      ) ?? null;

    return { call, intervention, bookingReference };
  }

  private replaceIntervention(intervention: Intervention) {
    const index = this.interventions.findIndex(
      (item) => item.id === intervention.id,
    );
    this.interventions[index] = intervention;
    return copy(intervention);
  }
}

const sum = <T>(items: T[], select: (item: T) => number) =>
  items.reduce((total, item) => total + select(item), 0);

const calculateCallSummary = (calls: Call[]): CallSummary => {
  const durations = calls.flatMap((call) =>
    call.durationSeconds === undefined ? [] : [call.durationSeconds],
  );
  const outcomeCounts = calls.reduce((counts, call) => {
    counts[call.outcome] += 1;
    return counts;
  }, emptyOutcomeCounts());

  return {
    totalCalls: calls.length,
    averageDurationSeconds:
      durations.length === 0
        ? 0
        : Math.round(sum(durations, (duration) => duration) / durations.length),
    completedAutomatically: calls.filter((call) =>
      completedAutomaticallyOutcomes.includes(call.outcome),
    ).length,
    needsAttention: calls.filter((call) =>
      needsAttentionOutcomes.includes(call.outcome),
    ).length,
    outcomeCounts,
  };
};

const calculateConversationSummary = (
  conversations: Conversation[],
): ConversationInboxSummary => {
  const statusCounts = conversations.reduce((counts, conversation) => {
    counts[conversation.status] += 1;
    return counts;
  }, emptyConversationStatusCounts());

  return {
    totalConversations: conversations.length,
    needsIntervention: statusCounts.needs_intervention,
    humanControlled: conversations.filter(
      (conversation) =>
        conversation.control === "human" &&
        conversation.status !== "completed",
    ).length,
    waitingCustomer: statusCounts.waiting_customer,
    completed: statusCounts.completed,
    statusCounts,
  };
};

const estimateMonthlyCost = (totalCostCents: number, measuredDays: number) =>
  measuredDays === 0
    ? 0
    : Math.round((totalCostCents / measuredDays) * 30);

const newestCalls = (
  calls: Call[],
  salonId: string,
  range: DateRange,
  timeZone: string,
  limit: number,
) =>
  calls
    .filter(
      (call) =>
        call.salonId === salonId &&
        isDateTimeWithinLocalDateRange(call.startedAt, range, timeZone),
    )
    .toSorted((left, right) =>
      right.startedAt.localeCompare(left.startedAt),
    )
    .slice(0, limit);

const newestErrors = (
  errors: IntegrationError[],
  salonId: string,
  range: DateRange,
  timeZone: string,
  limit: number,
) =>
  errors
    .filter(
      (error) =>
        error.salonId === salonId &&
        isDateTimeWithinLocalDateRange(error.createdAt, range, timeZone),
    )
    .toSorted((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    )
    .slice(0, limit);

const newestActivities = (
  fixtures: PilotFixtureSet,
  interventionsState: Intervention[],
  conversationsState: Conversation[],
  salonId: string,
  range: DateRange,
  timeZone: string,
  limit: number,
): OverviewActivity[] => {
  const calls: OverviewActivity[] = fixtures.calls
    .filter((item) => item.salonId === salonId)
    .map((item) => ({ kind: "call", occurredAt: item.startedAt, item }));
  const conversations: OverviewActivity[] = conversationsState
    .filter((item) => item.salonId === salonId)
    .map((item) => ({
      kind: "conversation",
      occurredAt: item.lastMessageAt ?? item.updatedAt,
      item,
    }));
  const interventions: OverviewActivity[] = interventionsState
    .filter((item) => item.salonId === salonId)
    .map((item) => ({
      kind: "intervention",
      occurredAt: item.createdAt,
      item,
    }));
  const bookings: OverviewActivity[] = fixtures.bookingReferences
    .filter((item) => item.salonId === salonId)
    .map((item: BookingReference) => ({
      kind: "booking",
      occurredAt: item.createdAt,
      item,
    }));

  return [...calls, ...conversations, ...interventions, ...bookings]
    .filter((activity) =>
      isDateTimeWithinLocalDateRange(
        activity.occurredAt,
        range,
        timeZone,
      ),
    )
    .toSorted((left, right) =>
      right.occurredAt.localeCompare(left.occurredAt),
    )
    .slice(0, limit);
};

export const dashboardService = new MockDashboardService();
export { PILOT_SALON_ID };

export type MockCall = Call;
export type MockConversation = Conversation;
export type MockDailyMetric = DailyMetric;
export type MockIntervention = Intervention;
