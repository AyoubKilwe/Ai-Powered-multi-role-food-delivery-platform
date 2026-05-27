import Link from "next/link";
import { UtensilsCrossed, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-stone-800 bg-stone-950 text-stone-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">BoramaFood</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Borama&apos;s premier food delivery platform. Order from top restaurants, track live, book tables, and get AI-powered recommendations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Platform</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-brand-400">Sign up</Link></li>
              <li><Link href="/login" className="hover:text-brand-400">Sign in</Link></li>
              <li><Link href="/#features" className="hover:text-brand-400">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-brand-400">How it works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> Borama, Somaliland</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +252 63 000 0000</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> support@boramafood.com</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-stone-800 pt-8 text-center text-sm">
          © {new Date().getFullYear()} Borama Food Delivery. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
