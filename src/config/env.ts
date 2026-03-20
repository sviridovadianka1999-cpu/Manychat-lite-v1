import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  APP_BASE_URL: z.string().url(),
  PUBLIC_WEBHOOK_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  META_VERIFY_TOKEN: z.string().min(1),
  META_ACCESS_TOKEN: z.string().min(1),
  META_GRAPH_VERSION: z.string().default("v20.0"),
  META_APP_SECRET: z.string().optional(),
  AUTO_REPLY_FALLBACK_TEXT: z.string().default("Спасибо! Ответил в директ."),
  SCHEDULER_INTERVAL_MS: z.coerce.number().default(5000)
});

export const env = schema.parse(process.env);
