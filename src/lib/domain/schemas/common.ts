import { z } from "zod";

export const entityIdSchema = z.string().uuid();
export const salonIdSchema = entityIdSchema;
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const phoneNumberSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Usa il formato internazionale, ad esempio +390000000000");

export const entityBaseSchema = z.object({
  id: entityIdSchema,
  salonId: salonIdSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type EntityBase = z.infer<typeof entityBaseSchema>;
