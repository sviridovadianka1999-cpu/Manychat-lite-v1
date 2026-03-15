import Link from "next/link";
import { query } from "@/src/db/client";

export default async function ExecutionsPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status;
  const executions = status ? await query("SELECT * FROM flow_executions WHERE status=$1 ORDER BY started_at DESC LIMIT 100", [status]) : await query("SELECT * FROM flow_executions ORDER BY started_at DESC LIMIT 100");
  return <div className="card"><h2 className="text-xl font-semibold mb-3">Executions</h2><table className="table"><thead><tr><th>ID</th><th>Status</th><th>Trigger</th><th></th></tr></thead><tbody>{executions.rows.map((e:any)=><tr key={e.id}><td>{e.id.slice(0,8)}</td><td>{e.status}</td><td>{e.trigger_type}</td><td><Link href={`/executions/${e.id}`}>Open</Link></td></tr>)}</tbody></table></div>;
}
