"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { BORAMA_CENTER } from "@/lib/utils";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const driverIcon = L.divIcon({
  className: "driver-marker",
  html: '<div style="background:#ea580c;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface DeliveryMapProps {
  restaurant?: { lat: number; lng: number; name: string };
  customer?: { lat: number; lng: number; label?: string };
  driver?: { lat: number; lng: number };
  height?: string;
}

export default function DeliveryMap({
  restaurant,
  customer,
  driver,
  height = "320px",
}: DeliveryMapProps) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  }, []);

  const center = driver
    ? { lat: driver.lat, lng: driver.lng }
    : restaurant
      ? { lat: restaurant.lat, lng: restaurant.lng }
      : BORAMA_CENTER;

  const points: [number, number][] = [];
  if (restaurant) points.push([restaurant.lat, restaurant.lng]);
  if (driver) points.push([driver.lat, driver.lng]);
  if (customer) points.push([customer.lat, customer.lng]);

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-xl">
      <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {restaurant && (
          <Marker position={[restaurant.lat, restaurant.lng]} icon={icon}>
            <Popup>{restaurant.name}</Popup>
          </Marker>
        )}
        {customer && (
          <Marker position={[customer.lat, customer.lng]} icon={icon}>
            <Popup>{customer.label || "Delivery address"}</Popup>
          </Marker>
        )}
        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>Driver location</Popup>
          </Marker>
        )}
        {points.length >= 2 && <Polyline positions={points} color="#ea580c" weight={4} dashArray="8 8" />}
      </MapContainer>
    </div>
  );
}
