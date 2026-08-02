import { z } from "zod";

const uuidSchema = z.string().uuid();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dateTimeSchema = z.string().datetime({ offset: true });
const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/);

export const clientSalonRowSchema = z
  .object({
    id: uuidSchema,
    name: z.string().trim().min(1),
    timezone: z.string().min(1),
    locale: z.string().min(1),
    phone_number: phoneSchema.nullable(),
    whatsapp_number: phoneSchema.nullable(),
    address: z.record(z.string(), z.unknown()),
    status: z.enum(["trial", "active", "suspended"]),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
  })
  .strict();

export const clientUsagePeriodRowSchema = z
  .object({
    id: uuidSchema,
    salon_id: uuidSchema,
    subscription_id: uuidSchema,
    period_start: dateSchema,
    period_end: dateSchema,
    included_voice_minutes: z.number().int().positive(),
    used_voice_seconds: z.number().int().nonnegative(),
    remaining_voice_seconds: z.number().int().nonnegative(),
    extra_voice_seconds: z.number().int().nonnegative(),
    calculated_at: dateTimeSchema,
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
  })
  .strict();

export const clientCallRowSchema = z
  .object({
    id: uuidSchema,
    salon_id: uuidSchema,
    customer_phone: phoneSchema.nullable(),
    customer_name: z.string().nullable(),
    started_at: dateTimeSchema,
    ended_at: dateTimeSchema.nullable(),
    duration_seconds: z.number().int().nonnegative().nullable(),
    cost_total_usd_micros: z.number().int().nonnegative().nullable().default(null),
    cost_stt_usd_micros: z.number().int().nonnegative().nullable().default(null),
    cost_llm_usd_micros: z.number().int().nonnegative().nullable().default(null),
    cost_tts_usd_micros: z.number().int().nonnegative().nullable().default(null),
    cost_vapi_usd_micros: z.number().int().nonnegative().nullable().default(null),
    cost_transport_usd_micros: z
      .number()
      .int()
      .nonnegative()
      .nullable()
      .default(null),
    cost_chat_usd_micros: z.number().int().nonnegative().nullable().default(null),
    cost_knowledge_base_usd_micros: z
      .number()
      .int()
      .nonnegative()
      .nullable()
      .default(null),
    outcome: z.enum([
      "booking_completed",
      "information_provided",
      "change_or_cancellation",
      "transferred",
      "incomplete",
      "technical_error",
      "abandoned",
    ]),
    summary: z.string().nullable(),
    requested_service: z.string().nullable(),
    processing_status: z.enum([
      "receiving",
      "processed",
      "failed",
    ]),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
  })
  .strict();

export const clientWhatsAppConversationRowSchema = z
  .object({
    id: uuidSchema,
    salon_id: uuidSchema,
    customer_phone: phoneSchema,
    customer_name: z.string().nullable(),
    status: z.enum([
      "ai_handled",
      "needs_intervention",
      "human_control",
      "waiting_customer",
      "completed",
    ]),
    control: z.enum(["ai", "human"]),
    summary: z.string().nullable(),
    last_message_at: dateTimeSchema.nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
  })
  .strict();

export const clientChannelStatusRowSchema = z
  .object({
    id: uuidSchema,
    salon_id: uuidSchema,
    channel: z.enum([
      "vapi",
      "whatsapp",
      "booking_provider",
    ]),
    status: z.enum([
      "operational",
      "degraded",
      "offline",
      "not_configured",
    ]),
    checked_at: dateTimeSchema,
    last_successful_event_at: dateTimeSchema.nullable(),
    public_message: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema,
  })
  .strict();

export type ClientSalonRow = z.infer<
  typeof clientSalonRowSchema
>;
export type ClientUsagePeriodRow = z.infer<
  typeof clientUsagePeriodRowSchema
>;
export type ClientCallRow = z.infer<
  typeof clientCallRowSchema
>;
export type ClientWhatsAppConversationRow = z.infer<
  typeof clientWhatsAppConversationRowSchema
>;
export type ClientChannelStatusRow = z.infer<
  typeof clientChannelStatusRowSchema
>;
