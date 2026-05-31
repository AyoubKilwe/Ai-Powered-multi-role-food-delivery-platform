"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Users, Truck, Store, Shield, UserCheck, FileText } from "lucide-react";

interface DriverDoc {
  id: string;
  type: string;
  fileUrl: string;
  verified: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  driverDocuments?: DriverDoc[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [driverDocsByUserId, setDriverDocsByUserId] = useState<
    Record<string, DriverDoc[]>
  >({});
  const [loadingDriverDocs, setLoadingDriverDocs] = useState<string | null>(
    null,
  );

  const load = () =>
    fetch("/api/admin?view=users")
      .then((r) => r.json())
      .then((d) => {
        const nextUsers = Array.isArray(d.users) ? [...d.users] : [];
        nextUsers.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
        setUsers(nextUsers);
      });

  useEffect(() => {
    load();
  }, []);

  async function loadDriverDocs(userId: string) {
    if (driverDocsByUserId[userId] || loadingDriverDocs === userId) return;

    setLoadingDriverDocs(userId);
    try {
      const response = await fetch(
        `/api/admin?view=driver-docs&userId=${encodeURIComponent(userId)}`,
      );
      const data = await response.json();
      setDriverDocsByUserId((current) => ({
        ...current,
        [userId]: data.driverDocuments || [],
      }));
    } finally {
      setLoadingDriverDocs((current) => (current === userId ? null : current));
    }
  }

  async function setStatus(userId: string, status: string) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    });
    load();
  }

  async function deleteUser(userId: string) {
    if (!confirm("Delete this account permanently? This cannot be undone.")) {
      return;
    }

    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", userId }),
    });
    load();
  }

  const filtered =
    roleFilter === "ALL" ? users : users.filter((u) => u.role === roleFilter);

  const counts = useMemo(
    () => ({
      driver: users.filter((u) => u.role === "DRIVER").length,
      customer: users.filter((u) => u.role === "CUSTOMER").length,
      restaurant: users.filter((u) => u.role === "RECEPTIONIST").length,
      admin: users.filter((u) => u.role === "ADMIN").length,
    }),
    [users],
  );

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-linear-to-r from-stone-950 via-brand-800 to-orange-600 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
              People operations
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              User management
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
              Approve drivers, suspend accounts, and review restaurant staff
              from one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-xl">
            {[
              { label: "Drivers", value: counts.driver, icon: Truck },
              { label: "Customers", value: counts.customer, icon: Users },
              { label: "Restaurants", value: counts.restaurant, icon: Store },
              { label: "Admins", value: counts.admin, icon: Shield },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
              >
                <item.icon className="h-4 w-4 text-white/80" />
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/70">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-brand-600" />
          <h3 className="text-lg font-semibold text-stone-900">
            Live account table
          </h3>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm"
        >
          <option value="ALL">All roles</option>
          <option value="DRIVER">Drivers only</option>
          <option value="CUSTOMER">Customers</option>
          <option value="RECEPTIONIST">Restaurants</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm" style={{ minWidth: 760 }}>
          <thead className="bg-stone-50 text-left text-stone-600">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <Fragment key={u.id}>
                <tr className="border-t transition hover:bg-stone-50/70">
                  <td className="p-4">
                    <button
                      type="button"
                      className="text-left font-medium hover:text-brand-600"
                      onClick={() => {
                        const next = expanded === u.id ? null : u.id;
                        setExpanded(next);
                        if (next === u.id && u.role === "DRIVER") {
                          void loadDriverDocs(u.id);
                        }
                      }}
                    >
                      {u.name}
                      {u.role === "DRIVER" && (
                        <span className="ml-2 text-xs text-stone-400">
                          {expanded === u.id ? "▼" : "▶"} docs
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-stone-600">{u.email}</td>
                  <td className="p-4">
                    <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge status={u.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {u.status !== "ACTIVE" && (
                        <Button
                          size="sm"
                          onClick={() => setStatus(u.id, "ACTIVE")}
                        >
                          Approve
                        </Button>
                      )}
                      {u.status !== "SUSPENDED" && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setStatus(u.id, "SUSPENDED")}
                        >
                          Suspend
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteUser(u.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
                {u.role === "DRIVER" && expanded === u.id && (
                  <tr key={`${u.id}-detail`} className="border-t bg-stone-50">
                    <td colSpan={5} className="p-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Card className="border-stone-200 bg-white shadow-sm">
                          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                            Driver contact
                          </p>
                          <p className="mt-2 font-medium text-stone-900">
                            Phone: {u.phone || "—"}
                          </p>
                          <p className="mt-1 text-sm text-stone-600">
                            Vehicle: {u.vehicleType || "—"} · Plate:{" "}
                            {u.vehiclePlate || "—"}
                          </p>
                        </Card>
                        <Card className="border-stone-200 bg-white shadow-sm">
                          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                            Documents
                          </p>
                          <p className="mt-2 text-sm text-stone-600">
                            {loadingDriverDocs === u.id
                              ? "Loading documents..."
                              : `${driverDocsByUserId[u.id]?.length || 0} file(s) uploaded`}
                          </p>
                        </Card>
                      </div>
                      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                        {(driverDocsByUserId[u.id] || []).map((d) => (
                          <li
                            key={d.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3"
                          >
                            <div>
                              <p className="font-medium text-stone-900">
                                {d.type}
                              </p>
                              <p className="text-xs text-stone-500">
                                {d.verified
                                  ? "Verified"
                                  : "Pending verification"}
                              </p>
                            </div>
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Open file
                            </a>
                          </li>
                        ))}
                        {!loadingDriverDocs &&
                          !driverDocsByUserId[u.id]?.length && (
                            <li className="text-stone-500">
                              No documents uploaded yet.
                            </li>
                          )}
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
