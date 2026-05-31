"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  UtensilsCrossed,
  User,
  Truck,
  Building2,
  Shield,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getDashboardPath } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/roles";

type RoleOption = {
  value: Role;
  label: string;
  desc: string;
  icon: typeof User;
  demoEmail: string;
  color: string;
};

const allRoles: RoleOption[] = [
  {
    value: "CUSTOMER",
    label: "Customer",
    desc: "Order food & track delivery",
    icon: User,
    demoEmail: "customer@boramafood.com",
    color: "border-orange-500 bg-orange-50 ring-orange-500",
  },
  {
    value: "DRIVER",
    label: "Driver",
    desc: "Deliver orders & earn",
    icon: Truck,
    demoEmail: "driver@boramafood.com",
    color: "border-blue-500 bg-blue-50 ring-blue-500",
  },
  {
    value: "RECEPTIONIST",
    label: "Receptionist",
    desc: "Manage restaurant & orders",
    icon: Building2,
    demoEmail: "reception@hoyos.com",
    color: "border-emerald-500 bg-emerald-50 ring-emerald-500",
  },
  {
    value: "ADMIN",
    label: "Admin",
    desc: "Platform control & reports",
    icon: Shield,
    demoEmail: "admin@boramafood.com",
    color: "border-violet-500 bg-violet-50 ring-violet-500",
  },
];

type LoginClientProps = {
  allowedRoles?: Role[];
  defaultRole?: Role;
  title?: string;
  subtitle?: string;
  identifierLabel?: string;
  adminLinkHref?: string;
  adminLinkLabel?: string;
};

export default function LoginClient({
  allowedRoles,
  defaultRole = "CUSTOMER",
  title = "Choose your role",
  subtitle = "Pick the account type you\'re logging into.",
  identifierLabel = "Email",
  adminLinkHref,
  adminLinkLabel,
}: LoginClientProps) {
  const router = useRouter();
  const availableRoles = allowedRoles
    ? allRoles.filter((role) => allowedRoles.includes(role.value))
    : allRoles;
  const fallbackRole = availableRoles.some((role) => role.value === defaultRole)
    ? defaultRole
    : availableRoles[0]?.value || "CUSTOMER";
  const [selectedRole, setSelectedRole] = useState<Role>(fallbackRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const showAdminPortalCard = Boolean(adminLinkHref && adminLinkLabel);

  function selectRole(role: RoleOption) {
    setSelectedRole(role.value);
    setEmail("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    flushSync(() => setLoading(true));
    setError("");

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );

    const res = await signIn("credentials", {
      email,
      password,
      role: selectedRole,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(
        res.error === "CredentialsSignin"
          ? "Invalid email, password, or role. Check your selection and try again."
          : res.error,
      );
      return;
    }

    router.push(getDashboardPath(selectedRole));
    router.refresh();
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0">
        <Image
          src="/images/login-food.svg"
          alt="Food background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-br from-stone-950/90 via-stone-900/85 to-brand-950/80" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden flex-col justify-center text-white lg:flex">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30">
                <UtensilsCrossed className="h-7 w-7" />
              </div>
              <div>
                <p className="text-2xl font-bold">BoramaFood</p>
                <p className="text-sm text-stone-300">
                  Borama&apos;s premium food delivery
                </p>
              </div>
            </div>
            <h1 className="max-w-xl text-5xl font-black leading-tight lg:text-6xl">
              Welcome back to the fastest way to order in Borama.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-stone-300">
              Sign in as a customer, driver, receptionist, or admin and jump
              straight into the right dashboard.
            </p>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4 text-sm text-stone-200">
              {[
                "Live delivery tracking",
                "Restaurant bookings",
                "Driver dispatch & commissions",
                "AI-powered food discovery",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-stone-200/70 bg-white/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-6 text-center lg:text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                  Sign in
                </p>
                <h2 className="mt-2 text-3xl font-bold text-stone-900">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-stone-600">{subtitle}</p>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {availableRoles.map((role) => {
                  const active = selectedRole === role.value;
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => selectRole(role)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-all hover:shadow-md",
                        active
                          ? `${role.color} ring-2`
                          : "border-stone-200 bg-white hover:border-stone-300",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            active
                              ? "bg-white/80 text-stone-900"
                              : "bg-stone-100 text-stone-600",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">
                            {role.label}
                          </p>
                          <p className="text-xs text-stone-500">{role.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={identifierLabel}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div>
                  <Input
                    label="Password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="mt-2 flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {showPass ? "Hide password" : "Show password"}
                  </button>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-3 text-center text-sm text-stone-600">
                <p>
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-brand-600 hover:underline"
                  >
                    Create one
                  </Link>
                </p>
                {adminLinkHref &&
                  adminLinkLabel &&
                  selectedRole !== "ADMIN" && (
                    <p className="text-xs text-stone-500">
                      Admin portal available from the grid above.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
