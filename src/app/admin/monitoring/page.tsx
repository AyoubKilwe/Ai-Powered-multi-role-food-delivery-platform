"use client";

import { Card } from "@/components/ui/Card";
import { Activity, Server, Zap } from "lucide-react";

export default function MonitoringPage() {
  const metrics = [
    { label: "System uptime", value: "99.95%", icon: Server, status: "healthy" },
    { label: "Avg page load", value: "1.8s", icon: Zap, status: "healthy" },
    { label: "Active sessions", value: "24", icon: Activity, status: "healthy" },
    { label: "Orders/hour (Borama)", value: "12", icon: Activity, status: "normal" },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">Platform monitoring</h2>
      <p className="text-stone-600">Operational health for Borama region</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.map((m) => (
          <Card key={m.label}>
            <div className="flex items-center gap-3">
              <m.icon className="h-8 w-8 text-brand-600" />
              <div>
                <p className="text-sm text-stone-500">{m.label}</p>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-green-600 capitalize">{m.status}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card title="Borama operations" subtitle="No critical bottlenecks detected">
        <ul className="space-y-2 text-sm text-stone-600">
          <li>✓ Real-time order updates: operational</li>
          <li>✓ Driver GPS tracking: operational</li>
          <li>✓ Database backups: scheduled daily</li>
          <li>✓ SSL/HTTPS: enabled in production</li>
        </ul>
      </Card>
    </section>
  );
}
