import { z } from "zod";

import {
  entityBaseSchema,
  entityIdSchema,
  isoDateTimeSchema,
  phoneNumberSchema,
} from "./common";

export const interventionPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);
export const interventionStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "dismissed",
]);
export const interventionSourceSchema = z.enum([
  "call",
  "whatsapp",
  "booking",
  "integration",
]);
export const interventionReasonSchema = z.enum([
  "human_requested",
  "service_not_recognized",
  "availability_unavailable",
  "booking_incomplete",
  "special_request",
  "booking_sync_failed",
  "customer_dispute",
  "integration_error",
  "other",
]);

export const interventionSchema = entityBaseSchema.extend({
  source: interventionSourceSchema,
  reason: interventionReasonSchema,
  priority: interventionPrioritySchema,
  status: interventionStatusSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  customerName: z.string().min(1).optional(),
  customerPhone: phoneNumberSchema.optional(),
  callId: entityIdSchema.optional(),
  conversationId: entityIdSchema.optional(),
  bookingReferenceId: entityIdSchema.optional(),
  resolvedAt: isoDateTimeSchema.optional(),
  resolvedByUserId: entityIdSchema.optional(),
  resolutionNote: z.string().min(1).optional(),
});

export type InterventionPriority = z.infer<
  typeof interventionPrioritySchema
>;
export type InterventionStatus = z.infer<typeof interventionStatusSchema>;
export type InterventionSource = z.infer<typeof interventionSourceSchema>;
export type InterventionReason = z.infer<typeof interventionReasonSchema>;
export type Intervention = z.infer<typeof interventionSchema>;
