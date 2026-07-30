import type {
  Call,
  Conversation,
  DailyMetric,
  IntegrationError,
  Intervention,
} from "@/lib/domain";
import {
  PILOT_SALON_ID,
  pilotFixtureSet,
  type PilotFixtureSet,
} from "@/lib/fixtures/pilot-salon";

import type {
  CallFilters,
  ConversationDetail,
  DashboardService,
  DateRange,
  InterventionFilters,
  Overview,
} from "./dashboard-service";

export class SalonNotFoundError extends Error {
  constructor(salonId: string) {
    super(`Salone non disponibile: ${salonId}`);
    this.name = "SalonNotFoundError";
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

export class MockDashboardService implements DashboardService {
  constructor(private readonly fixtures: PilotFixtureSet = pilotFixtureSet) {}

  private assertSalon(salonId: string) {
    if (salonId !== this.fixtures.salon.id) {
      throw new SalonNotFoundError(salonId);
    }
  }

  async getSalon(salonId: string) {
    this.assertSalon(salonId);
    return copy(this.fixtures.salon);
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

  async listInterventions(
    salonId: string,
    filters: InterventionFilters = {},
  ) {
    this.assertSalon(salonId);

    const interventions = this.fixtures.interventions
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
      .toSorted((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );

    return copy(interventions);
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

    const metrics = this.fixtures.dailyMetrics
      .filter(
        (metric) =>
          metric.salonId === salonId &&
          isWithinLocalDateRange(metric.date, range),
      )
      .toSorted((left, right) => left.date.localeCompare(right.date));
    const openInterventions = this.fixtures.interventions.filter(
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
      estimatedCostCents: sum(
        metrics,
        (metric) => metric.estimatedCostCents,
      ),
      urgentInterventions: openInterventions.filter(
        (intervention) => intervention.priority === "urgent",
      ),
      recentCalls: newestCalls(this.fixtures.calls, salonId, 5),
      recentErrors: newestErrors(
        this.fixtures.integrationErrors,
        salonId,
        5,
      ),
      metrics,
    });
  }
}

const sum = <T>(items: T[], select: (item: T) => number) =>
  items.reduce((total, item) => total + select(item), 0);

const newestCalls = (calls: Call[], salonId: string, limit: number) =>
  calls
    .filter((call) => call.salonId === salonId)
    .toSorted((left, right) =>
      right.startedAt.localeCompare(left.startedAt),
    )
    .slice(0, limit);

const newestErrors = (
  errors: IntegrationError[],
  salonId: string,
  limit: number,
) =>
  errors
    .filter((error) => error.salonId === salonId)
    .toSorted((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    )
    .slice(0, limit);

export const dashboardService = new MockDashboardService();
export { PILOT_SALON_ID };

export type MockCall = Call;
export type MockConversation = Conversation;
export type MockDailyMetric = DailyMetric;
export type MockIntervention = Intervention;
