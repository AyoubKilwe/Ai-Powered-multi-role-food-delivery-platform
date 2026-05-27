"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

const SalesChart = dynamic(
  () => import("@/components/charts/SalesChart").then((m) => m.SalesChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-stone-500">
        Loading chart...
      </div>
    ),
  },
);

export default function ReportsPage() {
  const [sales, setSales] = useState<{
    daily: { revenue: number; orders: number };
    weekly: { revenue: number; orders: number };
    monthly: { revenue: number; orders: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/receptionist")
      .then((r) => r.json())
      .then((d) => setSales(d.sales));
  }, []);

  if (!sales) return <p>Loading...</p>;

  const chartData = [
    {
      period: "Daily",
      revenue: sales.daily.revenue,
      orders: sales.daily.orders,
    },
    {
      period: "Weekly",
      revenue: sales.weekly.revenue,
      orders: sales.weekly.orders,
    },
    {
      period: "Monthly",
      revenue: sales.monthly.revenue,
      orders: sales.monthly.orders,
    },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">Sales reports</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {chartData.map((s) => (
          <Card key={s.period} title={s.period}>
            <p className="text-2xl font-bold text-brand-600">
              {formatCurrency(s.revenue)}
            </p>
            <p className="text-sm text-stone-500">
              {s.orders} orders completed
            </p>
          </Card>
        ))}
      </div>
      <Card title="Revenue overview">
        <div className="h-64">
          <SalesChart data={chartData} />
        </div>
      </Card>
    </section>
  );
}
