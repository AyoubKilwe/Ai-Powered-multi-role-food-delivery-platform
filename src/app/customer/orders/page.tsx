"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  restaurant: { name: string };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setOrders);
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">My Orders</h2>
      {orders.map((o) => (
        <Link
          key={o.id}
          href={`/customer/orders/${o.id}`}
          className="flex items-center justify-between rounded-2xl border bg-white p-4 hover:shadow-md"
        >
          <div>
            <p className="font-semibold">{o.orderNumber}</p>
            <p className="text-sm text-stone-500">{o.restaurant.name}</p>
            <p className="text-xs text-stone-400">{new Date(o.createdAt).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <Badge status={o.status} />
            <p className="mt-2 font-bold">{formatCurrency(o.total)}</p>
          </div>
        </Link>
      ))}
      {orders.length === 0 && <p className="text-stone-500">No orders yet.</p>}
    </section>
  );
}
