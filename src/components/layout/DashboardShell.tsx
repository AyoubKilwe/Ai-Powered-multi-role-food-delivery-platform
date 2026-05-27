"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { UtensilsCrossed, LogOut, Menu, Home } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface NavItem {
  href: string;
  label: string;
}

export function DashboardShell({
  children,
  nav,
  title,
}: {
  children: React.ReactNode;
  nav: NavItem[];
  title: string;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const normalizedPath = useMemo(
    () => (pathname ? pathname.replace(/\/+$/, "") || "/" : "/"),
    [pathname],
  );

  const sidebar = (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-lg">
          <UtensilsCrossed className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-white">BoramaFood</span>
          <p className="text-xs text-orange-200">{title}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {nav.map((item) => {
          const itemPath = item.href.replace(/\/+$/, "") || "/";
          const active =
            normalizedPath === itemPath ||
            (itemPath !== "/" && normalizedPath.startsWith(itemPath + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block rounded-xl px-4 py-3 text-sm font-medium transition outline-none ring-offset-2 ring-offset-brand-700 focus-visible:ring-2 focus-visible:ring-white/80",
                active
                  ? "bg-white/20 text-white shadow-inner"
                  : "text-orange-100 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
          <p className="truncate text-sm font-semibold text-white">
            {session?.user?.name}
          </p>
          <p className="truncate text-xs text-orange-200">
            {session?.user?.role}
          </p>
        </div>
        <Link
          href="/"
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-orange-100 transition hover:bg-white/10 hover:text-white"
        >
          <Home className="h-4 w-4" /> Back to website
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-orange-100 hover:bg-white/10 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-stone-100">
      <aside className="hidden w-72 shrink-0 flex-col bg-linear-to-b from-brand-700 via-brand-600 to-amber-700 lg:flex">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-linear-to-b from-brand-700 to-amber-700">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-stone-200 p-2 transition hover:bg-stone-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-stone-900">{title}</h1>
          </div>
          <span className="hidden rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm sm:inline">
            {session?.user?.role}
          </span>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
