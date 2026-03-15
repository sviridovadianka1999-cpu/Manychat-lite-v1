import { query } from "@/src/db/client";

export default async function MessagesPage() {
  const rows = await query("SELECT * FROM outgoing_messages ORDER BY created_at DESC LIMIT 100");
  return <div className="card"><h2 className="text-xl font-semibold">Outgoing Messages</h2><pre>{JSON.stringify(rows.rows, null, 2)}</pre></div>;
}
