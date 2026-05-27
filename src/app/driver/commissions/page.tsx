"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

export default function CommissionsPage() {
  const [data, setData] = useState<{
    commissions: { id: string; amount: number; createdAt: string }[];
    totalCommission: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/driver?view=commissions")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <section className="space-y-6">
      <Card title="Total earnings">
        <p className="text-4xl font-bold text-brand-600">
          {formatCurrency(data.totalCommission)}
        </p>
        <p className="text-sm text-stone-500">
          {data.commissions.length} completed deliveries
        </p>
      </Card>
      <h3 className="font-semibold">Commission history</h3>
      {data.commissions.map((c) => (
        <div
          key={c.id}
          className="flex justify-between rounded-xl border bg-white p-4"
        >
          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
          <span className="font-bold text-green-600">
            +{formatCurrency(c.amount)}
          </span>
        </div>
      ))}
    </section>
  );
}
