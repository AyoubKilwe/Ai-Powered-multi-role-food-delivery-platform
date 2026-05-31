"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
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

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true });
      return;
    }

    map.fitBounds(points, {
      padding: [50, 50],
      maxZoom: 16,
      animate: true,
    });
  }, [map, points]);

  return null;
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

  const points: [number, number][] = [];
  if (restaurant) points.push([restaurant.lat, restaurant.lng]);
  if (driver) points.push([driver.lat, driver.lng]);
  if (customer) points.push([customer.lat, customer.lng]);

  const center =
    points[0] || [BORAMA_CENTER.lat, BORAMA_CENTER.lng];

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-xl">
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
        <FitBounds points={points} />
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
        {restaurant && driver && (
          <Polyline
            positions={[
              [restaurant.lat, restaurant.lng],
              [driver.lat, driver.lng],
            ]}
            color="#ea580c"
            weight={4}
            dashArray="8 8"
          />
        )}
        {driver && customer && (
          <Polyline
            positions={[
              [driver.lat, driver.lng],
              [customer.lat, customer.lng],
            ]}
            color="#2563eb"
            weight={4}
          />
        )}
        {!driver && restaurant && customer && (
          <Polyline
            positions={[
              [restaurant.lat, restaurant.lng],
              [customer.lat, customer.lng],
            ]}
            color="#ea580c"
            weight={4}
            dashArray="8 8"
          />
        )}
      </MapContainer>
    </div>
  );
}
