"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string | null;
  restaurant?: { name?: string } | null;
  items?: {
    quantity: number;
    menuItem?: { name?: string; image?: string };
    price?: number;
  }[];
}

interface OrderApiRow extends Order {
  status: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = () =>
      fetch("/api/orders")
        .then((r) => r.json())
        .then((data) => {
          if (!mounted) return;
          const visible = Array.isArray(data)
            ? data.filter((o: OrderApiRow) => o.status !== "CANCELLED")
            : [];
          setOrders(visible);
        })
        .catch(() => undefined);

    load();
    const interval = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">My Orders</h2>
        <Button
          size="sm"
          variant="danger"
          onClick={async () => {
            if (!confirm("Clear all your orders? This will cancel them."))
              return;
            setClearing(true);
            try {
              await fetch("/api/orders", { method: "DELETE" });
              // immediately clear UI to avoid duplicates while polling
              setOrders([]);
            } catch (e) {
              // ignore
            } finally {
              setClearing(false);
            }
          }}
          disabled={clearing}
        >
          {clearing ? "Clearing..." : "Clear all"}
        </Button>
      </div>
      {orders.map((o) => {
        const date = o.createdAt ? new Date(o.createdAt) : null;
        return (
          <Link
            key={o.id}
            href={`/customer/orders/${o.id}`}
            className="block rounded-2xl border border-stone-200 bg-white p-4 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-stone-100">
                {o.items && o.items[0]?.menuItem?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.items[0].menuItem.image}
                    alt={o.items[0].menuItem.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-stone-400">
                    IMG
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{o.orderNumber}</p>
                <p className="text-sm text-stone-500">
                  {o.restaurant?.name || "Unknown restaurant"}
                </p>
                <p className="text-sm text-stone-600 mt-1">
                  {o.items && o.items[0]?.menuItem?.name
                    ? o.items[0].menuItem.name
                    : ""}
                </p>
                <p className="text-xs text-stone-400">
                  {date ? date.toLocaleString() : "Unknown time"}
                </p>
              </div>
              <div className="text-right">
                <Badge status={o.status} />
                <p className="mt-2 font-bold text-lg">
                  {formatCurrency(o.total)}
                </p>
              </div>
            </div>

            {o.items && o.items.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {o.items.map((it, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-md border border-stone-100 p-3"
                  >
                    <div>
                      <div className="font-medium text-sm text-stone-800">
                        {it.menuItem?.name || "Item"}
                      </div>
                      <div className="text-xs text-stone-500">
                        Qty: {it.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-stone-800">
                      {formatCurrency(it.price ?? 0)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Link>
        );
      })}
      {orders.length === 0 && <p className="text-stone-500">No orders yet.</p>}
    </section>
  );
}
