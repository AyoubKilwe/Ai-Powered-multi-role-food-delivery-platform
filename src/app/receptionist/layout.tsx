import { DashboardShell } from "@/components/layout/DashboardShell";

const nav = [
  { href: "/receptionist", label: "Dashboard" },
  { href: "/receptionist/orders", label: "Orders" },
  { href: "/receptionist/menu", label: "Menu" },
  { href: "/receptionist/bookings", label: "Bookings" },
  { href: "/receptionist/profile", label: "Profile & Tables" },
  { href: "/receptionist/reports", label: "Sales Reports" },
];

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell nav={nav} title="Receptionist">
      {children}
    </DashboardShell>
  );
}
