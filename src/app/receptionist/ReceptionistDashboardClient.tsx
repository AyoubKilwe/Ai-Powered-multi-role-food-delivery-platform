"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChefHat,
  PackageCheck,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export default function ReceptionistDashboardClient() {
  type DashboardOrder = {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    restaurant?: { name?: string } | null;
    items?: {
      quantity: number;
      menuItem?: { name?: string; image?: string };
    }[];
    customer: { name: string; phone: string | null };
  };

  const [data, setData] = useState<{
    restaurant: {
      name: string;
      orders: DashboardOrder[];
      bookingCount: number;
    };
    sales: { daily: { revenue: number; orders: number } };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const prevOrderIdsRef = useRef<string[]>([]);

  const playAlert = () => {
    try {
      const AudioCtx = window.AudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.04;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.18);
      oscillator.onended = () => ctx.close();
    } catch {
      // ignore sound failures
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/receptionist?view=dashboard");
        const payload = await res.json();

        if (cancelled) return;

        if (!res.ok || payload?.error) {
          setData(null);
          setError(payload?.error || "Unable to load receptionist dashboard.");
          return;
        }

        const nextOrders = (payload?.restaurant?.orders || []) as DashboardOrder[];
        const nextIds = nextOrders.map((o) => o.id);
        const prevIds = prevOrderIdsRef.current;
        if (
          prevIds.length > 0 &&
          nextIds.some((id: string) => !prevIds.includes(id)) &&
          document.visibilityState === "visible"
        ) {
          playAlert();
        }
        prevOrderIdsRef.current = nextIds;

        setData(payload);
      } catch {
        if (!cancelled) {
          setData(null);
          setError("Unable to load receptionist dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const interval = setInterval(load, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const summary = useMemo(() => {
    if (!data) return null;

    const pending = data.restaurant.orders.filter(
      (o) => o.status === "PENDING",
    );
    const active = data.restaurant.orders.filter((o) =>
      ["ACCEPTED", "COOKING", "READY"].includes(o.status),
    );
    const delivered = data.restaurant.orders.filter(
      (o) => o.status === "DELIVERED",
    );

    return { pending, active, delivered };
  }, [data]);

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="animate-pulse rounded-3xl bg-stone-200 p-8">
          <div className="h-5 w-40 rounded bg-stone-300" />
          <div className="mt-4 h-10 w-72 rounded bg-stone-300" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-stone-300" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-3xl bg-white shadow-sm"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800">
        <h2 className="text-2xl font-bold">
          Receptionist dashboard unavailable
        </h2>
        <p className="mt-2 text-sm">
          {error || "We could not load your restaurant dashboard right now."}
        </p>
        <p className="mt-4 text-sm text-red-700/80">
          Make sure your account is linked to a restaurant and refresh the page.
        </p>
      </section>
    );
  }

  const pending = summary?.pending ?? [];
  const active = summary?.active ?? [];
  const delivered = summary?.delivered ?? [];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-linear-to-r from-brand-700 via-brand-600 to-amber-500 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              <UtensilsCrossed className="h-4 w-4" />
              Restaurant control center
            </div>
            <h2 className="text-3xl font-black sm:text-5xl">
              {data.restaurant.name}
            </h2>
            <p className="max-w-xl text-sm text-orange-50/90 sm:text-base">
              Manage live orders, bookings, and menu changes from one clean
              dashboard.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-lg">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-orange-100">
                Today&apos;s revenue
              </p>
              <p className="mt-2 text-2xl font-black">
                {formatCurrency(data.sales.daily.revenue)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-orange-100">
                Orders today
              </p>
              <p className="mt-2 text-2xl font-black">
                {data.sales.daily.orders}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-orange-100">
                Bookings
              </p>
              <p className="mt-2 text-2xl font-black">
                {data.restaurant.bookingCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-amber-100 bg-amber-50/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Pending orders</p>
              <p className="mt-1 text-3xl font-black text-amber-700">
                {pending.length}
              </p>
            </div>
            <Bell className="h-6 w-6 text-amber-600" />
          </div>
        </Card>
        <Card className="border-blue-100 bg-blue-50/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Active kitchen</p>
              <p className="mt-1 text-3xl font-black text-blue-700">
                {active.length}
              </p>
            </div>
            <ChefHat className="h-6 w-6 text-blue-600" />
          </div>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Completed orders</p>
              <p className="mt-1 text-3xl font-black text-emerald-700">
                {delivered.length}
              </p>
            </div>
            <PackageCheck className="h-6 w-6 text-emerald-600" />
          </div>
        </Card>
        <Card className="border-violet-100 bg-violet-50/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Bookings</p>
              <p className="mt-1 text-3xl font-black text-violet-700">
                {data.restaurant.bookingCount}
              </p>
            </div>
            <CalendarDays className="h-6 w-6 text-violet-600" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <Card title="Recent orders" subtitle="Live feed from your restaurant">
          <div className="space-y-3">
            {data.restaurant.orders.slice(0, 6).map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-white shadow-sm">
                    {o.items?.[0]?.menuItem?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={o.items[0].menuItem.image}
                        alt={o.items[0].menuItem.name || "Food"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-stone-400">
                        IMG
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-stone-900">
                        {o.orderNumber}
                      </p>
                      <Badge status={o.status} />
                    </div>
                    <p className="mt-1 text-sm text-stone-500">
                      {o.restaurant?.name || "Unknown restaurant"}
                      {o.items?.[0]?.menuItem?.name
                        ? ` • ${o.items[0].menuItem.name}`
                        : ""}
                    </p>
                    <p className="text-xs text-stone-400">
                      {o.customer?.name ?? "Guest"}
                      {o.customer?.phone ? ` • ${o.customer.phone}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-stone-900">
                    {formatCurrency(o.total)}
                  </p>
                  <p className="text-xs text-stone-500">
                    Tap Orders to update status
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Quick actions" subtitle="Jump to the pages you use most">
            <div className="space-y-3">
              <Link
                href="/receptionist/orders"
                className="flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-brand-700 hover:bg-brand-100"
              >
                <span className="font-semibold">Manage orders</span>
                <TrendingUp className="h-4 w-4" />
              </Link>
              <Link
                href="/receptionist/menu"
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-700 hover:bg-stone-50"
              >
                <span className="font-semibold">Edit menu</span>
                <UtensilsCrossed className="h-4 w-4" />
              </Link>
              <Link
                href="/receptionist/profile"
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-700 hover:bg-stone-50"
              >
                <span className="font-semibold">Restaurant profile</span>
                <ChefHat className="h-4 w-4" />
              </Link>
            </div>
          </Card>

          <Card title="Operational note">
            <p className="text-sm text-stone-600">
              New customer orders appear here immediately and are also visible
              on the live orders page. Keep this tab open during busy hours.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
