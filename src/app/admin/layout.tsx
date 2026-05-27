import { DashboardShell } from "@/components/layout/DashboardShell";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "User Management" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/monitoring", label: "Monitoring" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell nav={nav} title="Admin">
      {children}
    </DashboardShell>
  );
}
