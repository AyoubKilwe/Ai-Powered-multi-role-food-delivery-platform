"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { calculateOrderTotals, formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, total } = useCart();
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState(
    "No GPS location saved yet",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((u) => {
        if (u?.address) setAddress(u.address);
        if (typeof u?.lat === "number" && typeof u?.lng === "number") {
          setDeliveryLat(u.lat);
          setDeliveryLng(u.lng);
          setLocationLabel(
            `Saved GPS: ${u.lat.toFixed(5)}, ${u.lng.toFixed(5)}`,
          );
        }
      });
  }, []);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryLat(pos.coords.latitude);
        setDeliveryLng(pos.coords.longitude);
        setLocationLabel(
          `Current GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        );
        setLocating(false);
      },
      () => {
        setError(
          "Unable to capture your location. Please allow GPS or type your address manually.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const {
    serviceTax,
    deliveryFee,
    total: grandTotal,
  } = calculateOrderTotals(total);

  async function checkout() {
    if (!items.length) return;
    if (!address.trim()) {
      setError("Please enter your delivery address");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: items[0].restaurantId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          price: i.price,
          customizations: i.customizations,
        })),
        notes,
        deliveryAddress: address.trim(),
        deliveryLat,
        deliveryLng,
      }),
    });
    setLoading(false);
    if (res.ok) {
      clearCart();
      const order = await res.json();
      router.push(`/customer/orders/${order.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Checkout failed");
    }
  }

  if (!items.length) {
    return (
      <section className="text-center py-12">
        <p className="text-stone-500">Your cart is empty</p>
        <Link href="/customer">
          <Button className="mt-4">Browse restaurants</Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-xl font-bold">
        Your cart — {items[0].restaurantName}
      </h2>
      {items.map((item) => (
        <article
          key={item.menuItemId}
          className="flex items-center justify-between rounded-xl border bg-white p-4"
        >
          <div>
            <p className="font-medium">{item.name}</p>
            {item.customizations && (
              <p className="text-xs text-stone-500">{item.customizations}</p>
            )}
            <p className="text-brand-600">{formatCurrency(item.price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQty(item.menuItemId, item.quantity - 1)}
              className="rounded-lg border p-1"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span>{item.quantity}</span>
            <button
              onClick={() => updateQty(item.menuItemId, item.quantity + 1)}
              className="rounded-lg border p-1"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => removeItem(item.menuItemId)}
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}

      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <Input
          label="Delivery address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Wadada Madaxtooyada, Borama"
          required
        />
        <div className="flex flex-col gap-2 rounded-xl bg-stone-50 p-3 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
          <span>{locationLabel}</span>
          <Button
            type="button"
            variant="outline"
            onClick={useCurrentLocation}
            disabled={locating}
          >
            {locating
              ? "Detecting..."
              : deliveryLat
                ? "Update GPS"
                : "Use my location"}
          </Button>
        </div>
      </div>
      <textarea
        placeholder="Order notes (optional)..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full rounded-xl border border-stone-200 p-3 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl bg-stone-100 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Service tax (5%)</span>
          <span>{formatCurrency(serviceTax)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={checkout}
        disabled={loading}
      >
        {loading ? "Placing order..." : "Checkout securely"}
      </Button>
    </section>
  );
}
