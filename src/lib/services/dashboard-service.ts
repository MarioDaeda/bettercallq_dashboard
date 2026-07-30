import type {
  Call,
  CallOutcome,
  ChannelStatus,
  Conversation,
  DailyMetric,
  IntegrationError,
  Intervention,
  InterventionPriority,
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

export interface InterventionFilters {
  statuses?: InterventionStatus[];
  priorities?: InterventionPriority[];
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
}

export interface Overview {
  salonId: string;
  range: DateRange;
  channels: ChannelStatus[];
  callsReceived: number;
  bookingsAttributed: number;
  openInterventions: number;
  estimatedCostCents: number;
  urgentInterventions: Intervention[];
  recentCalls: Call[];
  recentErrors: IntegrationError[];
  metrics: DailyMetric[];
}

export interface DashboardService {
  getSalon(salonId: string): Promise<Salon>;
  getChannelStatuses(salonId: string): Promise<ChannelStatus[]>;
  getOverview(salonId: string, range: DateRange): Promise<Overview>;
  listCalls(salonId: string, filters?: CallFilters): Promise<Call[]>;
  listInterventions(
    salonId: string,
    filters?: InterventionFilters,
  ): Promise<Intervention[]>;
  listConversations(salonId: string): Promise<Conversation[]>;
  getConversation(
    salonId: string,
    conversationId: string,
  ): Promise<ConversationDetail | null>;
  getReceptionistSettings(salonId: string): Promise<ReceptionistSettings>;
}
