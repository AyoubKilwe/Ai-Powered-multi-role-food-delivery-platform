import { CartProvider } from "@/context/CartContext";
import { DashboardShell } from "@/components/layout/DashboardShell";

const nav = [
  { href: "/customer", label: "Browse Restaurants" },
  { href: "/customer/cart", label: "My Cart" },
  { href: "/customer/orders", label: "My Orders" },
  { href: "/customer/booking", label: "Table Booking" },
  { href: "/customer/chatbot", label: "Food AI" },
  { href: "/customer/settings", label: "My Profile" },
];

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <DashboardShell nav={nav} title="Customer">
        {children}
      </DashboardShell>
    </CartProvider>
  );
}
