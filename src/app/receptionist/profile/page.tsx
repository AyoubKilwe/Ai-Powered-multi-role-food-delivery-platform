"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function ProfilePage() {
  const [account, setAccount] = useState({ name: "", phone: "" });
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    phonesExtra: "",
    about: "",
    images: [] as string[],
    address: "",
    lat: 9.934,
    lng: 43.181,
  });
  const [tables, setTables] = useState<
    { id: string; tableNumber: number; capacity: number }[]
  >([]);
  const [timeSlots, setTimeSlots] = useState<
    { id: string; label: string; capacity: number }[]
  >([]);
  const [newTable, setNewTable] = useState({ tableNumber: "", capacity: "" });
  const [newSlot, setNewSlot] = useState({ start: "", end: "", capacity: "" });
  const [locating, setLocating] = useState(false);

  async function refreshProfile() {
    const d = await fetch("/api/receptionist?view=profile").then((r) =>
      r.json(),
    );
    const phones: string[] = d.restaurant.phones || [];
    const main = d.restaurant.phone || phones[0] || "";
    const extra = phones.filter((p: string) => p !== main);
    setProfile({
      name: d.restaurant.name,
      phone: main,
      phonesExtra: extra.join(", "),
      about: d.restaurant.description || "",
      images: d.restaurant.images || [],
      address: d.restaurant.address,
      lat: d.restaurant.lat,
      lng: d.restaurant.lng,
    });
    setTables(d.restaurant.tables || []);
    setTimeSlots(d.restaurant.timeSlots || []);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/user"),
      fetch("/api/receptionist?view=profile"),
    ]).then(async ([uRes, rRes]) => {
      const u = await uRes.json();
      const d = await rRes.json();
      setAccount({ name: u.name || "", phone: u.phone || "" });
      const phones: string[] = d.restaurant.phones || [];
      const main = d.restaurant.phone || phones[0] || "";
      const extra = phones.filter((p: string) => p !== main);
      setProfile({
        name: d.restaurant.name,
        phone: main,
        phonesExtra: extra.join(", "),
        about: d.restaurant.description || "",
        images: d.restaurant.images || [],
        address: d.restaurant.address,
        lat: d.restaurant.lat,
        lng: d.restaurant.lng,
      });
      setTables(d.restaurant.tables);
      setTimeSlots(d.restaurant.timeSlots || []);
    });
  }, []);

  async function uploadGallery(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads?folder=restaurant-gallery", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Upload failed");
      return;
    }
    setProfile((p) => ({ ...p, images: [...p.images, data.url] }));
  }

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
    });
    alert("Your account details saved");
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const phones = [
      profile.phone,
      ...profile.phonesExtra
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ].filter(Boolean);
    await fetch("/api/receptionist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: {
          name: profile.name,
          phone: phones[0] || profile.phone,
          phones,
          description: profile.about,
          images: profile.images,
          address: profile.address,
          lat: profile.lat,
          lng: profile.lng,
        },
      }),
    });
    alert("Restaurant profile updated");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Your browser does not support GPS location.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProfile((p) => ({
          ...p,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert(
          "Unable to capture location. Please allow GPS access and try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/receptionist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: {
          tableNumber: parseInt(newTable.tableNumber),
          capacity: parseInt(newTable.capacity),
        },
      }),
    });
    setNewTable({ tableNumber: "", capacity: "" });
    await refreshProfile();
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card title="Your account">
        <form onSubmit={saveAccount} className="space-y-3">
          <Input
            label="Your name (receptionist)"
            value={account.name}
            onChange={(e) => setAccount({ ...account, name: e.target.value })}
          />
          <Input
            label="Your phone"
            value={account.phone}
            onChange={(e) => setAccount({ ...account, phone: e.target.value })}
          />
          <Button type="submit">Save account</Button>
        </form>
      </Card>
      <Card title="Restaurant profile (visible to customers)">
        <form onSubmit={saveProfile} className="space-y-3">
          <Input
            label="Name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
          <Input
            label="Main phone"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />
          <Input
            label="Other phone numbers"
            value={profile.phonesExtra}
            onChange={(e) =>
              setProfile({ ...profile, phonesExtra: e.target.value })
            }
            placeholder="Comma-separated"
          />
          <div>
            <label className="block text-sm font-medium text-stone-700">
              About the restaurant
            </label>
            <textarea
              value={profile.about}
              onChange={(e) =>
                setProfile({ ...profile, about: e.target.value })
              }
              rows={4}
              className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm"
            />
          </div>
          <Input
            label="Gallery photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              Array.from(e.target.files || []).forEach((file) => {
                void uploadGallery(file);
              });
            }}
          />
          {profile.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.images.map((src) => (
                <div
                  key={src}
                  className="relative h-16 w-16 overflow-hidden rounded-lg border"
                >
                  <Image src={src} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
          <Input
            label="Address"
            value={profile.address}
            onChange={(e) =>
              setProfile({ ...profile, address: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="GPS Lat"
              type="number"
              step="0.0001"
              value={profile.lat}
              onChange={(e) =>
                setProfile({ ...profile, lat: parseFloat(e.target.value) })
              }
            />
            <Input
              label="GPS Lng"
              type="number"
              step="0.0001"
              value={profile.lng}
              onChange={(e) =>
                setProfile({ ...profile, lng: parseFloat(e.target.value) })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
            <span>Use your current GPS location for the restaurant pin.</span>
            <Button
              type="button"
              variant="outline"
              onClick={useCurrentLocation}
              disabled={locating}
            >
              {locating ? "Detecting..." : "Use GPS"}
            </Button>
          </div>
          <Button type="submit">Save profile</Button>
        </form>
      </Card>
      <Card title="Dine-in tables">
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {tables.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm"
            >
              <p className="font-semibold text-stone-900">
                Table {t.tableNumber}
              </p>
              <p className="text-stone-600">{t.capacity} seats</p>
            </div>
          ))}
        </div>
        <form onSubmit={addTable} className="grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="Table #"
            value={newTable.tableNumber}
            onChange={(e) =>
              setNewTable({ ...newTable, tableNumber: e.target.value })
            }
          />
          <Input
            placeholder="Capacity"
            value={newTable.capacity}
            onChange={(e) =>
              setNewTable({ ...newTable, capacity: e.target.value })
            }
          />
          <Button type="submit">Add</Button>
        </form>
      </Card>
      <Card title="Booking time slots">
        <ul className="mb-4 space-y-2">
          {timeSlots.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm"
            >
              <span>
                {slot.label} — up to {slot.capacity} guests
              </span>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  await fetch("/api/receptionist", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      timeSlot: { action: "delete", id: slot.id },
                    }),
                  });
                  await refreshProfile();
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/receptionist", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                timeSlot: {
                  action: "create",
                  start: newSlot.start,
                  end: newSlot.end,
                  capacity: parseInt(newSlot.capacity),
                },
              }),
            });
            setNewSlot({ start: "", end: "", capacity: "" });
            await refreshProfile();
          }}
          className="grid gap-2 sm:grid-cols-4"
        >
          <Input
            placeholder="Start (e.g. 12:00)"
            value={newSlot.start}
            onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })}
          />
          <Input
            placeholder="End (e.g. 14:00)"
            value={newSlot.end}
            onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })}
          />
          <Input
            placeholder="Capacity"
            value={newSlot.capacity}
            onChange={(e) =>
              setNewSlot({ ...newSlot, capacity: e.target.value })
            }
          />
          <Button type="submit">Add slot</Button>
        </form>
      </Card>
    </section>
  );
}
