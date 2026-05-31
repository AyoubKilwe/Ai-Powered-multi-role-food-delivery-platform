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
  customerNameSnapshot?: string | null;
  customerPhoneSnapshot?: string | null;
  table: { tableNumber: number; capacity: number } | null;
}

function normalizeStatus(status?: string | null) {
  return status && status !== "Unknown" ? status : "PENDING";
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
        <article key={b.id} className="rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-lg">
                  {b.customer?.name || b.customerNameSnapshot || "Guest"}
                </p>
                <Badge status={normalizeStatus(b.status)} />
              </div>
              <p className="text-sm text-stone-500">
                Phone: {b.customer?.phone || b.customerPhoneSnapshot || "Not provided"}
              </p>
              <p className="text-sm text-stone-600">
                {new Date(b.date).toLocaleDateString()} — {b.timeSlot}
              </p>
              <p className="text-sm text-stone-500">
                {b.guests} guests {b.table ? `• Table ${b.table.tableNumber} (${b.table.capacity} seats)` : "• Any available table"}
              </p>
            </div>
            {(b.customer?.phone || b.customerPhoneSnapshot) && (
              <a
                href={`tel:${b.customer?.phone || b.customerPhoneSnapshot}`}
                className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Call customer
              </a>
            )}
          </div>
          {normalizeStatus(b.status) === "PENDING" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => updateStatus(b.id, "CONFIRMED") }>
                Accept booking
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => updateStatus(b.id, "CANCELLED")}
              >
                Decline
              </Button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
