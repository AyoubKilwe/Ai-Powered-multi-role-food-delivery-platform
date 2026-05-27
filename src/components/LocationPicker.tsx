"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type LocationValue = {
  lat: number;
  lng: number;
  address?: string;
};

type Props = {
  value: LocationValue | null;
  onChange: (loc: LocationValue | null) => void;
  address?: string;
  onAddressChange?: (address: string) => void;
  addressLabel?: string;
  addressPlaceholder?: string;
  required?: boolean;
};

export function LocationPicker({
  value,
  onChange,
  address = "",
  onAddressChange,
  addressLabel = "Address",
  addressPlaceholder = "Wadada Madaxtooyada, Borama",
  required = false,
}: Props) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  function useGps() {
    if (!navigator.geolocation) {
      setError("Your browser does not support GPS.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: address || undefined,
        });
        setLocating(false);
      },
      () => {
        setError(
          "Could not get GPS. Allow location access or enter coordinates manually.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
      {onAddressChange && (
        <Input
          label={addressLabel}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={addressPlaceholder}
          required={required}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
        <p>
          {required
            ? "Select your exact location (GPS required)."
            : "Add GPS so we can find you faster."}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={useGps}
          disabled={locating}
        >
          {locating ? "Detecting..." : value ? "Refresh GPS" : "Use my location"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {value && (
        <p className="text-sm font-medium text-brand-700">
          Location: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Latitude"
          type="number"
          step="0.00001"
          value={value?.lat ?? ""}
          onChange={(e) => {
            const lat = parseFloat(e.target.value);
            if (!Number.isNaN(lat)) {
              onChange({
                lat,
                lng: value?.lng ?? 43.181,
                address,
              });
            } else if (!e.target.value) onChange(null);
          }}
          placeholder="9.9340"
        />
        <Input
          label="Longitude"
          type="number"
          step="0.00001"
          value={value?.lng ?? ""}
          onChange={(e) => {
            const lng = parseFloat(e.target.value);
            if (!Number.isNaN(lng)) {
              onChange({
                lng,
                lat: value?.lat ?? 9.934,
                address,
              });
            } else if (!e.target.value) onChange(null);
          }}
          placeholder="43.1810"
        />
      </div>
      {value && (
        <a
          href={`https://www.google.com/maps?q=${value.lat},${value.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-600 hover:underline"
        >
          Preview on map
        </a>
      )}
    </div>
  );
}
