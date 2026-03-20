import Link from "next/link";
import { query } from "@/src/db/client";

export default async function FlowsPage() {
  const flows = await query("SELECT id,name,is_enabled,definition_json,updated_at FROM flows ORDER BY updated_at DESC");
  return <div className="card"><h2 className="text-xl font-semibold mb-3">Flows</h2><table className="table"><thead><tr><th>Name</th><th>Trigger</th><th>Status</th><th></th></tr></thead><tbody>{flows.rows.map((f:any)=><tr key={f.id}><td>{f.name}</td><td>{f.definition_json?.trigger?.type}</td><td>{f.is_enabled?"enabled":"disabled"}</td><td><Link href={`/flows/${f.id}`}>Open</Link></td></tr>)}</tbody></table></div>;
}
