"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Bell, ChefHat, PackageCheck, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  restaurant?: { name?: string } | null;
  items?: { menuItem?: { name?: string; image?: string } }[];
  customer: { name?: string; phone?: string | null };
};

export default function ReceptionistDashboardClient() {
  type Sales = {
    daily: { revenue: number; orders: number; payout?: number; driverFee?: number; tax?: number; platformFee?: number };
    weekly: { revenue: number; orders: number; payout?: number; driverFee?: number; tax?: number; platformFee?: number };
    monthly: { revenue: number; orders: number; payout?: number; driverFee?: number; tax?: number; platformFee?: number };
  };

  const [data, setData] = useState<{ restaurant: { name: string; orders: Order[]; bookingCount: number }; sales: Sales } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist?view=dashboard");
      const payload = await res.json();
      if (res.ok && !payload?.error) setData(payload);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, []);

  async function updateOrderStatus(orderId: string, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void load();
  }

  if (loading || !data) {
    return <div className="p-6">Loading receptionist dashboard…</div>;
  }

  const pending = data.restaurant.orders.filter((o) => (o.status || "PENDING") === "PENDING");
  const active = data.restaurant.orders.filter((o) => ["ACCEPTED", "COOKING", "READY"].includes(o.status || ""));
  const delivered = data.restaurant.orders.filter((o) => (o.status || "") === "DELIVERED");

  return (
    <section className="space-y-6 p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Pending orders</p>
              <p className="mt-1 text-3xl font-black">{pending.length}</p>
            </div>
            <Bell className="h-6 w-6 text-amber-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Active kitchen</p>
              <p className="mt-1 text-3xl font-black">{active.length}</p>
            </div>
            <ChefHat className="h-6 w-6 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Completed orders</p>
              <p className="mt-1 text-3xl font-black">{delivered.length}</p>
            </div>
            <PackageCheck className="h-6 w-6 text-emerald-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Bookings</p>
              <p className="mt-1 text-3xl font-black">{data.restaurant.bookingCount}</p>
            </div>
            <CalendarDays className="h-6 w-6 text-violet-600" />
          </div>
        </Card>
      </div>

      <Card title="Recent orders" subtitle="Live feed from your restaurant">
        <div className="space-y-3">
          {data.restaurant.orders.slice(0, 10).map((o) => (
            <div key={o.id} className="rounded-2xl border bg-stone-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{o.orderNumber} <Badge status={o.status} /></p>
                  <p className="text-sm text-stone-500">{o.restaurant?.name} • {o.customer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(o.total)}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {o.status === "PENDING" && (
                  <>
                    <Button onClick={() => void updateOrderStatus(o.id, "ACCEPTED")}>Accept</Button>
                    <Button variant="danger" onClick={() => void updateOrderStatus(o.id, "DECLINED")}>Decline</Button>
                  </>
                )}
                {o.status === "ACCEPTED" && <Button onClick={() => void updateOrderStatus(o.id, "COOKING")}>Start cooking</Button>}
                {o.status === "COOKING" && <Button onClick={() => void updateOrderStatus(o.id, "READY")}>Mark ready</Button>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
