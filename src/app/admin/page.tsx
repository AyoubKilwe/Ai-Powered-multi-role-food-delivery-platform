"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  ShoppingBag,
  DollarSign,
  Truck,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Store,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#f97316", "#fb923c", "#ea580c", "#fdba74"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalOrders: number;
    activeUsers: number;
    totalRevenue: number;
    pendingDrivers: number;
    totalRestaurants: number;
    deliveredOrders: number;
    pendingOrders: number;
    openDisputes: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin?view=dashboard")
      .then((r) => r.json())
      .then((d) => setStats(d.stats));
  }, []);

  const dashboardCharts = useMemo(() => {
    if (!stats) return null;

    return {
      orderBreakdown: [
        { name: "Delivered", value: stats.deliveredOrders },
        { name: "Pending", value: stats.pendingOrders },
        {
          name: "In Progress",
          value: Math.max(
            stats.totalOrders - stats.deliveredOrders - stats.pendingOrders,
            0,
          ),
        },
      ].filter((item) => item.value > 0),
      ecosystem: [
        { name: "Customers & staff", value: stats.activeUsers },
        { name: "Restaurants", value: stats.totalRestaurants },
        { name: "Drivers", value: stats.pendingDrivers },
        { name: "Orders", value: stats.totalOrders },
      ],
      momentum: [
        { label: "Orders", value: stats.totalOrders },
        { label: "Delivered", value: stats.deliveredOrders },
        { label: "Pending", value: stats.pendingOrders },
        { label: "Disputes", value: stats.openDisputes },
      ],
    };
  }, [stats]);

  if (!stats || !dashboardCharts) {
    return (
      <section className="space-y-6">
        <div className="animate-pulse rounded-3xl bg-stone-200 p-8">
          <div className="h-5 w-40 rounded bg-stone-300" />
          <div className="mt-4 h-10 w-72 rounded bg-stone-300" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-stone-300" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-3xl bg-white shadow-sm"
            />
          ))}
        </div>
      </section>
    );
  }

  const kpis = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag },
    { label: "Active Users", value: stats.activeUsers, icon: Users },
    {
      label: "Platform Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
    },
    { label: "Pending Drivers", value: stats.pendingDrivers, icon: Truck },
    { label: "Restaurants", value: stats.totalRestaurants, icon: ShoppingBag },
    {
      label: "Delivered Orders",
      value: stats.deliveredOrders,
      icon: CheckCircle2,
    },
    { label: "Pending Orders", value: stats.pendingOrders, icon: Truck },
    { label: "Open Disputes", value: stats.openDisputes, icon: ShieldAlert },
  ];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-linear-to-r from-stone-950 via-brand-800 to-orange-600 p-6 text-white shadow-2xl shadow-brand-700/15 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              <Activity className="h-4 w-4" />
              Platform command center
            </div>
            <h2 className="text-3xl font-black sm:text-5xl">
              Global dashboard
            </h2>
            <p className="max-w-2xl text-sm text-white/80 sm:text-base">
              Real-time KPIs, approvals, disputes, finance, and platform health
              for Borama Food Delivery.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:w-full">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                Revenue
              </p>
              <p className="mt-2 text-2xl font-black">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                Restaurants
              </p>
              <p className="mt-2 text-2xl font-black">
                {stats.totalRestaurants}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                Open disputes
              </p>
              <p className="mt-2 text-2xl font-black">{stats.openDisputes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card
            key={k.label}
            className="border-stone-200 bg-white shadow-md shadow-stone-200/40 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand-100 to-orange-100 text-brand-700 shadow-inner">
                <k.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-stone-500">{k.label}</p>
                <p className="text-2xl font-bold">{k.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card
          title="Order momentum"
          subtitle="Breakdown of platform order flow"
          className="border-stone-200 bg-white shadow-sm"
        >
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardCharts.momentum}>
                <defs>
                  <linearGradient id="orderFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ea580c"
                  fill="url(#orderFlow)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Order status"
          subtitle="Delivered vs pending vs active"
          className="border-stone-200 bg-white shadow-sm"
        >
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardCharts.orderBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {dashboardCharts.orderBreakdown.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card
          title="Platform ecosystem"
          subtitle="People and restaurants in the system"
          className="border-stone-200 bg-white shadow-sm"
        >
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardCharts.ecosystem}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Bar dataKey="value" fill="#f97316" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-4">
          <Card
            title="Quick platform health"
            subtitle="At a glance operational checks"
            className="border-stone-200 bg-white shadow-sm"
          >
            <div className="space-y-3">
              {[
                ["Drivers pending approval", stats.pendingDrivers],
                ["Orders pending", stats.pendingOrders],
                ["Delivered orders", stats.deliveredOrders],
                ["Active users", stats.activeUsers],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3"
                >
                  <span className="text-sm text-stone-600">{label}</span>
                  <span className="font-bold text-stone-900">
                    {value as number}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Next actions"
            subtitle="Where admin usually goes next"
            className="border-stone-200 bg-white shadow-sm"
          >
            <div className="space-y-3 text-sm">
              {[
                ["Approve pending drivers", "/admin/users"],
                ["Review disputes", "/admin/disputes"],
                ["Inspect finance reports", "/admin/finance"],
                ["Monitor platform health", "/admin/monitoring"],
              ].map(([label, href]) => (
                <a
                  key={label as string}
                  href={href as string}
                  className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-700 transition hover:border-brand-200 hover:bg-brand-50"
                >
                  <span className="font-medium">{label}</span>
                  <ArrowUpRight className="h-4 w-4 text-brand-600" />
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
