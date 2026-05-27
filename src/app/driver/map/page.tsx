"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(() => import("@/components/map/DeliveryMap"), {
  ssr: false,
});

export default function DriverMapPage() {
  const [order, setOrder] = useState<{
    restaurant: { lat: number; lng: number; name: string };
    driverLat: number | null;
    driverLng: number | null;
    deliveryAddress: string;
    deliveryLat: number | null;
    deliveryLng: number | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/driver")
      .then((r) => r.json())
      .then((d) => {
        const active = d.orders.find((o: { status: string }) =>
          ["PICKED_UP", "DELIVERING", "READY"].includes(o.status),
        );
        if (active) setOrder(active);
      });
  }, []);

  if (!order) {
    return (
      <p className="text-stone-500">
        No active delivery to navigate. Accept an order first.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">
        Route: {order.restaurant.name} → Customer
      </h2>
      <div className="h-[500px]">
        <DeliveryMap
          restaurant={order.restaurant}
          customer={{
            lat: order.deliveryLat ?? 9.936,
            lng: order.deliveryLng ?? 43.184,
            label: order.deliveryAddress,
          }}
          driver={
            order.driverLat && order.driverLng
              ? { lat: order.driverLat, lng: order.driverLng }
              : { lat: 9.935, lng: 43.182 }
          }
          height="100%"
        />
      </div>
    </section>
  );
}
