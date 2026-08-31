import { z } from "zod";

const uuidSchema = z.string().uuid();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dateTimeSchema = z.string().datetime({ offset: true });
const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/);

export const platformRoleSchema = z.enum(["admin", "standard"]);
export const salonStatusSchema = z.enum(["trial", "active", "suspended"]);
export const membershipRoleSchema = z.enum([
  "owner",
  "manager",
  "viewer",
  "support",
]);
export const membershipStatusSchema = z.enum([
  "invited",
  "active",
  "disabled",
]);

export const profileRowSchema = z.object({
  user_id: uuidSchema,
  display_name: z.string().trim().min(1).max(120),
  platform_role: platformRoleSchema,
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema,
});

export const salonRowSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1).max(160),
  slug: z.string().nullable(),
  timezone: z.string().min(1),
  locale: z.string().min(1),
  phone_number: phoneSchema.nullable(),
  whatsapp_number: phoneSchema.nullable(),
  address: z.record(z.string(), z.unknown()),
  status: salonStatusSchema,
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema,
});

export const salonMembershipRowSchema = z.object({
  id: uuidSchema,
  salon_id: uuidSchema,
  user_id: uuidSchema,
  role: membershipRoleSchema,
  status: membershipStatusSchema,
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema,
});

export const subscriptionPlanRowSchema = z.object({
  id: uuidSchema,
  code: z.string().min(1),
  name: z.string().trim().min(1),
  included_voice_minutes: z.number().int().positive(),
  extra_minute_price_cents: z.number().int().nonnegative().nullable(),
  billing_cycle_type: z.literal("calendar_month"),
  active: z.boolean(),
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema,
});

export const usagePeriodRowSchema = z.object({
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
});

export const persistedCallRowSchema = z.object({
  id: uuidSchema,
  salon_id: uuidSchema,
  provider: z.literal("vapi"),
  external_call_id: z.string().min(1),
  customer_phone: phoneSchema.nullable(),
  customer_name: z.string().nullable(),
  started_at: dateTimeSchema,
  ended_at: dateTimeSchema.nullable(),
  duration_seconds: z.number().int().nonnegative().nullable(),
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
  booking_reference_id: uuidSchema.nullable(),
  transcript: z.array(z.unknown()).nullable(),
  recording_url: z.string().nullable(),
  processing_status: z.enum(["receiving", "processed", "failed"]),
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema,
});

export const persistedConversationRowSchema = z.object({
  id: uuidSchema,
  salon_id: uuidSchema,
  external_conversation_key: z.string().min(1),
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
  booking_reference_id: uuidSchema.nullable(),
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema,
});

export const treatwellBookingRowSchema = z.object({
  id: uuidSchema,
  salon_id: uuidSchema,
  customer_name: z.string().trim().min(1),
  customer_phone: phoneSchema.nullable(),
  service_code: z.string().min(1),
  service_name: z.string().trim().min(1),
  duration_minutes: z.number().int().positive(),
  starts_at: dateTimeSchema,
  ends_at: dateTimeSchema,
  status: z.enum(["confirmed", "cancelled"]),
  treatwell_status: z.enum([
    "to_sync",
    "update_required",
    "cancellation_required",
  ]),
  google_calendar_event_id: z.string().nullable(),
  channel: z.enum(["vapi", "api", "dashboard"]),
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema,
});

export type ProfileRow = z.infer<typeof profileRowSchema>;
export type SalonRow = z.infer<typeof salonRowSchema>;
export type SalonMembershipRow = z.infer<
  typeof salonMembershipRowSchema
>;
export type SubscriptionPlanRow = z.infer<
  typeof subscriptionPlanRowSchema
>;
export type UsagePeriodRow = z.infer<typeof usagePeriodRowSchema>;
export type PersistedCallRow = z.infer<typeof persistedCallRowSchema>;
export type PersistedConversationRow = z.infer<
  typeof persistedConversationRowSchema
>;
export type TreatwellBookingRow = z.infer<
  typeof treatwellBookingRowSchema
>;
