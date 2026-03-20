import { AdminLayout } from "@/src/ui/admin-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
