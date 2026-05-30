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
  driver?: { name?: string; phone?: string } | null;
  items?: { quantity: number; menuItem?: { name?: string }; price?: number }[];
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
  const showMap = ["DELIVERING", "PICKED_UP", "READY"].includes(order.status);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{order.orderNumber}</h2>
        <Badge status={order.status} />
      </div>
      <p className="text-stone-600">
        {ORDER_STATUS_LABELS[order.status] || order.status}
      </p>
      <p className="text-sm">
        From <strong>{order.restaurant?.name || "Unknown restaurant"}</strong>
        {order.deliveryAddress ? ` → ${order.deliveryAddress}` : ""}
      </p>
      <p className="text-xs text-stone-400">
        {date ? date.toLocaleString() : "Unknown time"}
      </p>
      {order.driver && (
        <p className="text-sm">
          Driver: {order.driver.name} — {order.driver.phone}
        </p>
      )}

      {showMap && order.restaurant?.lat && order.restaurant?.lng && (
        <div className="h-80">
          <DeliveryMap
            restaurant={{
              lat: order.restaurant.lat,
              lng: order.restaurant.lng,
              name: order.restaurant.name,
            }}
            customer={{
              lat: order.deliveryLat ?? BORAMA_CENTER.lat + 0.002,
              lng: order.deliveryLng ?? BORAMA_CENTER.lng + 0.002,
              label: order.deliveryAddress,
            }}
            driver={
              order.driverLat && order.driverLng
                ? { lat: order.driverLat, lng: order.driverLng }
                : undefined
            }
            height="100%"
          />
        </div>
      )}

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
