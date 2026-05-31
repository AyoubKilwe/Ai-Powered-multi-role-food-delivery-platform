"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/Badge";
import {
  ORDER_STATUS_LABELS,
  formatCurrency,
  BORAMA_CENTER,
} from "@/lib/utils";

const DeliveryMap = dynamic(() => import("@/components/map/DeliveryMap"), {
  ssr: false,
});

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt?: string | null;
  deliveryAddress?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  driverLat?: number | null;
  driverLng?: number | null;
  restaurant?: {
    id?: string;
    name?: string;
    lat?: number;
    lng?: number;
  } | null;
  driver?: {
    name?: string;
    phone?: string;
    vehicleType?: string | null;
    vehiclePlate?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  items?: {
    quantity: number;
    menuItem?: { name?: string; image?: string };
    price?: number;
  }[];
}

export default function OrderTrackPage() {
  const params = useParams<{ id?: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = () =>
      fetch(`/api/orders/${id}`)
        .then((r) => r.json())
        .then(setOrder);
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (!order) return <p>Loading...</p>;

  const date = order.createdAt ? new Date(order.createdAt) : null;
  const showMap = ["DELIVERING", "PICKED_UP", "READY", "ACCEPTED", "DELIVERED"].includes(order.status);
  const showDriverDetails = ["PICKED_UP", "DELIVERING", "READY", "DELIVERED"].includes(order.status);
  const driverIsLive = typeof order.driver?.lat === "number" && typeof order.driver?.lng === "number";
  const hasCustomerCoords = typeof order.deliveryLat === "number" && typeof order.deliveryLng === "number";
  const hasRestaurantCoords = typeof order.restaurant?.lat === "number" && typeof order.restaurant?.lng === "number";
  const hasAnyMapPoint = driverIsLive || hasCustomerCoords || hasRestaurantCoords;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="bg-linear-to-r from-brand-600 to-orange-500 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/80">Live delivery tracking</p>
              <h2 className="text-2xl font-black">{order.orderNumber}</h2>
            </div>
            <Badge status={order.status} className="bg-white text-stone-900" />
          </div>
          <p className="mt-2 text-sm text-white/90">
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </p>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <p className="text-sm text-stone-600">
              From <strong>{order.restaurant?.name || "Unknown restaurant"}</strong>
              {order.deliveryAddress ? ` → ${order.deliveryAddress}` : ""}
            </p>
            <p className="text-xs text-stone-400">
              {date ? date.toLocaleString() : "Unknown time"}
            </p>

            {showDriverDetails && order.driver && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                <p className="font-semibold">Driver accepted your order</p>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  <p>Name: {order.driver.name ?? "Driver"}</p>
                  <p>Phone: {order.driver.phone || "Not provided"}</p>
                  <p>
                    Vehicle: {order.driver.vehicleType || "Vehicle"}
                    {order.driver.vehiclePlate ? ` • Plate: ${order.driver.vehiclePlate}` : ""}
                  </p>
                  <p>
                    Live position: {driverIsLive ? `${order.driver.lat?.toFixed(5)}, ${order.driver.lng?.toFixed(5)}` : "Updating..."}
                  </p>
                </div>
              </div>
            )}

            {driverIsLive && hasCustomerCoords && (
              <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
                <p className="font-semibold text-stone-900">Driver is on the move</p>
                <p>Watch the route on the map — the blue line is the driver heading to you.</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
            {showMap && hasAnyMapPoint ? (
              <div className="h-80 overflow-hidden rounded-xl">
                <DeliveryMap
                  restaurant={{
                    lat: order.restaurant?.lat ?? BORAMA_CENTER.lat,
                    lng: order.restaurant?.lng ?? BORAMA_CENTER.lng,
                    name: order.restaurant?.name ?? "Restaurant",
                  }}
                  customer={
                    hasCustomerCoords
                      ? {
                          lat: order.deliveryLat as number,
                          lng: order.deliveryLng as number,
                          label: order.deliveryAddress ?? "Delivery location",
                        }
                      : undefined
                  }
                  driver={
                    driverIsLive
                      ? { lat: order.driver!.lat as number, lng: order.driver!.lng as number }
                      : typeof order.driverLat === "number" && typeof order.driverLng === "number"
                        ? { lat: order.driverLat, lng: order.driverLng }
                        : undefined
                  }
                  height="100%"
                />
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white text-sm text-stone-500">
                Tracking map will appear here when delivery coordinates are available.
              </div>
            )}
          </div>
        </div>
      </div>

      <ul className="rounded-xl border bg-white divide-y">
        {(order.items || []).map((item, i) => (
          <li key={i} className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-stone-100">
                {item.menuItem?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.menuItem.image}
                    alt={item.menuItem?.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-stone-400">
                    IMG
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium text-sm text-stone-800">
                  {item.menuItem?.name || "Item"}
                </div>
                <div className="text-xs text-stone-500">
                  Qty: {item.quantity}
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-stone-800">
              {formatCurrency((item.price || 0) * item.quantity)}
            </div>
          </li>
        ))}
        <li className="flex justify-between p-3 font-bold">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </li>
      </ul>
    </section>
  );
}
