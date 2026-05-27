"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { uploadFile } from "@/lib/upload-client";

const DOC_TYPES = ["Driving License", "National ID", "Passport"] as const;

export default function DriverProfilePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    vehiclePlate: "",
    vehicleType: "",
    status: "",
  });
  const [docs, setDocs] = useState<
    { id: string; type: string; fileUrl: string; verified: boolean }[]
  >([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function load() {
    Promise.all([fetch("/api/user"), fetch("/api/driver")]).then(
      async ([uRes, dRes]) => {
        const u = await uRes.json();
        const d = await dRes.json();
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          vehiclePlate: u.vehiclePlate || "",
          vehicleType: u.vehicleType || "",
          status: u.status || "",
        });
        setDocs(d.documents || []);
      },
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        vehiclePlate: form.vehiclePlate,
        vehicleType: form.vehicleType,
      }),
    });
    if (res.ok) {
      setSaved(true);
      load();
    }
  }

  async function uploadDoc(type: string, file: File) {
    setUploading(type);
    const { url, error } = await uploadFile(file, "driver-docs");
    setUploading(null);
    if (error || !url) {
      alert(error || "Upload failed");
      return;
    }
    await fetch("/api/driver", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document: { type, fileUrl: url } }),
    });
    load();
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card title="My profile">
        <form onSubmit={saveProfile} className="space-y-3">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input label="Email" value={form.email} disabled />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Vehicle plate"
            value={form.vehiclePlate}
            onChange={(e) =>
              setForm({ ...form, vehiclePlate: e.target.value })
            }
          />
          <Input
            label="Vehicle type"
            value={form.vehicleType}
            onChange={(e) =>
              setForm({ ...form, vehicleType: e.target.value })
            }
          />
          <p className="text-sm text-stone-500">
            Account status: <Badge status={form.status} />
          </p>
          {saved && (
            <p className="text-sm text-green-600">Profile saved.</p>
          )}
          <Button type="submit">Save profile</Button>
        </form>
      </Card>

      <Card
        title="Documents"
        subtitle="Update files anytime. Admin must approve before you deliver."
      >
        <div className="space-y-4">
          {DOC_TYPES.map((type) => {
            const doc = docs.find((d) => d.type === type);
            return (
              <div key={type} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{type}</p>
                  {doc && (
                    <Badge status={doc.verified ? "ACTIVE" : "PENDING"} />
                  )}
                </div>
                {doc && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 hover:underline"
                  >
                    View uploaded file
                  </a>
                )}
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  className="mt-2"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadDoc(type, file);
                  }}
                />
                {uploading === type && (
                  <p className="text-xs text-stone-500 mt-1">Uploading...</p>
                )}
              </div>
            );
          })}
          <Link
            href="/driver/documents"
            className="text-sm text-brand-600 hover:underline"
          >
            View document list
          </Link>
        </div>
      </Card>
    </section>
  );
}
