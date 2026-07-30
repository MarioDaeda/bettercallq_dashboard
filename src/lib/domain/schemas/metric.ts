import { z } from "zod";

import { entityBaseSchema, localDateSchema } from "./common";

export const dailyMetricSchema = entityBaseSchema.extend({
  date: localDateSchema,
  callsReceived: z.number().int().nonnegative(),
  callsCompleted: z.number().int().nonnegative(),
  callDurationSeconds: z.number().int().nonnegative(),
  whatsappConversations: z.number().int().nonnegative(),
  whatsappMessagesInbound: z.number().int().nonnegative(),
  whatsappMessagesOutbound: z.number().int().nonnegative(),
  bookingsAttributed: z.number().int().nonnegative(),
  interventionsCreated: z.number().int().nonnegative(),
  interventionsResolved: z.number().int().nonnegative(),
  integrationErrors: z.number().int().nonnegative(),
  estimatedCostCents: z.number().int().nonnegative(),
});

export type DailyMetric = z.infer<typeof dailyMetricSchema>;
