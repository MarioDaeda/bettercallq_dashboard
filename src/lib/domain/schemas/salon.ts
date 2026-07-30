import { z } from "zod";

import {
  entityIdSchema,
  isoDateTimeSchema,
  phoneNumberSchema,
} from "./common";

export const postalAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  province: z.string().length(2),
  country: z.literal("IT"),
});

export const salonSchema = z.object({
  id: entityIdSchema,
  name: z.string().min(1),
  timezone: z.string().min(1),
  locale: z.literal("it-IT"),
  phoneNumber: phoneNumberSchema.optional(),
  whatsappNumber: phoneNumberSchema.optional(),
  address: postalAddressSchema.optional(),
  status: z.enum(["trial", "active", "suspended"]),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type PostalAddress = z.infer<typeof postalAddressSchema>;
export type Salon = z.infer<typeof salonSchema>;
