import { z } from "zod";

const messagingSchema = z.object({
  sender: z.object({ id: z.string().optional() }).optional(),
  message: z.object({ mid: z.string().optional(), text: z.string().optional() }).optional(),
  postback: z.any().optional(),
  comment_id: z.string().optional(),
  text: z.string().optional()
});

const entrySchema = z.object({
  id: z.string().optional(),
  messaging: z.array(messagingSchema).optional(),
  changes: z.array(z.object({ field: z.string(), value: z.record(z.any()) })).optional()
});

export const webhookPayloadSchema = z.object({
  object: z.string().optional(),
  entry: z.array(entrySchema).default([])
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
