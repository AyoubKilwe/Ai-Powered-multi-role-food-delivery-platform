"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";

interface Transaction {
  id: string;
  total: number;
  restaurantPayout: number;
  driverFee: number;
  platformFee: number;
  serviceTax: number;
  createdAt: string;
  order: { orderNumber: string };
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    tax: 0,
    restaurant: 0,
    driver: 0,
    platform: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin?view=finance")
      .then((r) => r.json())
      .then((d) => {
        setTransactions(d.transactions);
        const totals = d.transactions.reduce(
          (acc: typeof summary, t: Transaction) => ({
            total: acc.total + t.total,
            tax: acc.tax + t.serviceTax,
            restaurant: acc.restaurant + t.restaurantPayout,
            driver: acc.driver + t.driverFee,
            platform: acc.platform + t.platformFee,
          }),
          { total: 0, tax: 0, restaurant: 0, driver: 0, platform: 0 },
        );
        setSummary(totals);
        setLoading(false);
      });
  }, []);

  const chartData = useMemo(
    () =>
      transactions.slice(0, 10).map((t) => ({
        label: new Date(t.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        total: t.total,
        restaurant: t.restaurantPayout,
        driver: t.driverFee,
        platform: t.platformFee,
      })),
    [transactions],
  );

  const allocation = [
    { name: "Restaurant", value: summary.restaurant },
    { name: "Driver", value: summary.driver },
    { name: "Platform", value: summary.platform },
    { name: "Tax", value: summary.tax },
  ].filter((item) => item.value > 0);

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="animate-pulse rounded-3xl bg-stone-200 p-8">
          <div className="h-5 w-40 rounded bg-stone-300" />
          <div className="mt-4 h-10 w-72 rounded bg-stone-300" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-linear-to-r from-stone-950 via-brand-800 to-orange-600 p-6 text-white shadow-2xl sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              <Wallet className="h-4 w-4" />
              Finance overview
            </div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Financial & commission engine
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
              Automatic calculation: service tax, restaurant payout, platform
              fee, and driver commission.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-136">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                Gross sales
              </p>
              <p className="mt-2 text-2xl font-black">
                {formatCurrency(summary.total)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                Platform fee
              </p>
              <p className="mt-2 text-2xl font-black">
                {formatCurrency(summary.platform)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                Driver fees
              </p>
              <p className="mt-2 text-2xl font-black">
                {formatCurrency(summary.driver)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Gross sales</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.total)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Service tax</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.tax)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Restaurant payout</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.restaurant)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Driver fees</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.driver)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Platform fee</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.platform)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card title="Cash flow trend" subtitle="Recent transaction performance">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="financeFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#f97316"
                  fill="url(#financeFlow)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="platform"
                  stroke="#7c3aed"
                  fillOpacity={0}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Payout split" subtitle="Where the money goes">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocation}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {allocation.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        ["#f97316", "#0ea5e9", "#8b5cf6", "#22c55e"][index % 4]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-stone-900">
          Recent transactions
        </h3>
        {transactions.map((t) => (
          <article
            key={t.id}
            className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-stone-900">
                  {t.order.orderNumber}
                </p>
                <p className="text-xs text-stone-500">
                  {new Date(t.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="text-lg font-black text-brand-600">
                {formatCurrency(t.total)}
              </p>
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
              <span className="rounded-xl bg-stone-50 px-3 py-2">
                Tax: {formatCurrency(t.serviceTax)}
              </span>
              <span className="rounded-xl bg-stone-50 px-3 py-2">
                Restaurant: {formatCurrency(t.restaurantPayout)}
              </span>
              <span className="rounded-xl bg-stone-50 px-3 py-2">
                Driver: {formatCurrency(t.driverFee)}
              </span>
              <span className="rounded-xl bg-stone-50 px-3 py-2">
                Platform: {formatCurrency(t.platformFee)}
              </span>
              <span className="rounded-xl bg-stone-50 px-3 py-2">
                Gross: {formatCurrency(t.total)}
              </span>
            </div>
          </article>
        ))}
        {transactions.length === 0 && (
          <p className="text-stone-500">No transactions yet.</p>
        )}
      </div>
    </section>
  );
}
