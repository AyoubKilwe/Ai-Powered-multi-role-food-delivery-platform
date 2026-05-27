"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldAlert, CircleCheckBig, FileWarning } from "lucide-react";

export default function DisputesPage() {
  const [orders, setOrders] = useState<
    { id: string; orderNumber: string; status: string }[]
  >([]);
  const [disputes, setDisputes] = useState<
    {
      id: string;
      reason: string;
      status: string;
      order: { orderNumber: string };
    }[]
  >([]);
  const [form, setForm] = useState({ orderId: "", reason: "", resolution: "" });

  const load = () =>
    fetch("/api/admin?view=disputes")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders);
        setDisputes(d.disputes);
      });
  useEffect(() => {
    load();
  }, []);

  async function createDispute(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dispute", ...form }),
    });
    setForm({ orderId: "", reason: "", resolution: "" });
    load();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-linear-to-r from-stone-950 via-brand-800 to-orange-600 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
              Resolution center
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              Dispute resolution
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Track customer complaints and record resolutions from one place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[18rem]">
            {[
              { label: "Open", icon: ShieldAlert },
              { label: "Resolved", icon: CircleCheckBig },
              { label: "Cases", icon: FileWarning },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <item.icon className="h-4 w-4 text-white/80" />
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/70">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form
        onSubmit={createDispute}
        className="max-w-xl space-y-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <select
          required
          value={form.orderId}
          onChange={(e) => setForm({ ...form, orderId: e.target.value })}
          className="w-full rounded-xl border px-3 py-2"
        >
          <option value="">Select order</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.orderNumber} — {o.status}
            </option>
          ))}
        </select>
        <Input
          label="Reason"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          required
        />
        <Input
          label="Resolution"
          value={form.resolution}
          onChange={(e) => setForm({ ...form, resolution: e.target.value })}
        />
        <Button type="submit">Log dispute</Button>
      </form>
      <div className="grid gap-4 lg:grid-cols-2">
        {disputes.map((d) => (
          <article
            key={d.id}
            className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <p className="font-semibold text-stone-900">
              {d.order.orderNumber}
            </p>
            <p className="mt-2 text-sm text-stone-600">{d.reason}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Status: {d.status}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
