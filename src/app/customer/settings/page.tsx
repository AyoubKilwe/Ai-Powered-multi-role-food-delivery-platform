"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  LocationPicker,
  type LocationValue,
} from "@/components/LocationPicker";

export default function CustomerSettingsPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((u) => {
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          address: u.address || "",
        });
        if (typeof u.lat === "number" && typeof u.lng === "number") {
          setLocation({ lat: u.lat, lng: u.lng, address: u.address });
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        address: form.address,
        lat: location?.lat,
        lng: location?.lng,
      }),
    });
    setLoading(false);
    if (res.ok) setSaved(true);
    else alert("Could not save profile");
  }

  return (
    <section className="max-w-xl space-y-6">
      <h2 className="text-xl font-bold">My profile</h2>
      <Card title="Personal information">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input label="Email" value={form.email} disabled />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <LocationPicker
            value={location}
            onChange={setLocation}
            address={form.address}
            onAddressChange={(address) => setForm({ ...form, address })}
            addressLabel="Delivery address"
            required
          />
          {saved && (
            <p className="text-sm text-green-600">Profile saved successfully.</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
