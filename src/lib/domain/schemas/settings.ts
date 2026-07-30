import { z } from "zod";

import {
  entityBaseSchema,
  entityIdSchema,
  phoneNumberSchema,
} from "./common";
import { interventionReasonSchema } from "./intervention";

const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Inserisci un orario valido nel formato HH:MM.",
  );

export const openingIntervalSchema = z
  .object({
    opensAt: timeSchema,
    closesAt: timeSchema,
  })
  .refine((interval) => interval.opensAt < interval.closesAt, {
    message: "L’orario di chiusura deve essere successivo all’apertura.",
    path: ["closesAt"],
  });

export const dayScheduleSchema = z
  .array(openingIntervalSchema)
  .max(4, "Puoi configurare al massimo quattro fasce nello stesso giorno.")
  .superRefine((intervals, context) => {
    const ordered = intervals
      .map((interval, index) => ({ ...interval, index }))
      .toSorted((left, right) => left.opensAt.localeCompare(right.opensAt));

    for (let index = 1; index < ordered.length; index += 1) {
      if (ordered[index].opensAt < ordered[index - 1].closesAt) {
        context.addIssue({
          code: "custom",
          message: "Le fasce orarie dello stesso giorno non possono sovrapporsi.",
          path: [ordered[index].index, "opensAt"],
        });
      }
    }
  });

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
  externalServiceId: z.string().trim().min(1).optional(),
  name: z
    .string()
    .trim()
    .min(2, "Inserisci il nome del servizio.")
    .max(80, "Il nome del servizio è troppo lungo."),
  aliases: z
    .array(z.string().trim().min(1))
    .max(12, "Puoi inserire al massimo dodici nomi alternativi."),
  description: z.string().trim().min(1).max(500).optional(),
  durationMinutes: z
    .number()
    .int("La durata deve essere espressa in minuti interi.")
    .min(5, "La durata minima è di 5 minuti.")
    .max(720, "La durata massima è di 12 ore.")
    .optional(),
  priceCents: z
    .number()
    .int()
    .min(0, "Il prezzo non può essere negativo.")
    .max(1_000_000, "Il prezzo inserito è troppo alto.")
    .optional(),
  enabled: z.boolean(),
  operatorIds: z.array(entityIdSchema).optional(),
});

const serviceListSchema = z
  .array(serviceConfigSchema)
  .max(50, "Puoi configurare al massimo cinquanta servizi.")
  .superRefine((services, context) => {
    const names = new Map<string, number>();

    services.forEach((service, index) => {
      const normalizedName = service.name.trim().toLocaleLowerCase("it");
      const duplicateIndex = names.get(normalizedName);

      if (duplicateIndex !== undefined) {
        context.addIssue({
          code: "custom",
          message: "Ogni servizio deve avere un nome diverso.",
          path: [index, "name"],
        });
      } else {
        names.set(normalizedName, index);
      }
    });
  });

export const faqEntrySchema = z.object({
  id: entityIdSchema,
  question: z
    .string()
    .trim()
    .min(5, "Scrivi una domanda di almeno 5 caratteri.")
    .max(240, "La domanda è troppo lunga."),
  answer: z
    .string()
    .trim()
    .min(5, "Scrivi una risposta di almeno 5 caratteri.")
    .max(1_500, "La risposta è troppo lunga."),
  enabled: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
});

export const specialClosureSchema = z
  .object({
    id: entityIdSchema,
    startsOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Inserisci una data di inizio valida."),
    endsOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Inserisci una data di fine valida."),
    reason: z
      .string()
      .trim()
      .min(2, "Indica il motivo della chiusura.")
      .max(160, "Il motivo della chiusura è troppo lungo."),
  })
  .refine((closure) => closure.startsOn <= closure.endsOn, {
    message: "La data finale non può precedere quella iniziale.",
    path: ["endsOn"],
  });

export const salonProfileSettingsSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Descrivi il salone con almeno 10 caratteri.")
    .max(1_000, "La descrizione è troppo lunga."),
  parkingInfo: z.string().trim().min(2).max(500).optional(),
  paymentMethods: z
    .array(z.string().trim().min(1))
    .min(1, "Indica almeno un metodo di pagamento.")
    .max(10, "Puoi inserire al massimo dieci metodi di pagamento."),
});

export const policySettingsSchema = z.object({
  cancellationNoticeHours: z
    .number()
    .int()
    .min(0, "Il preavviso non può essere negativo.")
    .max(720, "Il preavviso massimo è di 30 giorni.")
    .optional(),
  lateArrivalMinutes: z
    .number()
    .int()
    .min(0, "La tolleranza non può essere negativa.")
    .max(240, "La tolleranza massima è di 4 ore.")
    .optional(),
  notes: z.string().trim().min(2).max(1_000).optional(),
});

export const escalationSettingsSchema = z.object({
  transferPhone: phoneNumberSchema.optional(),
  transferDuringOpeningHoursOnly: z.boolean(),
  reasons: z
    .array(interventionReasonSchema)
    .min(1, "Seleziona almeno una condizione di intervento.")
    .max(interventionReasonSchema.options.length),
});

export const voiceAndToneSettingsSchema = z.object({
  tone: z.enum(["warm", "professional", "friendly", "concise"]),
  useCustomerName: z.boolean(),
  notes: z.string().trim().min(2).max(800).optional(),
});

export const bookingRulesSchema = z.object({
  minimumNoticeMinutes: z
    .number()
    .int()
    .min(0, "L’anticipo minimo non può essere negativo.")
    .max(43_200, "L’anticipo minimo non può superare 30 giorni.")
    .optional(),
  maximumAdvanceDays: z
    .number()
    .int()
    .min(1, "Inserisci almeno un giorno.")
    .max(730, "Il limite massimo è di due anni.")
    .optional(),
  preparationMinutes: z
    .number()
    .int()
    .min(0, "Il tempo di preparazione non può essere negativo.")
    .max(240, "Il tempo di preparazione massimo è di 4 ore.")
    .optional(),
  allowAiCancellation: z.boolean(),
  allowAiReschedule: z.boolean(),
});

export const receptionistSettingsContentSchema = z.object({
  salonProfile: salonProfileSettingsSchema,
  openingHours: weeklyOpeningHoursSchema,
  closures: z
    .array(specialClosureSchema)
    .max(50, "Puoi configurare al massimo cinquanta chiusure."),
  services: serviceListSchema,
  faqs: z
    .array(faqEntrySchema)
    .max(100, "Puoi configurare al massimo cento domande frequenti."),
  policies: policySettingsSchema,
  escalation: escalationSettingsSchema,
  voiceAndTone: voiceAndToneSettingsSchema,
  bookingRules: bookingRulesSchema,
});

export const updateReceptionistSettingsInputSchema =
  receptionistSettingsContentSchema;

export const receptionistSettingsSchema = entityBaseSchema.extend({
  version: z.number().int().positive(),
  ...receptionistSettingsContentSchema.shape,
  publishedAt: z.string().datetime({ offset: true }).optional(),
  publishedByUserId: entityIdSchema.optional(),
});

export type OpeningInterval = z.infer<typeof openingIntervalSchema>;
export type WeeklyOpeningHours = z.infer<typeof weeklyOpeningHoursSchema>;
export type ServiceConfig = z.infer<typeof serviceConfigSchema>;
export type FaqEntry = z.infer<typeof faqEntrySchema>;
export type SpecialClosure = z.infer<typeof specialClosureSchema>;
export type ReceptionistSettings = z.infer<
  typeof receptionistSettingsSchema
>;
export type UpdateReceptionistSettingsInput = z.infer<
  typeof updateReceptionistSettingsInputSchema
>;
