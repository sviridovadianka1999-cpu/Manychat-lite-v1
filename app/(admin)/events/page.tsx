import { query } from "@/src/db/client";

export default async function EventsPage() {
  const events = await query("SELECT * FROM incoming_events ORDER BY received_at DESC LIMIT 100");
  return <div className="card"><h2 className="text-xl font-semibold">Incoming Events</h2><pre>{JSON.stringify(events.rows, null, 2)}</pre></div>;
}
