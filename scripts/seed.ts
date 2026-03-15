import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const flow = {
  trigger: { type: "instagram_comment_contains_keyword", config: { keyword: "НСК" } },
  nodes: [
    { id: "trigger", type: "trigger" },
    { id: "a1", type: "action", config: { type: "send_private_reply", text: "Отправил в директ" } },
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

await pool.query(`INSERT INTO flows (name,description,is_enabled,definition_json)
  VALUES ('NSK Comment Funnel','Seed flow for comment trigger',true,$1)
  ON CONFLICT DO NOTHING`, [JSON.stringify(flow)]);

await pool.end();
console.log("Seeded");
