import Link from "next/link";
import { query } from "@/src/db/client";

export default async function ContactsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? "";
  const contacts = await query(`SELECT * FROM contacts WHERE username ILIKE $1 OR platform_user_id ILIKE $1 ORDER BY created_at DESC LIMIT 100`, [`%${q}%`]);
  return <div className="card"><h2 className="text-xl font-semibold mb-3">Contacts</h2><table className="table"><thead><tr><th>User</th><th>Platform user ID</th><th></th></tr></thead><tbody>{contacts.rows.map((c:any)=><tr key={c.id}><td>{c.username ?? c.display_name ?? "-"}</td><td>{c.platform_user_id}</td><td><Link href={`/contacts/${c.id}`}>Open</Link></td></tr>)}</tbody></table></div>;
}
