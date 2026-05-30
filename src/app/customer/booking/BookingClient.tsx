"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Restaurant {
  id: string;
  name: string;
}

interface TimeSlot {
  id: string;
  label: string;
  capacity: number;
}

interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
}

export default function BookingClient() {
  const searchParams = useSearchParams();
  const preselectedRestaurantId = searchParams?.get("restaurantId") ?? "";
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [form, setForm] = useState({
    restaurantId: preselectedRestaurantId,
    date: "",
    timeSlot: "",
    guests: "2",
    tableId: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/restaurants")
      .then((r) => r.json())
      .then(setRestaurants);
  }, []);

  useEffect(() => {
    if (!form.restaurantId) {
      setSlots([]);
      setTables([]);
      setForm((f) => ({ ...f, timeSlot: "", tableId: "" }));
      return;
    }
    fetch(`/api/restaurants/${form.restaurantId}`)
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.timeSlots || []);
        setTables(d.tables || []);
        setForm((f) => ({
          ...f,
          timeSlot: d.timeSlots?.[0]?.label || "",
          tableId: d.tables?.[0]?.id || "",
        }));
      });
  }, [form.restaurantId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg("Booking submitted! Restaurant will confirm soon.");
      setForm({ ...form, date: "" });
    } else {
      setMsg("Booking failed");
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h2 className="text-xl font-bold">Book a table</h2>
      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border bg-white p-6"
      >
        <div>
          <label className="text-sm font-medium">Restaurant</label>
          <select
            required
            value={form.restaurantId}
            onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}
            className="mt-1 w-full rounded-xl border px-3 py-2.5"
          >
            <option value="">Select restaurant</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Date"
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <div>
          <label className="text-sm font-medium">Time slot</label>
          <select
            value={form.timeSlot}
            onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
            className="mt-1 w-full rounded-xl border px-3 py-2.5"
            required
          >
            <option value="">Select time slot</option>
            {slots.length ? (
              slots.map((slot) => (
                <option key={slot.id} value={slot.label}>
                  {slot.label} (up to {slot.capacity})
                </option>
              ))
            ) : (
              <>
                <option value="12:00 - 14:00">12:00 - 14:00</option>
                <option value="18:00 - 21:00">18:00 - 21:00</option>
              </>
            )}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">
            Preferred table (optional)
          </label>
          <select
            value={form.tableId}
            onChange={(e) => setForm({ ...form, tableId: e.target.value })}
            className="mt-1 w-full rounded-xl border px-3 py-2.5"
          >
            <option value="">Any available table</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                Table {table.tableNumber} ({table.capacity} seats)
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Guests"
          type="number"
          min={1}
          max={12}
          value={form.guests}
          onChange={(e) => setForm({ ...form, guests: e.target.value })}
        />
        {msg && <p className="text-sm text-brand-600">{msg}</p>}
        <Button type="submit" className="w-full">
          Reserve table
        </Button>
      </form>
    </section>
  );
}
