import { z } from "zod";

import { entityBaseSchema, localDateSchema } from "./common";

const usdMicrosSchema = z.number().int().nonnegative().default(0);

export const dailyMetricSchema = entityBaseSchema.extend({
  date: localDateSchema,
  callsReceived: z.number().int().nonnegative(),
  callsCompleted: z.number().int().nonnegative(),
  callsWithCostData: z.number().int().nonnegative().default(0),
  callDurationSeconds: z.number().int().nonnegative(),
  whatsappConversations: z.number().int().nonnegative(),
  whatsappMessagesInbound: z.number().int().nonnegative(),
  whatsappMessagesOutbound: z.number().int().nonnegative(),
  bookingsAttributed: z.number().int().nonnegative(),
  interventionsCreated: z.number().int().nonnegative(),
  interventionsResolved: z.number().int().nonnegative(),
  integrationErrors: z.number().int().nonnegative(),
  costTotalUsdMicros: usdMicrosSchema,
  costSttUsdMicros: usdMicrosSchema,
  costLlmUsdMicros: usdMicrosSchema,
  costTtsUsdMicros: usdMicrosSchema,
  costVapiUsdMicros: usdMicrosSchema,
  costTransportUsdMicros: usdMicrosSchema,
  costChatUsdMicros: usdMicrosSchema,
  costKnowledgeBaseUsdMicros: usdMicrosSchema,
});

export type DailyMetric = z.infer<typeof dailyMetricSchema>;
