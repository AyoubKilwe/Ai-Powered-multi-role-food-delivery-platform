"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all",
        isHome
          ? "border-b border-white/10 bg-black/30 backdrop-blur-xl"
          : "border-b border-stone-200/80 bg-white/95 backdrop-blur-md",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "text-xl font-bold",
              isHome ? "text-white" : "text-stone-900",
            )}
          >
            Borama<span className="text-brand-500">Food</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {[
            "Features|/#features",
            "How it Works|/#how-it-works",
            "Restaurants|/#restaurants",
          ].map((item) => {
            const [label, href] = item.split("|");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-sm font-medium transition",
                  isHome
                    ? "text-stone-200 hover:text-white"
                    : "text-stone-600 hover:text-brand-600",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className={isHome ? "text-white hover:bg-white/10" : ""}
            >
              Log In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        <button
          className={cn("md:hidden", isHome ? "text-white" : "text-stone-900")}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div
          className={cn(
            "border-t px-4 py-4 md:hidden",
            isHome
              ? "border-white/10 bg-black/90"
              : "border-stone-200 bg-white",
          )}
        >
          <div className="flex flex-col gap-3">
            <Link
              href="/#features"
              onClick={() => setOpen(false)}
              className={isHome ? "text-white" : ""}
            >
              Features
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={isHome ? "text-white" : ""}
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className={isHome ? "text-white" : ""}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
