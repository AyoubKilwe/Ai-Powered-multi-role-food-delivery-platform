"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Phone, Navigation, MapPin, LocateFixed } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const DeliveryMap = dynamic(() => import("@/components/map/DeliveryMap"), {
  ssr: false,
});

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryAddress: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  driverLat: number | null;
  driverLng: number | null;
  restaurant?: { name?: string; phone?: string; lat?: number; lng?: number } | null;
  customer?: { name?: string; phone?: string | null; address?: string | null } | null;
}

function normalizeStatus(status?: string | null) {
  if (!status) return "PENDING";
  const upper = status.trim().toUpperCase();
  if (upper.includes("READY")) return "READY";
  if (upper.includes("PICKED")) return "PICKED_UP";
  if (upper.includes("DELIVERING")) return "DELIVERING";
  if (upper.includes("DELIVERED")) return "DELIVERED";
  if (upper.includes("COOKING")) return "COOKING";
  if (upper.includes("ACCEPTED")) return "ACCEPTED";
  if (upper.includes("DECLINED")) return "DECLINED";
  if (upper.includes("CANCELLED")) return "CANCELLED";
  if (upper.includes("PENDING")) return "PENDING";
  return upper;
}

function haversineKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function DriverPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  // keep previous orders to detect new READY notifications
  const prevOrdersRef = useRef<Order[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/driver?view=orders", { cache: "no-store" });
    const d = await res.json();
    const newOrders: Order[] = d.orders ?? [];

    // detect newly available READY orders
    try {
      const prevIds = new Set(prevOrdersRef.current.map((o) => o.id));
      const newlyReady = newOrders.filter(
        (o) => normalizeStatus(o.status) === "READY" && !prevIds.has(o.id),
      );
      if (newlyReady.length) {
        // short beep using WebAudio API (may require user interaction in some browsers)
        if (typeof AudioContext !== "undefined") {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 880;
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.value = 0.05;
          osc.start();
          setTimeout(() => {
            osc.stop();
            ctx.close();
          }, 250);
        }
      }
    } catch {
      // ignore notification errors
    }

    prevOrdersRef.current = newOrders;
    setOrders(newOrders);
  }, []);

  useEffect(() => {
    void load();
    const i = setInterval(load, 3000);
    let watchId: number | undefined;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        const nextLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLocation(nextLocation);
        fetch("/api/driver", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextLocation),
        });
      });
    }
    return () => {
      clearInterval(i);
      if (typeof watchId === "number") navigator.geolocation?.clearWatch(watchId);
    };
  }, [load]);

  async function acceptOrder(orderId: string) {
    const currentLocation = driverLocation ?? { lat: 9.936, lng: 43.183 };
    await fetch("/api/driver", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accept: true,
        orderId,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
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
        <article key={o.id} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-lg">{o.orderNumber}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-600">
                <span>{o.restaurant?.name ?? "Restaurant"}</span>
                <span>→</span>
                <span>{o.customer?.name ?? "Guest"}</span>
              </div>
              <p className="text-xs text-stone-500">
                Pickup: {o.restaurant?.name ?? "Restaurant"} • Dropoff: {o.deliveryAddress}
              </p>
            </div>
            <div className="text-right">
              <Badge status={normalizeStatus(o.status)} />
              <p className="font-bold text-brand-600">{formatCurrency(o.total)}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {o.customer?.phone && (
                  <a
                    href={`tel:${o.customer.phone}`}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
                  >
                    <Phone className="h-4 w-4" /> Call customer
                  </a>
                )}
                {o.restaurant?.phone && (
                  <a
                    href={`tel:${o.restaurant.phone}`}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
                  >
                    <Phone className="h-4 w-4" /> Call restaurant
                  </a>
                )}
                {typeof o.restaurant?.lat === "number" && typeof o.restaurant?.lng === "number" && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${driverLocation?.lat ?? o.restaurant.lat},${driverLocation?.lng ?? o.restaurant.lng}&destination=${o.restaurant.lat},${o.restaurant.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
                  >
                    <Navigation className="h-4 w-4" /> Go to restaurant
                  </a>
                )}
                {typeof o.deliveryLat === "number" && typeof o.deliveryLng === "number" && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${driverLocation?.lat ?? o.deliveryLat},${driverLocation?.lng ?? o.deliveryLng}&destination=${o.deliveryLat},${o.deliveryLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
                  >
                    <MapPin className="h-4 w-4" /> Go to customer
                  </a>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
                  <div className="flex items-center gap-2 font-semibold text-stone-900">
                    <LocateFixed className="h-4 w-4 text-brand-600" /> Restaurant details
                  </div>
                  <p className="mt-2">Name: {o.restaurant?.name ?? "Restaurant not linked yet"}</p>
                  <p>Phone: {o.restaurant?.phone ?? "Not provided"}</p>
                  <p>
                    Location: {typeof o.restaurant?.lat === "number" && typeof o.restaurant?.lng === "number"
                      ? `${o.restaurant.lat.toFixed(5)}, ${o.restaurant.lng.toFixed(5)}`
                      : "Not provided"}
                  </p>
                  <p>
                    Distance from you: {driverLocation && typeof o.restaurant?.lat === "number" && typeof o.restaurant?.lng === "number"
                      ? `${haversineKm(driverLocation, { lat: o.restaurant.lat, lng: o.restaurant.lng }).toFixed(1)} km`
                      : "Waiting for GPS"}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
                  <div className="flex items-center gap-2 font-semibold text-stone-900">
                    <MapPin className="h-4 w-4 text-brand-600" /> Customer details
                  </div>
                  <p className="mt-2">Name: {o.customer?.name ?? "Guest"}</p>
                  <p>Phone: {o.customer?.phone || "Not provided"}</p>
                  <p>Area: {o.customer?.address || o.deliveryAddress}</p>
                  <p>
                    Live map: {typeof o.deliveryLat === "number" && typeof o.deliveryLng === "number"
                      ? `${o.deliveryLat.toFixed(5)}, ${o.deliveryLng.toFixed(5)}`
                      : "Not provided"}
                  </p>
                  <p>
                    Distance from you: {driverLocation && typeof o.deliveryLat === "number" && typeof o.deliveryLng === "number"
                      ? `${haversineKm(driverLocation, { lat: o.deliveryLat, lng: o.deliveryLng }).toFixed(1)} km`
                      : "Waiting for GPS"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border bg-stone-50 p-3">
                {typeof o.restaurant?.lat === "number" && typeof o.restaurant?.lng === "number" ? (
                  <DeliveryMap
                    restaurant={{
                      lat: o.restaurant.lat,
                      lng: o.restaurant.lng,
                      name: o.restaurant?.name ?? "Restaurant",
                    }}
                    customer={{
                      lat: o.deliveryLat ?? o.restaurant.lat,
                      lng: o.deliveryLng ?? o.restaurant.lng,
                      label: o.customer?.address || o.deliveryAddress,
                    }}
                    driver={
                      o.driverLat && o.driverLng
                        ? { lat: o.driverLat, lng: o.driverLng }
                        : undefined
                    }
                    height="260px"
                  />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-xl border border-stone-200 bg-white text-sm text-stone-500 shadow-sm"
                    style={{ height: 120 }}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5">
                      <MapPin className="h-4 w-4 text-stone-400" />
                      Live map not linked yet
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {(normalizeStatus(o.status) === "READY" || normalizeStatus(o.status) === "ACCEPTED") && (
                  <Button size="sm" className="flex-1" onClick={() => acceptOrder(o.id)}>
                    Accept delivery
                  </Button>
                )}
                {normalizeStatus(o.status) === "PICKED_UP" && (
                  <Button size="sm" className="flex-1" onClick={() => updateStatus(o.id, "DELIVERING")}>Start delivery</Button>
                )}
                {normalizeStatus(o.status) === "DELIVERING" && (
                  <Button size="sm" className="flex-1" onClick={() => updateStatus(o.id, "DELIVERED")}>Mark delivered</Button>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}
      {orders.length === 0 && (
        <p className="text-stone-500">No deliveries available.</p>
      )}
    </section>
  );
}
