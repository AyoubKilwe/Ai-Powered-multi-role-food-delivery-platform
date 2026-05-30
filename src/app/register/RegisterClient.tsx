"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  LocationPicker,
  type LocationValue,
} from "@/components/LocationPicker";
import { uploadFile } from "@/lib/upload-client";

const roles = [
  { value: "CUSTOMER", label: "Customer — order food" },
  { value: "DRIVER", label: "Driver — deliver orders" },
  { value: "RECEPTIONIST", label: "Restaurant — manage your business" },
];

const DRIVER_DOC_TYPES = [
  "Driving License",
  "National ID",
  "Passport",
] as const;

export default function RegisterClient() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    role: "CUSTOMER",
    restaurantName: "",
    restaurantPhone: "",
    restaurantPhonesExtra: "",
    restaurantAbout: "",
    vehiclePlate: "",
    vehicleType: "",
  });
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [restaurantImages, setRestaurantImages] = useState<string[]>([]);
  const [driverDocs, setDriverDocs] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const needsLocation =
    form.role === "CUSTOMER" || form.role === "RECEPTIONIST";

  async function handleFile(
    file: File,
    folder: "restaurant-gallery" | "driver-docs",
    key: string,
    onDone: (url: string) => void,
  ) {
    setUploading(key);
    const { url, error: err } = await uploadFile(file, folder);
    setUploading(null);
    if (err || !url) {
      setError(err || "Upload failed");
      return;
    }
    onDone(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (needsLocation && !location) {
      setError("Please set your location using GPS or coordinates.");
      setLoading(false);
      return;
    }

    const restaurantPhones = [
      form.restaurantPhone,
      ...form.restaurantPhonesExtra
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ].filter(Boolean);

    const driverDocuments = Object.entries(driverDocs).map(
      ([type, fileUrl]) => ({
        type,
        fileUrl,
      }),
    );

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        address: form.address,
        role: form.role,
        lat: needsLocation ? location?.lat : undefined,
        lng: needsLocation ? location?.lng : undefined,
        restaurantName: form.restaurantName,
        restaurantPhone: form.restaurantPhone,
        restaurantPhones:
          form.role === "RECEPTIONIST" ? restaurantPhones : undefined,
        restaurantAbout: form.restaurantAbout,
        restaurantImages:
          form.role === "RECEPTIONIST" ? restaurantImages : undefined,
        vehiclePlate: form.vehiclePlate,
        vehicleType: form.vehicleType,
        driverDocuments: form.role === "DRIVER" ? driverDocuments : undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    const signInResult = await signIn("credentials", {
      email: form.email,
      password: form.password,
      role: form.role,
      redirect: false,
    });

    if (signInResult?.error) {
      setError(signInResult.error);
      return;
    }

    router.push(data.redirect || "/customer");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-12">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-2 text-stone-600">
          Already have one?{" "}
          <Link href="/login" className="text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />

          <div>
            <label className="block text-sm font-medium text-stone-700">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => {
                setForm({ ...form, role: e.target.value });
                setError("");
              }}
              className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {form.role === "CUSTOMER" && (
            <LocationPicker
              value={location}
              onChange={setLocation}
              address={form.address}
              onAddressChange={(address) => setForm({ ...form, address })}
              addressLabel="Delivery address"
              required
            />
          )}

          {form.role === "RECEPTIONIST" && (
            <div className="space-y-4">
              <Input
                label="Restaurant name"
                value={form.restaurantName}
                onChange={(e) =>
                  setForm({ ...form, restaurantName: e.target.value })
                }
                required
              />
              <Input
                label="Main restaurant phone"
                value={form.restaurantPhone}
                onChange={(e) =>
                  setForm({ ...form, restaurantPhone: e.target.value })
                }
              />
              <Input
                label="Other phone numbers"
                value={form.restaurantPhonesExtra}
                onChange={(e) =>
                  setForm({
                    ...form,
                    restaurantPhonesExtra: e.target.value,
                  })
                }
                placeholder="Separate with commas (e.g. 063..., 252...)"
              />
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  About your restaurant
                </label>
                <textarea
                  value={form.restaurantAbout}
                  onChange={(e) =>
                    setForm({ ...form, restaurantAbout: e.target.value })
                  }
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm"
                  placeholder="Tell customers about your food, hours, specialties..."
                />
              </div>
              <Input
                label="Restaurant photos (gallery)"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach((file, i) => {
                    void handleFile(
                      file,
                      "restaurant-gallery",
                      `img-${i}`,
                      (url) => setRestaurantImages((prev) => [...prev, url]),
                    );
                  });
                }}
              />
              {restaurantImages.length > 0 && (
                <p className="text-xs text-stone-500">
                  {restaurantImages.length} photo(s) uploaded
                </p>
              )}
              <LocationPicker
                value={location}
                onChange={setLocation}
                address={form.address}
                onAddressChange={(address) => setForm({ ...form, address })}
                addressLabel="Restaurant address"
                required
              />
            </div>
          )}

          {form.role === "DRIVER" && (
            <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                Upload your documents. An admin will review and approve your
                account before you can deliver.
              </p>
              {DRIVER_DOC_TYPES.map((type) => (
                <div key={type}>
                  <Input
                    label={`${type}${type !== "Passport" ? " *" : " (optional)"}`}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        void handleFile(file, "driver-docs", type, (url) =>
                          setDriverDocs((d) => ({ ...d, [type]: url })),
                        );
                    }}
                  />
                  {driverDocs[type] && (
                    <p className="mt-1 text-xs text-green-700">Uploaded</p>
                  )}
                </div>
              ))}
              <Input
                label="Vehicle plate number *"
                value={form.vehiclePlate}
                onChange={(e) =>
                  setForm({ ...form, vehiclePlate: e.target.value })
                }
                required
              />
              <Input
                label="Vehicle type *"
                value={form.vehicleType}
                onChange={(e) =>
                  setForm({ ...form, vehicleType: e.target.value })
                }
                placeholder="e.g. Motorcycle, Toyota Corolla"
                required
              />
            </div>
          )}

          {uploading && (
            <p className="text-sm text-stone-500">Uploading {uploading}...</p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
