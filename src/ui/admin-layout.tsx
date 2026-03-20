import Link from "next/link";

const links = [
  ["Dashboard", "/"],
  ["Flows", "/flows"],
  ["Contacts", "/contacts"],
  ["Executions", "/executions"],
  ["Incoming Events", "/events"],
  ["Outgoing Messages", "/messages"],
  ["Settings", "/settings"]
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-[220px_1fr] gap-6 p-6">
      <aside className="card h-fit">
        <h1 className="mb-4 text-lg font-semibold">Manychat-lite v1</h1>
        <nav className="space-y-2">
          {links.map(([label, href]) => (
            <Link className="block rounded px-2 py-1 hover:bg-slate-100" key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="space-y-4">{children}</main>
    </div>
  );
}
