import { z } from "zod";

import {
  entityBaseSchema,
  entityIdSchema,
  phoneNumberSchema,
} from "./common";
import { interventionReasonSchema } from "./intervention";

const openingIntervalSchema = z.object({
  opensAt: z.string().regex(/^\d{2}:\d{2}$/),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/),
});

const dayScheduleSchema = z.array(openingIntervalSchema);

export const weeklyOpeningHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
});

export const serviceConfigSchema = z.object({
  id: entityIdSchema,
  externalServiceId: z.string().min(1).optional(),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  description: z.string().min(1).optional(),
  durationMinutes: z.number().int().positive().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  enabled: z.boolean(),
  operatorIds: z.array(entityIdSchema).optional(),
});

export const receptionistSettingsSchema = entityBaseSchema.extend({
  version: z.number().int().positive(),
  salonProfile: z.object({
    description: z.string().min(1),
    parkingInfo: z.string().min(1).optional(),
    paymentMethods: z.array(z.string().min(1)),
  }),
  openingHours: weeklyOpeningHoursSchema,
  closures: z.array(
    z.object({
      id: entityIdSchema,
      startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reason: z.string().min(1),
    }),
  ),
  services: z.array(serviceConfigSchema),
  faqs: z.array(
    z.object({
      id: entityIdSchema,
      question: z.string().min(1),
      answer: z.string().min(1),
      enabled: z.boolean(),
      sortOrder: z.number().int().nonnegative(),
    }),
  ),
  policies: z.object({
    cancellationNoticeHours: z.number().int().nonnegative().optional(),
    lateArrivalMinutes: z.number().int().nonnegative().optional(),
    notes: z.string().min(1).optional(),
  }),
  escalation: z.object({
    transferPhone: phoneNumberSchema.optional(),
    transferDuringOpeningHoursOnly: z.boolean(),
    reasons: z.array(interventionReasonSchema),
  }),
  voiceAndTone: z.object({
    tone: z.enum(["warm", "professional", "friendly", "concise"]),
    useCustomerName: z.boolean(),
    notes: z.string().min(1).optional(),
  }),
  bookingRules: z.object({
    minimumNoticeMinutes: z.number().int().nonnegative().optional(),
    maximumAdvanceDays: z.number().int().positive().optional(),
    preparationMinutes: z.number().int().nonnegative().optional(),
    allowAiCancellation: z.boolean(),
    allowAiReschedule: z.boolean(),
  }),
  publishedAt: z.string().datetime({ offset: true }).optional(),
  publishedByUserId: entityIdSchema.optional(),
});

export type WeeklyOpeningHours = z.infer<typeof weeklyOpeningHoursSchema>;
export type ServiceConfig = z.infer<typeof serviceConfigSchema>;
export type ReceptionistSettings = z.infer<
  typeof receptionistSettingsSchema
>;
