import { Pool } from "pg";
import { env } from "@/src/config/env";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export async function query<T = unknown>(text: string, values?: unknown[]) {
  return pool.query<T>(text, values);
}
