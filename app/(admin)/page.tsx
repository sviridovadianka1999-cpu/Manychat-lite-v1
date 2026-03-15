import { query } from "@/src/db/client";
import { StatCard } from "@/src/ui/cards";

export default async function DashboardPage() {
  const [contacts, flows, executions, errors, events, messages] = await Promise.all([
    query<{ count: string }>("SELECT count(*) FROM contacts"),
    query<{ count: string }>("SELECT count(*) FROM flows"),
    query<{ count: string }>("SELECT count(*) FROM flow_executions"),
    query("SELECT id,error_text,started_at FROM flow_executions WHERE error_text IS NOT NULL ORDER BY started_at DESC LIMIT 5"),
    query("SELECT id,event_type,received_at FROM incoming_events ORDER BY received_at DESC LIMIT 5"),
    query("SELECT id,message_type,send_status,created_at FROM outgoing_messages ORDER BY created_at DESC LIMIT 5")
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Contacts" value={contacts.rows[0]?.count ?? 0} />
        <StatCard label="Flows" value={flows.rows[0]?.count ?? 0} />
        <StatCard label="Executions" value={executions.rows[0]?.count ?? 0} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <section className="card"><h3 className="mb-2 font-medium">Latest errors</h3><pre>{JSON.stringify(errors.rows, null, 2)}</pre></section>
        <section className="card"><h3 className="mb-2 font-medium">Incoming events</h3><pre>{JSON.stringify(events.rows, null, 2)}</pre></section>
        <section className="card"><h3 className="mb-2 font-medium">Outgoing messages</h3><pre>{JSON.stringify(messages.rows, null, 2)}</pre></section>
      </div>
    </div>
  );
}
