"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Phone, MessageCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryAddress: string;
  restaurant: { name: string; phone: string; lat: number; lng: number };
  customer: { name: string; phone: string | null; address: string | null };
}

export default function DriverPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () =>
    fetch("/api/driver?view=orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders));
  useEffect(() => {
    load();
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
        fetch("/api/driver", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        });
      });
    }
    const i = setInterval(load, 6000);
    return () => clearInterval(i);
  }, []);

  async function acceptOrder(orderId: string) {
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej),
    ).catch(() => null);
    await fetch("/api/driver", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accept: true,
        orderId,
        lat: pos?.coords.latitude ?? 9.936,
        lng: pos?.coords.longitude ?? 43.183,
      }),
    });
    load();
  }

  async function updateStatus(
    orderId: string,
    status: string,
    lat?: number,
    lng?: number,
  ) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        driverLat: lat ?? 9.935,
        driverLng: lng ?? 43.182,
      }),
    });
    load();
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">Delivery requests</h2>
      {orders.map((o) => (
        <article key={o.id} className="rounded-2xl border bg-white p-4">
          <div className="flex justify-between">
            <p className="font-semibold">{o.orderNumber}</p>
            <Badge status={o.status} />
          </div>
          <p className="text-sm">
            {o.restaurant.name} → {o.deliveryAddress}
          </p>
          <p className="text-sm text-stone-500">
            Customer: {o.customer?.name ?? "Guest"}
          </p>
          <p className="font-bold text-brand-600">{formatCurrency(o.total)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {o.customer.phone && (
              <a
                href={`tel:${o.customer.phone}`}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-sm"
              >
                <Phone className="h-4 w-4" /> Call customer
              </a>
            )}
            <a
              href={`tel:${o.restaurant.phone}`}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-sm"
            >
              <Phone className="h-4 w-4" /> Call restaurant
            </a>
            <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-sm text-stone-500">
              <MessageCircle className="h-4 w-4" /> In-app chat (demo)
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            {(o.status === "READY" || o.status === "ACCEPTED") && (
              <Button size="sm" onClick={() => acceptOrder(o.id)}>
                Accept delivery
              </Button>
            )}
            {o.status === "PICKED_UP" && (
              <Button
                size="sm"
                onClick={() => updateStatus(o.id, "DELIVERING")}
              >
                Start delivery
              </Button>
            )}
            {o.status === "DELIVERING" && (
              <Button size="sm" onClick={() => updateStatus(o.id, "DELIVERED")}>
                Mark delivered
              </Button>
            )}
          </div>
        </article>
      ))}
      {orders.length === 0 && (
        <p className="text-stone-500">No deliveries available.</p>
      )}
    </section>
  );
}
