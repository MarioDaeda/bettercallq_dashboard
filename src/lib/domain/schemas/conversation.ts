import { z } from "zod";

import {
  entityBaseSchema,
  entityIdSchema,
  isoDateTimeSchema,
  phoneNumberSchema,
} from "./common";

export const conversationControlSchema = z.enum(["ai", "human"]);
export const conversationStatusSchema = z.enum([
  "ai_handled",
  "needs_intervention",
  "human_control",
  "waiting_customer",
  "completed",
]);

export const conversationSchema = entityBaseSchema.extend({
  provider: z.literal("whatsapp"),
  externalConversationKey: z.string().min(1),
  customerPhone: phoneNumberSchema,
  customerName: z.string().min(1).optional(),
  status: conversationStatusSchema,
  control: conversationControlSchema,
  summary: z.string().min(1).optional(),
  lastMessageAt: isoDateTimeSchema.optional(),
  bookingReferenceId: entityIdSchema.optional(),
});

export const messageSchema = entityBaseSchema.extend({
  conversationId: entityIdSchema,
  externalMessageId: z.string().min(1).optional(),
  author: z.enum(["customer", "ai", "human", "system"]),
  direction: z.enum(["inbound", "outbound"]),
  body: z.string().min(1),
  status: z.enum([
    "received",
    "queued",
    "sent",
    "delivered",
    "read",
    "failed",
  ]),
  sentAt: isoDateTimeSchema,
  errorCode: z.string().min(1).optional(),
});

export type ConversationControl = z.infer<typeof conversationControlSchema>;
export type ConversationStatus = z.infer<typeof conversationStatusSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type Message = z.infer<typeof messageSchema>;
