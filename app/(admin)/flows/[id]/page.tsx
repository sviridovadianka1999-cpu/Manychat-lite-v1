import { query } from "@/src/db/client";

export default async function FlowDetail({ params }: { params: { id: string } }) {
  const flow = await query("SELECT * FROM flows WHERE id=$1", [params.id]);
  return <div className="card"><h2 className="text-xl font-semibold">Flow details</h2><pre>{JSON.stringify(flow.rows[0], null, 2)}</pre></div>;
}
