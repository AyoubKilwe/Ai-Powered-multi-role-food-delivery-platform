"use client";

import { useEffect, useState } from "react";
import { Clock3, Phone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  customer: { name: string; phone: string | null };
  items: { quantity: number; menuItem: { name: string } }[];
}

export default function ReceptionistOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [updating, setUpdating] = useState(false);

  const load = () =>
    fetch("/api/receptionist?view=orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.restaurant.orders || []));

  useEffect(() => {
    load();
    const i = setInterval(load, 8000);
    function onVisibility() {
      if (document.visibilityState === "visible") load();
    }
    function onFocus() {
      load();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    load();
  }

  const pending = orders.filter((o) => o.status === "PENDING").length;
  const cooking = orders.filter((o) => o.status === "COOKING").length;
  const ready = orders.filter((o) => o.status === "READY").length;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">
              Live orders board
            </p>
            <h2 className="mt-1 text-2xl font-black text-stone-900">
              Stay on top of the kitchen queue
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              This view refreshes automatically every few seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 font-semibold text-amber-800">
              <Clock3 className="h-4 w-4" /> {pending} pending
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 font-semibold text-blue-800">
              <RefreshCw className="h-4 w-4" /> {cooking} cooking
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-800">
              Ready: {ready}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map((o) => (
          <article
            key={o.id}
            className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-stone-900">
                  {o.orderNumber}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {o.customer?.name ?? "Guest"}
                  {o.customer?.phone ? ` • ${o.customer.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={o.status} />
                <p className="font-black text-brand-600">
                  {formatCurrency(o.total)}
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
              {(o.items || []).map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span>{item.menuItem?.name ?? "Item"}</span>
                  <span className="font-semibold">x{item.quantity}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              {o.customer.phone && (
                <a
                  href={`tel:${o.customer.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Phone className="h-4 w-4" /> Call customer
                </a>
              )}
              {o.status === "PENDING" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => updateStatus(o.id, "ACCEPTED")}
                    disabled={updating}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => updateStatus(o.id, "DECLINED")}
                    disabled={updating}
                  >
                    Decline
                  </Button>
                </>
              )}
              {o.status === "ACCEPTED" && (
                <Button
                  size="sm"
                  onClick={() => updateStatus(o.id, "COOKING")}
                  disabled={updating}
                >
                  Start cooking
                </Button>
              )}
              {o.status === "COOKING" && (
                <Button
                  size="sm"
                  onClick={() => updateStatus(o.id, "READY")}
                  disabled={updating}
                >
                  Mark ready
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center text-stone-500">
          No live orders yet.
        </div>
      )}
    </section>
  );
}
