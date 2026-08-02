import { createHash } from "node:crypto";

import { z } from "zod";

import {
  dailyMetricSchema,
  postalAddressSchema,
  salonSchema,
  type ChannelStatus,
  type DailyMetric,
  type IntegrationError,
  type Salon,
} from "@/lib/domain";
import {
  demoCostRates,
  resolveMonitoringRanges,
  type MonitoringPeriod,
} from "@/lib/monitoring/monitoring";
import {
  clientCallRowSchema,
  clientChannelStatusRowSchema,
  clientSalonRowSchema,
  clientWhatsAppConversationRowSchema,
  type ClientCallRow,
  type ClientChannelStatusRow,
  type ClientSalonRow,
  type ClientWhatsAppConversationRow,
} from "@/lib/persistence/client-read-models";
import type {
  DateRange,
  Overview,
} from "@/lib/services/dashboard-service";
import { createClient } from "@/lib/supabase/server";

const callRowsSchema = z.array(clientCallRowSchema);
const channelRowsSchema = z.array(clientChannelStatusRowSchema);
const conversationRowsSchema = z.array(
  clientWhatsAppConversationRowSchema,
);
const optionalSalonIdSchema = z.string().uuid();

const completedOutcomes = new Set<ClientCallRow["outcome"]>([
  "booking_completed",
  "information_provided",
  "change_or_cancellation",
]);

const voiceCostPerMinuteCents =
  demoCostRates.transcriptionPerMinuteCents +
  demoCostRates.languageModelPerMinuteCents +
  demoCostRates.speechSynthesisPerMinuteCents;

interface AdminMonitoringRows {
  calls: unknown;
  channels: unknown;
  conversations: unknown;
  now?: Date;
  salon: unknown;
}

export interface AdminMonitoringPageData {
  current: Overview;
  periodDays: number;
  previous: Overview;
  reportingDate: string;
  salon: Salon;
}

export interface LoadAdminMonitoringPageDataOptions {
  period: MonitoringPeriod;
  salonId?: string;
}

export class AdminMonitoringDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminMonitoringDataError";
  }
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T12:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function localDateInTimeZone(
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

function isInRange(
  timestamp: string,
  range: DateRange,
  timeZone: string,
): boolean {
  const date = localDateInTimeZone(timestamp, timeZone);
  return date >= range.from && date <= range.to;
}

function datesInRange(range: DateRange): string[] {
  const dates: string[] = [];

  for (
    let date = range.from;
    date <= range.to;
    date = shiftDate(date, 1)
  ) {
    dates.push(date);
  }

  return dates;
}

function deterministicMetricId(
  salonId: string,
  date: string,
): string {
  const characters = createHash("sha256")
    .update(`${salonId}:${date}`)
    .digest("hex")
    .slice(0, 32)
    .split("");

  characters[12] = "4";
  characters[16] = "8";

  const value = characters.join("");

  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20, 32),
  ].join("-");
}

function emptyMetric(
  salonId: string,
  date: string,
): DailyMetric {
  const timestamp = `${date}T00:00:00.000Z`;

  return dailyMetricSchema.parse({
    bookingsAttributed: 0,
    callDurationSeconds: 0,
    callsCompleted: 0,
    callsReceived: 0,
    createdAt: timestamp,
    date,
    estimatedCostCents: 0,
    id: deterministicMetricId(salonId, date),
    integrationErrors: 0,
    interventionsCreated: 0,
    interventionsResolved: 0,
    salonId,
    updatedAt: timestamp,
    whatsappConversations: 0,
    whatsappMessagesInbound: 0,
    whatsappMessagesOutbound: 0,
  });
}

function mapSalon(row: ClientSalonRow): Salon {
  const address = postalAddressSchema.safeParse(row.address);

  return salonSchema.parse({
    createdAt: row.created_at,
    id: row.id,
    locale: row.locale,
    name: row.name,
    status: row.status,
    timezone: row.timezone,
    updatedAt: row.updated_at,
    ...(row.phone_number
      ? { phoneNumber: row.phone_number }
      : {}),
    ...(row.whatsapp_number
      ? { whatsappNumber: row.whatsapp_number }
      : {}),
    ...(address.success ? { address: address.data } : {}),
  });
}

function mapChannelStatus(
  row: ClientChannelStatusRow,
): ChannelStatus {
  return {
    channel: row.channel,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
    id: row.id,
    lastSuccessfulEventAt:
      row.last_successful_event_at ?? undefined,
    message: row.public_message ?? undefined,
    salonId: row.salon_id,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function assertOwnership(
  salonId: string,
  rows: readonly { salon_id: string }[],
  label: string,
): void {
  if (rows.some((row) => row.salon_id !== salonId)) {
    throw new AdminMonitoringDataError(
      `${label}: rilevata una riga appartenente a un altro salone.`,
    );
  }
}

function buildRecentErrors(
  salonId: string,
  range: DateRange,
  timeZone: string,
  calls: ClientCallRow[],
  channels: ClientChannelStatusRow[],
): IntegrationError[] {
  const providerByChannel: Record<
    ClientChannelStatusRow["channel"],
    IntegrationError["provider"]
  > = {
    booking_provider: "treatwell",
    vapi: "vapi",
    whatsapp: "whatsapp",
  };

  const channelErrors: IntegrationError[] = channels
    .filter((row) =>
      ["degraded", "offline"].includes(row.status),
    )
    .filter((row) =>
      isInRange(row.checked_at, range, timeZone),
    )
    .map((row) => ({
      attemptCount: 1,
      createdAt: row.checked_at,
      id: row.id,
      lastAttemptAt: row.checked_at,
      operation: "channel_health",
      provider: providerByChannel[row.channel],
      publicMessage:
        row.public_message ??
        "Il canale richiede una verifica operativa.",
      salonId,
      severity:
        row.status === "offline" ? "error" : "warning",
      status: "open",
      technicalCode: row.status,
      updatedAt: row.updated_at,
    }));

  const callErrors: IntegrationError[] = calls
    .filter(
      (row) =>
        row.processing_status === "failed" ||
        row.outcome === "technical_error",
    )
    .filter((row) =>
      isInRange(row.started_at, range, timeZone),
    )
    .map((row) => ({
      attemptCount: 1,
      createdAt: row.created_at,
      id: row.id,
      lastAttemptAt: row.updated_at,
      operation: "call_processing",
      provider: "vapi",
      publicMessage:
        row.summary ??
        "Una chiamata non è stata completata correttamente.",
      salonId,
      severity: "error",
      status: "open",
      technicalCode:
        row.processing_status === "failed"
          ? "processing_failed"
          : "technical_error",
      updatedAt: row.updated_at,
    }));

  return [...channelErrors, ...callErrors]
    .toSorted((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    )
    .slice(0, 10);
}

function buildOverview(
  salon: Salon,
  range: DateRange,
  calls: ClientCallRow[],
  conversations: ClientWhatsAppConversationRow[],
  channels: ClientChannelStatusRow[],
): Overview {
  const metrics = datesInRange(range).map((date) =>
    emptyMetric(salon.id, date),
  );
  const metricByDate = new Map(
    metrics.map((metric) => [metric.date, metric]),
  );

  for (const call of calls) {
    const date = localDateInTimeZone(
      call.started_at,
      salon.timezone,
    );
    const metric = metricByDate.get(date);

    if (!metric) {
      continue;
    }

    metric.callsReceived += 1;
    metric.callDurationSeconds +=
      call.duration_seconds ?? 0;

    if (completedOutcomes.has(call.outcome)) {
      metric.callsCompleted += 1;
    }

    if (call.outcome === "booking_completed") {
      metric.bookingsAttributed += 1;
    }

    if (
      call.processing_status === "failed" ||
      call.outcome === "technical_error"
    ) {
      metric.integrationErrors += 1;
    }
  }

  for (const conversation of conversations) {
    const date = localDateInTimeZone(
      conversation.created_at,
      salon.timezone,
    );
    const metric = metricByDate.get(date);

    if (!metric) {
      continue;
    }

    metric.whatsappConversations += 1;

    if (
      conversation.status === "needs_intervention" ||
      conversation.status === "human_control"
    ) {
      metric.interventionsCreated += 1;
    }
  }

  for (const channel of channels) {
    if (
      channel.status !== "degraded" &&
      channel.status !== "offline"
    ) {
      continue;
    }

    const date = localDateInTimeZone(
      channel.checked_at,
      salon.timezone,
    );
    const metric = metricByDate.get(date);

    if (metric) {
      metric.integrationErrors += 1;
    }
  }

  for (const metric of metrics) {
    metric.estimatedCostCents = Math.round(
      (metric.callDurationSeconds / 60) *
        voiceCostPerMinuteCents,
    );
  }

  const callsReceived = metrics.reduce(
    (total, metric) => total + metric.callsReceived,
    0,
  );
  const bookingsAttributed = metrics.reduce(
    (total, metric) =>
      total + metric.bookingsAttributed,
    0,
  );
  const estimatedCostCents = metrics.reduce(
    (total, metric) =>
      total + metric.estimatedCostCents,
    0,
  );
  const interventionsCreated = metrics.reduce(
    (total, metric) =>
      total + metric.interventionsCreated,
    0,
  );
  const interventionsResolved = metrics.reduce(
    (total, metric) =>
      total + metric.interventionsResolved,
    0,
  );

  return {
    bookingsAttributed,
    callsReceived,
    channels: channels.map(mapChannelStatus),
    estimatedCostCents,
    estimatedMonthlyCostCents:
      metrics.length === 0
        ? 0
        : Math.round(
            (estimatedCostCents / metrics.length) * 30,
          ),
    metrics,
    openInterventions: Math.max(
      0,
      interventionsCreated - interventionsResolved,
    ),
    range,
    recentActivities: [],
    recentCalls: [],
    recentErrors: buildRecentErrors(
      salon.id,
      range,
      salon.timezone,
      calls,
      channels,
    ),
    salonId: salon.id,
    urgentInterventions: [],
  };
}

export function buildAdminMonitoringPageData(
  expectedSalonId: string,
  period: MonitoringPeriod,
  rows: AdminMonitoringRows,
): AdminMonitoringPageData {
  const salonRow = clientSalonRowSchema.parse(rows.salon);
  const calls = callRowsSchema.parse(rows.calls);
  const channels = channelRowsSchema.parse(rows.channels);
  const conversations = conversationRowsSchema.parse(
    rows.conversations,
  );

  if (salonRow.id !== expectedSalonId) {
    throw new AdminMonitoringDataError(
      "Il repository ha restituito un salone diverso da quello richiesto.",
    );
  }

  assertOwnership(expectedSalonId, calls, "Chiamate");
  assertOwnership(expectedSalonId, channels, "Canali");
  assertOwnership(
    expectedSalonId,
    conversations,
    "Conversazioni",
  );

  const salon = mapSalon(salonRow);
  const reportingDate = localDateInTimeZone(
    rows.now ?? new Date(),
    salon.timezone,
  );
  const ranges = resolveMonitoringRanges(
    reportingDate,
    period,
  );

  return {
    current: buildOverview(
      salon,
      ranges.current,
      calls,
      conversations,
      channels,
    ),
    periodDays: ranges.days,
    previous: buildOverview(
      salon,
      ranges.previous,
      calls,
      conversations,
      channels,
    ),
    reportingDate,
    salon,
  };
}

function resolveRequestedSalonId(
  value: string | undefined,
): string | undefined {
  const candidate =
    value?.trim() ||
    process.env.BETTERCALLQ_ADMIN_DEFAULT_SALON_ID?.trim();

  if (!candidate) {
    return undefined;
  }

  const parsed = optionalSalonIdSchema.safeParse(candidate);

  if (!parsed.success) {
    throw new AdminMonitoringDataError(
      "BETTERCALLQ_ADMIN_DEFAULT_SALON_ID non è un UUID valido.",
    );
  }

  return parsed.data;
}

export async function loadAdminMonitoringPageData({
  period,
  salonId,
}: LoadAdminMonitoringPageDataOptions): Promise<AdminMonitoringPageData> {
  const supabase = await createClient();
  const requestedSalonId = resolveRequestedSalonId(salonId);
  const salonSelect =
    "id,name,timezone,locale,phone_number,whatsapp_number,address,status,created_at,updated_at";

  const salonResponse = requestedSalonId
    ? await supabase
        .from("client_salons")
        .select(salonSelect)
        .eq("id", requestedSalonId)
        .in("status", ["trial", "active"])
        .maybeSingle()
    : await supabase
        .from("client_salons")
        .select(salonSelect)
        .in("status", ["trial", "active"])
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

  if (salonResponse.error || !salonResponse.data) {
    throw new AdminMonitoringDataError(
      "Nessun salone accessibile per il monitoraggio amministrativo.",
    );
  }

  const salon = clientSalonRowSchema.parse(
    salonResponse.data,
  );
  const reportingDate = localDateInTimeZone(
    new Date(),
    salon.timezone,
  );
  const ranges = resolveMonitoringRanges(
    reportingDate,
    period,
  );
  const queryFrom = shiftDate(
    ranges.previous.from,
    -1,
  );
  const queryTo = shiftDate(
    ranges.current.to,
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
      .eq("salon_id", salon.id)
      .gte(
        "started_at",
        `${queryFrom}T00:00:00.000Z`,
      )
      .lt(
        "started_at",
        `${queryTo}T00:00:00.000Z`,
      )
      .order("started_at", { ascending: false }),
    supabase
      .from("client_whatsapp_conversations")
      .select(
        "id,salon_id,customer_phone,customer_name,status,control,summary,last_message_at,created_at,updated_at",
      )
      .eq("salon_id", salon.id)
      .gte(
        "created_at",
        `${queryFrom}T00:00:00.000Z`,
      )
      .lt(
        "created_at",
        `${queryTo}T00:00:00.000Z`,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("client_channel_statuses")
      .select(
        "id,salon_id,channel,status,checked_at,last_successful_event_at,public_message,created_at,updated_at",
      )
      .eq("salon_id", salon.id),
  ]);

  if (callsResponse.error) {
    throw new AdminMonitoringDataError(
      "Impossibile caricare le chiamate amministrative.",
    );
  }

  if (conversationsResponse.error) {
    throw new AdminMonitoringDataError(
      "Impossibile caricare le conversazioni amministrative.",
    );
  }

  if (channelsResponse.error) {
    throw new AdminMonitoringDataError(
      "Impossibile caricare lo stato dei canali.",
    );
  }

  return buildAdminMonitoringPageData(
    salon.id,
    period,
    {
      calls: callsResponse.data ?? [],
      channels: channelsResponse.data ?? [],
      conversations:
        conversationsResponse.data ?? [],
      salon,
    },
  );
}
