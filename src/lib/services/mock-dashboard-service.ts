import type {
  BookingReference,
  Call,
  CallOutcome,
  Conversation,
  DailyMetric,
  IntegrationError,
  Intervention,
} from "@/lib/domain";
import { callOutcomeSchema, interventionSchema } from "@/lib/domain";
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
  ConversationDetail,
  DashboardService,
  DateRange,
  InterventionDetail,
  InterventionFilters,
  Overview,
  OverviewActivity,
  ResolveInterventionInput,
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

  constructor(fixtures: PilotFixtureSet = pilotFixtureSet) {
    this.fixtures = fixtures;
    this.interventions = copy(fixtures.interventions);
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
      this.fixtures.conversations.find(
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
      this.fixtures.conversations
        .filter((conversation) => conversation.salonId === salonId)
        .toSorted((left, right) =>
          (right.lastMessageAt ?? right.createdAt).localeCompare(
            left.lastMessageAt ?? left.createdAt,
          ),
        ),
    );
  }

  async getConversation(
    salonId: string,
    conversationId: string,
  ): Promise<ConversationDetail | null> {
    this.assertSalon(salonId);
    const conversation = this.fixtures.conversations.find(
      (item) => item.salonId === salonId && item.id === conversationId,
    );

    if (conversation === undefined) {
      return null;
    }

    const messages = this.fixtures.messages
      .filter(
        (message) =>
          message.salonId === salonId &&
          message.conversationId === conversationId,
      )
      .toSorted((left, right) => left.sentAt.localeCompare(right.sentAt));

    return copy({ conversation, messages });
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
  salonId: string,
  range: DateRange,
  timeZone: string,
  limit: number,
): OverviewActivity[] => {
  const calls: OverviewActivity[] = fixtures.calls
    .filter((item) => item.salonId === salonId)
    .map((item) => ({ kind: "call", occurredAt: item.startedAt, item }));
  const conversations: OverviewActivity[] = fixtures.conversations
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
