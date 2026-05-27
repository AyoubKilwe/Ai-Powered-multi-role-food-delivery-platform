import { DashboardShell } from "@/components/layout/DashboardShell";

const nav = [
  { href: "/driver", label: "Deliveries" },
  { href: "/driver/map", label: "Route Map" },
  { href: "/driver/commissions", label: "Commissions" },
  { href: "/driver/profile", label: "My Profile" },
  { href: "/driver/documents", label: "Documents" },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell nav={nav} title="Driver">
      {children}
    </DashboardShell>
  );
}
