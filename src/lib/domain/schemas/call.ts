import { z } from "zod";

import {
  entityBaseSchema,
  entityIdSchema,
  isoDateTimeSchema,
  phoneNumberSchema,
} from "./common";

export const callOutcomeSchema = z.enum([
  "booking_completed",
  "information_provided",
  "change_or_cancellation",
  "transferred",
  "incomplete",
  "technical_error",
  "abandoned",
]);

export const transcriptSegmentSchema = z.object({
  speaker: z.enum(["customer", "assistant", "system"]),
  text: z.string().min(1),
  startedAtSeconds: z.number().nonnegative(),
});

export const callSchema = entityBaseSchema.extend({
  provider: z.literal("vapi"),
  externalCallId: z.string().min(1),
  customerPhone: phoneNumberSchema.optional(),
  customerName: z.string().min(1).optional(),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema.optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  outcome: callOutcomeSchema,
  summary: z.string().min(1).optional(),
  requestedService: z.string().min(1).optional(),
  bookingReferenceId: entityIdSchema.optional(),
  transcript: z.array(transcriptSegmentSchema).optional(),
  recordingUrl: z.string().url().optional(),
  processingStatus: z.enum(["receiving", "processed", "failed"]),
});

export type CallOutcome = z.infer<typeof callOutcomeSchema>;
export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;
export type Call = z.infer<typeof callSchema>;
