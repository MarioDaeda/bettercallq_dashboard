import { z } from "zod";

import {
  entityBaseSchema,
  isoDateTimeSchema,
  phoneNumberSchema,
} from "./common";

export const bookingProviderNameSchema = z.enum([
  "treatwell",
  "google_calendar",
  "manual",
  "unknown",
]);
export const bookingSyncStatusSchema = z.enum([
  "pending",
  "synced",
  "failed",
  "cancelled",
]);

export const bookingReferenceSchema = entityBaseSchema.extend({
  provider: bookingProviderNameSchema,
  externalBookingId: z.string().min(1).optional(),
  externalUrl: z.string().url().optional(),
  syncStatus: bookingSyncStatusSchema,
  customerName: z.string().min(1).optional(),
  customerPhone: phoneNumberSchema.optional(),
  serviceName: z.string().min(1).optional(),
  operatorName: z.string().min(1).optional(),
  startsAt: isoDateTimeSchema.optional(),
  endsAt: isoDateTimeSchema.optional(),
  lastSyncedAt: isoDateTimeSchema.optional(),
});

export type BookingProviderName = z.infer<
  typeof bookingProviderNameSchema
>;
export type BookingSyncStatus = z.infer<typeof bookingSyncStatusSchema>;
export type BookingReference = z.infer<typeof bookingReferenceSchema>;
