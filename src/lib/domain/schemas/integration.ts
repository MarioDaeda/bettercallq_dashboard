import { z } from "zod";

import { entityBaseSchema, isoDateTimeSchema } from "./common";

export const bookingProviderCapabilitiesSchema = z.object({
  readAvailability: z.boolean(),
  createBooking: z.boolean(),
  updateBooking: z.boolean(),
  cancelBooking: z.boolean(),
});

export const channelKindSchema = z.enum([
  "vapi",
  "whatsapp",
  "booking_provider",
]);
export const healthStatusSchema = z.enum([
  "operational",
  "degraded",
  "offline",
  "not_configured",
]);

export const channelStatusSchema = entityBaseSchema.extend({
  channel: channelKindSchema,
  status: healthStatusSchema,
  checkedAt: isoDateTimeSchema,
  lastSuccessfulEventAt: isoDateTimeSchema.optional(),
  message: z.string().min(1).optional(),
  capability: bookingProviderCapabilitiesSchema.optional(),
});

export const integrationErrorSchema = entityBaseSchema.extend({
  provider: z.enum([
    "vapi",
    "whatsapp",
    "treatwell",
    "google_calendar",
    "internal",
  ]),
  operation: z.string().min(1),
  severity: z.enum(["info", "warning", "error", "critical"]),
  status: z.enum(["open", "retrying", "resolved", "ignored"]),
  publicMessage: z.string().min(1),
  technicalCode: z.string().min(1).optional(),
  correlationId: z.string().min(1).optional(),
  externalEventId: z.string().min(1).optional(),
  attemptCount: z.number().int().nonnegative(),
  lastAttemptAt: isoDateTimeSchema.optional(),
  resolvedAt: isoDateTimeSchema.optional(),
});

export type BookingProviderCapabilities = z.infer<
  typeof bookingProviderCapabilitiesSchema
>;
export type ChannelKind = z.infer<typeof channelKindSchema>;
export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type ChannelStatus = z.infer<typeof channelStatusSchema>;
export type IntegrationError = z.infer<typeof integrationErrorSchema>;
