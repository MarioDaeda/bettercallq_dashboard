import { z } from "zod";

const uuidSchema = z.string().uuid();
const eventIdSchema = z.string().trim().min(1).max(240);
const providerIdSchema = z.string().trim().min(1).max(240);
const dateTimeSchema = z.string().datetime({ offset: true });
const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/)
  .nullable();

export const vapiCallIngestionSchema = z
  .object({
    customerName: z.string().trim().min(1).max(160).nullable(),
    customerPhone: phoneSchema,
    durationSeconds: z.number().int().nonnegative().nullable(),
    endedAt: dateTimeSchema.nullable(),
    externalCallId: providerIdSchema,
    externalEventId: eventIdSchema,
    outcome: z.enum([
      "booking_completed",
      "information_provided",
      "change_or_cancellation",
      "transferred",
      "incomplete",
      "technical_error",
      "abandoned",
    ]),
    processingStatus: z.enum([
      "receiving",
      "processed",
      "failed",
    ]),
    requestedService: z.string().trim().min(1).max(240).nullable(),
    salonId: uuidSchema,
    startedAt: dateTimeSchema,
    summary: z.string().trim().min(1).max(2_000).nullable(),
  })
  .strict();

export const whatsappConversationIngestionSchema = z
  .object({
    control: z.enum(["ai", "human"]),
    customerName: z.string().trim().min(1).max(160).nullable(),
    customerPhone: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/),
    externalConversationKey: providerIdSchema,
    externalEventId: eventIdSchema,
    lastMessageAt: dateTimeSchema.nullable(),
    salonId: uuidSchema,
    status: z.enum([
      "ai_handled",
      "needs_intervention",
      "human_control",
      "waiting_customer",
      "completed",
    ]),
    summary: z.string().trim().min(1).max(2_000).nullable(),
  })
  .strict();

export const vapiIngestionResultSchema = z
  .object({
    callId: uuidSchema.nullable(),
    duplicateEvent: z.boolean(),
    usagePeriodId: uuidSchema.optional(),
  })
  .strict();

export const whatsappIngestionResultSchema = z
  .object({
    conversationId: uuidSchema.nullable(),
    duplicateEvent: z.boolean(),
  })
  .strict();

export type VapiCallIngestion = z.infer<
  typeof vapiCallIngestionSchema
>;

export type WhatsAppConversationIngestion = z.infer<
  typeof whatsappConversationIngestionSchema
>;

export type VapiIngestionResult = z.infer<
  typeof vapiIngestionResultSchema
>;

export type WhatsAppIngestionResult = z.infer<
  typeof whatsappIngestionResultSchema
>;
