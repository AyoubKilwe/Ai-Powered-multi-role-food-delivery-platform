"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<
    { id: string; type: string; fileUrl: string; verified: boolean }[]
  >([]);
  const [vehicle, setVehicle] = useState({ plate: "", type: "" });

  useEffect(() => {
    Promise.all([fetch("/api/driver?view=documents"), fetch("/api/user")]).then(
      async ([dRes, uRes]) => {
        const d = await dRes.json();
        const u = await uRes.json();
        setDocs(d.documents);
        setVehicle({
          plate: u.vehiclePlate || "",
          type: u.vehicleType || "",
        });
      },
    );
  }, []);

  return (
    <section className="space-y-6">
      <Card
        title="Identity verification"
        subtitle="Admin reviews your files before you can deliver"
      >
        <p className="mb-4 text-sm text-stone-600">
          <Link
            href="/driver/profile"
            className="text-brand-600 hover:underline"
          >
            Update profile & upload documents
          </Link>
        </p>
        <p className="mb-4 text-sm">
          Vehicle: {vehicle.type || "—"} · Plate: {vehicle.plate || "—"}
        </p>
        {docs.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between border-b py-3"
          >
            <div>
              <p className="font-medium">{d.type}</p>
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:underline"
              >
                View file
              </a>
            </div>
            <Badge status={d.verified ? "ACTIVE" : "PENDING"} />
          </div>
        ))}
        {!docs.length && (
          <p className="text-sm text-stone-500">No documents on file yet.</p>
        )}
      </Card>
    </section>
  );
}
