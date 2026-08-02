import { z } from "zod";

import {
  clientCallRowSchema,
  clientChannelStatusRowSchema,
  clientSalonRowSchema,
  clientUsagePeriodRowSchema,
  clientWhatsAppConversationRowSchema,
  type ClientCallRow,
  type ClientChannelStatusRow,
  type ClientUsagePeriodRow,
  type ClientWhatsAppConversationRow,
} from "@/lib/persistence/client-read-models";
import {
  dashboardService,
} from "@/lib/services/mock-dashboard-service";
import { createClient } from "@/lib/supabase/server";

import type {
  ClientCallData,
  ClientChannelData,
  ClientConversationData,
  ClientDashboardDataSource,
  ClientDashboardSnapshot,
} from "./client-data";
import {
  calculateVoicePlanUsage,
  type CalendarMonthRange,
  type VoicePlanUsage,
} from "./voice-usage";

const clientDataSourceSchema = z.enum([
  "fixtures",
  "supabase",
]);

const clientCallRowsSchema = z.array(clientCallRowSchema);
const clientConversationRowsSchema = z.array(
  clientWhatsAppConversationRowSchema,
);
const clientChannelRowsSchema = z.array(
  clientChannelStatusRowSchema,
);

interface SupabaseSnapshotRows {
  calls: unknown;
  channels: unknown;
  conversations: unknown;
  now?: Date;
  salon: unknown;
  usagePeriod: unknown;
}

export class ClientDashboardDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientDashboardDataError";
  }
}

export function resolveClientDashboardDataSource(
  value = process.env.BETTERCALLQ_CLIENT_DATA_SOURCE,
): ClientDashboardDataSource {
  const normalized = value?.trim().toLowerCase() || "fixtures";
  const parsed = clientDataSourceSchema.safeParse(normalized);

  if (!parsed.success) {
    throw new ClientDashboardDataError(
      "BETTERCALLQ_CLIENT_DATA_SOURCE deve essere fixtures oppure supabase.",
    );
  }

  return parsed.data;
}

export function getLocalDateInTimeZone(
  value: Date | string,
  timeZone: string,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) =>
        ["day", "month", "year"].includes(type),
      )
      .map(({ type, value: partValue }) => [
        type,
        partValue,
      ]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function clampDateToRange(
  date: string,
  range: CalendarMonthRange,
): string {
  if (date < range.from) {
    return range.from;
  }

  if (date > range.to) {
    return range.to;
  }

  return date;
}

function isTimestampInRange(
  timestamp: string,
  range: CalendarMonthRange,
  timeZone: string,
): boolean {
  const localDate = getLocalDateInTimeZone(timestamp, timeZone);
  return localDate >= range.from && localDate <= range.to;
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T12:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function mapUsage(
  row: ClientUsagePeriodRow,
): VoicePlanUsage {
  const includedSeconds = row.included_voice_minutes * 60;

  return {
    extraSeconds: row.extra_voice_seconds,
    includedMinutes: row.included_voice_minutes,
    includedSeconds,
    includedSecondsUsed: Math.min(
      row.used_voice_seconds,
      includedSeconds,
    ),
    remainingSeconds: row.remaining_voice_seconds,
    usagePercentage: Math.min(
      (row.used_voice_seconds / includedSeconds) * 100,
      100,
    ),
    usedSeconds: row.used_voice_seconds,
  };
}

function mapCall(row: ClientCallRow): ClientCallData {
  return {
    customerName: row.customer_name ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    endedAt: row.ended_at ?? undefined,
    id: row.id,
    outcome: row.outcome,
    processingStatus: row.processing_status,
    requestedService: row.requested_service ?? undefined,
    startedAt: row.started_at,
    summary: row.summary ?? undefined,
  };
}

function mapConversation(
  row: ClientWhatsAppConversationRow,
): ClientConversationData {
  return {
    control: row.control,
    createdAt: row.created_at,
    customerName: row.customer_name ?? undefined,
    customerPhone: row.customer_phone,
    id: row.id,
    lastMessageAt: row.last_message_at ?? undefined,
    status: row.status,
    summary: row.summary ?? undefined,
  };
}

function mapChannel(
  row: ClientChannelStatusRow,
): ClientChannelData {
  return {
    channel: row.channel,
    checkedAt: row.checked_at,
    lastSuccessfulEventAt:
      row.last_successful_event_at ?? undefined,
    publicMessage: row.public_message ?? undefined,
    status: row.status,
  };
}

function assertSalonOwnership(
  expectedSalonId: string,
  rows: readonly { salon_id: string }[],
  label: string,
): void {
  if (rows.some((row) => row.salon_id !== expectedSalonId)) {
    throw new ClientDashboardDataError(
      `${label}: rilevata una riga appartenente a un altro salone.`,
    );
  }
}

export function buildSupabaseClientDashboardSnapshot(
  expectedSalonId: string,
  rows: SupabaseSnapshotRows,
): ClientDashboardSnapshot {
  const salon = clientSalonRowSchema.parse(rows.salon);
  const usagePeriod = clientUsagePeriodRowSchema.parse(
    rows.usagePeriod,
  );
  const calls = clientCallRowsSchema.parse(rows.calls);
  const conversations = clientConversationRowsSchema.parse(
    rows.conversations,
  );
  const channels = clientChannelRowsSchema.parse(rows.channels);

  if (
    salon.id !== expectedSalonId ||
    usagePeriod.salon_id !== expectedSalonId
  ) {
    throw new ClientDashboardDataError(
      "Il repository ha restituito un salone non autorizzato.",
    );
  }

  assertSalonOwnership(expectedSalonId, calls, "Chiamate");
  assertSalonOwnership(
    expectedSalonId,
    conversations,
    "WhatsApp",
  );
  assertSalonOwnership(expectedSalonId, channels, "Canali");

  const range = {
    from: usagePeriod.period_start,
    to: usagePeriod.period_end,
  };
  const reportingDate = clampDateToRange(
    getLocalDateInTimeZone(
      rows.now ?? new Date(),
      salon.timezone,
    ),
    range,
  );

  return {
    calls: calls
      .filter((call) =>
        isTimestampInRange(
          call.started_at,
          range,
          salon.timezone,
        ),
      )
      .map(mapCall),
    channels: channels.map(mapChannel),
    conversations: conversations
      .filter((conversation) =>
        isTimestampInRange(
          conversation.created_at,
          range,
          salon.timezone,
        ),
      )
      .map(mapConversation),
    range,
    reportingDate,
    salon: {
      id: salon.id,
      name: salon.name,
      timezone: salon.timezone,
    },
    source: "supabase",
    usage: mapUsage(usagePeriod),
  };
}

async function loadFixtureSnapshot(
  salonId: string,
): Promise<ClientDashboardSnapshot> {
  const [salon, reportingDate] = await Promise.all([
    dashboardService.getSalon(salonId),
    dashboardService.getReportingDate(salonId),
  ]);
  const reporting = new Date(`${reportingDate}T12:00:00Z`);
  const range = {
    from: new Date(
      Date.UTC(
        reporting.getUTCFullYear(),
        reporting.getUTCMonth(),
        1,
      ),
    )
      .toISOString()
      .slice(0, 10),
    to: new Date(
      Date.UTC(
        reporting.getUTCFullYear(),
        reporting.getUTCMonth() + 1,
        0,
      ),
    )
      .toISOString()
      .slice(0, 10),
  };
  const [calls, conversations, channels] = await Promise.all([
    dashboardService.listCalls(salonId, range),
    dashboardService.listConversations(salonId),
    dashboardService.getChannelStatuses(salonId),
  ]);

  return {
    calls: calls.map((call) => ({
      customerName: call.customerName,
      customerPhone: call.customerPhone,
      durationSeconds: call.durationSeconds,
      endedAt: call.endedAt,
      id: call.id,
      outcome: call.outcome,
      processingStatus: call.processingStatus,
      requestedService: call.requestedService,
      startedAt: call.startedAt,
      summary: call.summary,
    })),
    channels: channels.map((channel) => ({
      channel: channel.channel,
      checkedAt: channel.checkedAt,
      lastSuccessfulEventAt:
        channel.lastSuccessfulEventAt,
      publicMessage: channel.message,
      status: channel.status,
    })),
    conversations: conversations
      .filter((conversation) =>
        isTimestampInRange(
          conversation.createdAt,
          range,
          salon.timezone,
        ),
      )
      .map((conversation) => ({
        control: conversation.control,
        createdAt: conversation.createdAt,
        customerName: conversation.customerName,
        customerPhone: conversation.customerPhone,
        id: conversation.id,
        lastMessageAt: conversation.lastMessageAt,
        status: conversation.status,
        summary: conversation.summary,
      })),
    range,
    reportingDate,
    salon: {
      id: salon.id,
      name: salon.name,
      timezone: salon.timezone,
    },
    source: "fixtures",
    usage: calculateVoicePlanUsage(calls),
  };
}

async function loadSupabaseSnapshot(
  salonId: string,
): Promise<ClientDashboardSnapshot> {
  const supabase = await createClient();
  const [salonResponse, usageResponse] = await Promise.all([
    supabase
      .from("client_salons")
      .select(
        "id,name,timezone,locale,phone_number,whatsapp_number,address,status,created_at,updated_at",
      )
      .eq("id", salonId)
      .maybeSingle(),
    supabase
      .from("client_usage_periods")
      .select(
        "id,salon_id,subscription_id,period_start,period_end,included_voice_minutes,used_voice_seconds,remaining_voice_seconds,extra_voice_seconds,calculated_at,created_at,updated_at",
      )
      .eq("salon_id", salonId)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (salonResponse.error || !salonResponse.data) {
    throw new ClientDashboardDataError(
      "Impossibile caricare il salone autorizzato.",
    );
  }

  if (usageResponse.error || !usageResponse.data) {
    throw new ClientDashboardDataError(
      "Nessun periodo di utilizzo configurato per il salone.",
    );
  }

  const usagePeriod = clientUsagePeriodRowSchema.parse(
    usageResponse.data,
  );
  const queryFrom = shiftDate(
    usagePeriod.period_start,
    -1,
  );
  const queryTo = shiftDate(
    usagePeriod.period_end,
    2,
  );

  const [
    callsResponse,
    conversationsResponse,
    channelsResponse,
  ] = await Promise.all([
    supabase
      .from("client_calls")
      .select(
        "id,salon_id,customer_phone,customer_name,started_at,ended_at,duration_seconds,outcome,summary,requested_service,processing_status,created_at,updated_at",
      )
      .eq("salon_id", salonId)
      .gte("started_at", `${queryFrom}T00:00:00.000Z`)
      .lt("started_at", `${queryTo}T00:00:00.000Z`)
      .order("started_at", { ascending: false })
      .limit(1000),
    supabase
      .from("client_whatsapp_conversations")
      .select(
        "id,salon_id,customer_phone,customer_name,status,control,summary,last_message_at,created_at,updated_at",
      )
      .eq("salon_id", salonId)
      .gte("created_at", `${queryFrom}T00:00:00.000Z`)
      .lt("created_at", `${queryTo}T00:00:00.000Z`)
      .order("last_message_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(1000),
    supabase
      .from("client_channel_statuses")
      .select(
        "id,salon_id,channel,status,checked_at,last_successful_event_at,public_message,created_at,updated_at",
      )
      .eq("salon_id", salonId),
  ]);

  if (callsResponse.error) {
    throw new ClientDashboardDataError(
      "Impossibile caricare le chiamate.",
    );
  }

  if (conversationsResponse.error) {
    throw new ClientDashboardDataError(
      "Impossibile caricare WhatsApp.",
    );
  }

  if (channelsResponse.error) {
    throw new ClientDashboardDataError(
      "Impossibile caricare lo stato dei canali.",
    );
  }

  return buildSupabaseClientDashboardSnapshot(salonId, {
    calls: callsResponse.data ?? [],
    channels: channelsResponse.data ?? [],
    conversations: conversationsResponse.data ?? [],
    salon: salonResponse.data,
    usagePeriod: usageResponse.data,
  });
}

export async function loadClientDashboardSnapshot(
  salonId: string,
): Promise<ClientDashboardSnapshot> {
  const source = resolveClientDashboardDataSource();

  if (source === "supabase") {
    return loadSupabaseSnapshot(salonId);
  }

  return loadFixtureSnapshot(salonId);
}
