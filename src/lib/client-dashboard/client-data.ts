import type {
  CallOutcome,
  ChannelKind,
  ConversationControl,
  ConversationStatus,
  HealthStatus,
} from "@/lib/domain";

import type {
  CalendarMonthRange,
  VoicePlanUsage,
} from "./voice-usage";

export type ClientDashboardDataSource =
  | "fixtures"
  | "supabase";

export interface ClientSalonData {
  id: string;
  name: string;
  timezone: string;
}

export interface ClientCallData {
  id: string;
  customerName?: string;
  customerPhone?: string;
  durationSeconds?: number;
  endedAt?: string;
  outcome: CallOutcome;
  processingStatus: "receiving" | "processed" | "failed";
  requestedService?: string;
  startedAt: string;
  summary?: string;
}

export interface ClientConversationData {
  control: ConversationControl;
  createdAt: string;
  customerName?: string;
  customerPhone: string;
  id: string;
  lastMessageAt?: string;
  status: ConversationStatus;
  summary?: string;
}

export interface ClientChannelData {
  channel: ChannelKind;
  checkedAt: string;
  lastSuccessfulEventAt?: string;
  publicMessage?: string;
  status: HealthStatus;
}

export interface ClientDashboardSnapshot {
  calls: ClientCallData[];
  channels: ClientChannelData[];
  conversations: ClientConversationData[];
  range: CalendarMonthRange;
  reportingDate: string;
  salon: ClientSalonData;
  source: ClientDashboardDataSource;
  usage: VoicePlanUsage;
}

export function countClientBookings(
  calls: readonly ClientCallData[],
): number {
  return calls.filter(
    (call) => call.outcome === "booking_completed",
  ).length;
}

export function calculateAverageCallDuration(
  calls: readonly ClientCallData[],
): number {
  const durations = calls
    .map((call) => call.durationSeconds)
    .filter(
      (duration): duration is number =>
        typeof duration === "number",
    );

  if (durations.length === 0) {
    return 0;
  }

  return Math.round(
    durations.reduce((total, duration) => total + duration, 0) /
      durations.length,
  );
}
