"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Booking {
  id: string;
  date: string;
  timeSlot: string;
  guests: number;
  status: string;
  customer: { name: string; phone: string | null };
  table: { tableNumber: number; capacity: number } | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = () =>
    fetch("/api/receptionist?view=bookings")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings));
  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    function onVisibility() {
      if (document.visibilityState === "visible") load();
    }
    function onFocus() {
      load();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Table reservations</h2>
      {bookings.map((b) => (
        <article key={b.id} className="rounded-xl border bg-white p-4">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">{b.customer?.name ?? "Guest"}</p>
              <p className="text-sm">
                {new Date(b.date).toLocaleDateString()} — {b.timeSlot}
              </p>
              <p className="text-sm text-stone-500">
                {b.guests} guests {b.table && `• Table ${b.table.tableNumber}`}
              </p>
            </div>
            <Badge status={b.status} />
          </div>
          {b.status === "PENDING" && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => updateStatus(b.id, "CONFIRMED")}>
                Confirm
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => updateStatus(b.id, "CANCELLED")}
              >
                Cancel
              </Button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
