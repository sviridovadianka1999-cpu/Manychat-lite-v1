import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const flowName = "NSK Comment Funnel";
const flowDescription = "Seed flow for comment trigger";

export const demoFlowDefinition = {
  trigger: { type: "instagram_comment_contains_keyword", config: { keywords: ["НСК", "Новосибирск"], matchMode: "contains", caseInsensitive: true } },
  nodes: [
    { id: "trigger", type: "trigger" },
    { id: "a1", type: "action", config: { type: "send_comment_reply", text: "Отправил в директ" } },
    { id: "a2", type: "action", config: { type: "add_tag", tag: "nsk_interest" } },
    { id: "a3", type: "action", config: { type: "send_dm", text: "Собрал подборку тусовок в Новосибирске. Что тебе ближе?" } },
    { id: "a4", type: "action", config: { type: "set_custom_field", field_key: "last_interest_source", field_value: "nsk_comment" } },
    { id: "end", type: "end" }
  ],
  edges: [
    { from: "trigger", to: "a1" },
    { from: "a1", to: "a2" },
    { from: "a2", to: "a3" },
    { from: "a3", to: "a4" },
    { from: "a4", to: "end" }
  ]
};

export async function seedDemoFlow(pool: Pick<Pool, "query">) {
  const updated = await pool.query(
    `UPDATE flows
        SET description = $2,
            is_enabled = true,
            definition_json = $3,
            updated_at = now()
      WHERE name = $1`,
    [flowName, flowDescription, JSON.stringify(demoFlowDefinition)]
  );

  if (updated.rowCount && updated.rowCount > 0) return "updated";

  await pool.query(
    `INSERT INTO flows (name, description, is_enabled, definition_json)
     VALUES ($1, $2, true, $3)`,
    [flowName, flowDescription, JSON.stringify(demoFlowDefinition)]
  );

  return "inserted";
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await seedDemoFlow(pool);
    console.log(`Seed ${result}`);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
