import { query } from "@/src/db/client";

export default async function ContactDetail({ params }: { params: { id: string } }) {
  const [contact, tags, fields, executions] = await Promise.all([
    query("SELECT * FROM contacts WHERE id=$1", [params.id]),
    query("SELECT tag FROM contact_tags WHERE contact_id=$1", [params.id]),
    query("SELECT field_key, field_value FROM contact_custom_fields WHERE contact_id=$1", [params.id]),
    query("SELECT * FROM flow_executions WHERE contact_id=$1 ORDER BY started_at DESC", [params.id])
  ]);
  return <div className="card"><h2 className="text-xl font-semibold">Contact</h2><pre>{JSON.stringify({ contact: contact.rows[0], tags: tags.rows, fields: fields.rows, executions: executions.rows }, null, 2)}</pre></div>;
}
