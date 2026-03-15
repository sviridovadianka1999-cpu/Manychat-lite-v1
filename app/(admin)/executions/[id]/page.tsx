import { query } from "@/src/db/client";

export default async function ExecutionDetail({ params }: { params: { id: string } }) {
  const [execution, steps] = await Promise.all([
    query("SELECT * FROM flow_executions WHERE id=$1", [params.id]),
    query("SELECT * FROM flow_execution_steps WHERE execution_id=$1 ORDER BY created_at ASC", [params.id])
  ]);
  return <div className="card"><h2 className="text-xl font-semibold">Execution details</h2><pre>{JSON.stringify({ execution: execution.rows[0], steps: steps.rows }, null, 2)}</pre></div>;
}
