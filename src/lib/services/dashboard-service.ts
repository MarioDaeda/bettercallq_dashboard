import type {
  BookingReference,
  Call,
  CallOutcome,
  ChannelStatus,
  Conversation,
  ConversationControl,
  ConversationStatus,
  DailyMetric,
  IntegrationError,
  Intervention,
  InterventionPriority,
  InterventionReason,
  InterventionSource,
  InterventionStatus,
  Message,
  ReceptionistSettings,
  Salon,
} from "@/lib/domain";

export interface DateRange {
  from: string;
  to: string;
}

export interface CallFilters {
  outcomes?: CallOutcome[];
  from?: string;
  to?: string;
}

export interface CallHistoryQuery {
  outcomes?: CallOutcome[];
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface CallListItem {
  call: Call;
  intervention: Intervention | null;
  bookingReference: BookingReference | null;
}

export interface CallSummary {
  totalCalls: number;
  averageDurationSeconds: number;
  completedAutomatically: number;
  needsAttention: number;
  outcomeCounts: Record<CallOutcome, number>;
}

export interface CallHistoryPage {
  items: CallListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  summary: CallSummary;
}

export type CallDetail = CallListItem;

export interface InterventionFilters {
  statuses?: InterventionStatus[];
  priorities?: InterventionPriority[];
  sources?: InterventionSource[];
  reasons?: InterventionReason[];
  from?: string;
  to?: string;
}

export interface InterventionDetail {
  intervention: Intervention;
  call: Call | null;
  conversation: Conversation | null;
  bookingReference: BookingReference | null;
}

export interface ResolveInterventionInput {
  resolutionNote: string;
  occurredAt?: string;
  resolvedByUserId?: string;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
  intervention: Intervention | null;
  bookingReference: BookingReference | null;
  aiRepliesAllowed: boolean;
}

export interface ConversationFilters {
  statuses?: ConversationStatus[];
  controls?: ConversationControl[];
  query?: string;
}

export interface ConversationListItem {
  conversation: Conversation;
  lastMessage: Message | null;
  intervention: Intervention | null;
}

export interface ConversationInboxSummary {
  totalConversations: number;
  needsIntervention: number;
  humanControlled: number;
  waitingCustomer: number;
  completed: number;
  statusCounts: Record<ConversationStatus, number>;
}

export interface ConversationInbox {
  items: ConversationListItem[];
  totalItems: number;
  summary: ConversationInboxSummary;
}

export interface SendManualMessageInput {
  body: string;
  occurredAt?: string;
  messageId?: string;
}

export type OverviewActivity =
  | {
      kind: "call";
      occurredAt: string;
      item: Call;
    }
  | {
      kind: "conversation";
      occurredAt: string;
      item: Conversation;
    }
  | {
      kind: "intervention";
      occurredAt: string;
      item: Intervention;
    }
  | {
      kind: "booking";
      occurredAt: string;
      item: BookingReference;
    };

export interface Overview {
  salonId: string;
  range: DateRange;
  channels: ChannelStatus[];
  callsReceived: number;
  bookingsAttributed: number;
  openInterventions: number;
  estimatedCostCents: number;
  estimatedMonthlyCostCents: number;
  urgentInterventions: Intervention[];
  recentCalls: Call[];
  recentActivities: OverviewActivity[];
  recentErrors: IntegrationError[];
  metrics: DailyMetric[];
}

export interface DashboardService {
  getSalon(salonId: string): Promise<Salon>;
  getReportingDate(salonId: string): Promise<string>;
  getChannelStatuses(salonId: string): Promise<ChannelStatus[]>;
  getOverview(salonId: string, range: DateRange): Promise<Overview>;
  listCalls(salonId: string, filters?: CallFilters): Promise<Call[]>;
  listCallHistory(
    salonId: string,
    query?: CallHistoryQuery,
  ): Promise<CallHistoryPage>;
  getCall(salonId: string, callId: string): Promise<CallDetail | null>;
  listInterventions(
    salonId: string,
    filters?: InterventionFilters,
  ): Promise<Intervention[]>;
  getIntervention(
    salonId: string,
    interventionId: string,
  ): Promise<InterventionDetail | null>;
  markInterventionInProgress(
    salonId: string,
    interventionId: string,
    occurredAt?: string,
  ): Promise<Intervention>;
  resolveIntervention(
    salonId: string,
    interventionId: string,
    input: ResolveInterventionInput,
  ): Promise<Intervention>;
  reopenIntervention(
    salonId: string,
    interventionId: string,
    occurredAt?: string,
  ): Promise<Intervention>;
  listConversations(salonId: string): Promise<Conversation[]>;
  listConversationInbox(
    salonId: string,
    filters?: ConversationFilters,
  ): Promise<ConversationInbox>;
  getConversation(
    salonId: string,
    conversationId: string,
  ): Promise<ConversationDetail | null>;
  takeConversationControl(
    salonId: string,
    conversationId: string,
    occurredAt?: string,
  ): Promise<Conversation>;
  releaseConversationControl(
    salonId: string,
    conversationId: string,
    occurredAt?: string,
  ): Promise<Conversation>;
  completeConversation(
    salonId: string,
    conversationId: string,
    occurredAt?: string,
  ): Promise<Conversation>;
  sendManualMessage(
    salonId: string,
    conversationId: string,
    input: SendManualMessageInput,
  ): Promise<Message>;
  getReceptionistSettings(salonId: string): Promise<ReceptionistSettings>;
}
