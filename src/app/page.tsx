import Link from "next/link";
import Image from "next/image";
import {
  UtensilsCrossed,
  Truck,
  MapPin,
  Sparkles,
  Shield,
  Clock,
  Star,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
  Bike,
  Smile,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/landing/Footer";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: UtensilsCrossed,
    title: "50+ Restaurants",
    desc: "Somali, Italian, seafood & more.",
  },
  {
    icon: Sparkles,
    title: "Gemini AI Assistant",
    desc: "Ask for meal ideas anytime.",
  },
  {
    icon: MapPin,
    title: "Live GPS Tracking",
    desc: "Watch your driver move live.",
  },
  {
    icon: Truck,
    title: "Smart Dispatch",
    desc: "Nearest drivers auto-assigned.",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    desc: "Encrypted auth and role-based access.",
  },
  {
    icon: Clock,
    title: "Dine-in Booking",
    desc: "Reserve tables with time slots.",
  },
];

const popularDishes = [
  {
    name: "Bariis Iskukaris",
    img: "/images/dish-bariis.svg",
    price: "$12.50",
  },
  {
    name: "Margherita Pizza",
    img: "/images/dish-pizza.svg",
    price: "$9.99",
  },
  {
    name: "Grilled Suqaar",
    img: "/images/dish-suqaar.svg",
    price: "$10.00",
  },
  {
    name: "Fresh Seafood",
    img: "/images/dish-seafood.svg",
    price: "$15.00",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Choose your meal",
    desc: "Browse menus, pick your favourite dishes, and customize your order in seconds.",
    img: "/images/how-step-1-order.svg",
    icon: ShoppingBag,
  },
  {
    step: "02",
    title: "Fast delivery",
    desc: "A nearby driver picks up your order and brings it straight to your door on a motorbike.",
    img: "/images/how-step-2-delivery.svg",
    icon: Bike,
  },
  {
    step: "03",
    title: "Enjoy your food",
    desc: "Open the bag, serve your plate, and enjoy hot fresh food with family or friends.",
    img: "/images/how-step-3-enjoy.svg",
    icon: UtensilsCrossed,
  },
  {
    step: "04",
    title: "Happy & satisfied",
    desc: "Great taste, on time — rate your experience and order again whenever you are hungry.",
    img: "/images/how-step-4-happy.svg",
    icon: Smile,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950">
      <Navbar />

      {/* Hero — clean food photo, no SVG text */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <Image
          src="/images/hero-food.svg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/75 via-black/55 to-stone-950" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 pt-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-md">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Your favourite food, one tap away
          </span>
          <h1 className="mt-8 text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-7xl lg:text-8xl">
            Delicious food,{" "}
            <span className="bg-linear-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              delivered to you
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-200 sm:text-xl">
            Order from top restaurants, track your driver live, book a table, or ask our AI what to eat tonight.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button
                size="lg"
                className="min-w-[200px] text-base shadow-xl shadow-orange-600/30"
              >
                Order Now <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20"
              >
                Sign In
              </Button>
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-10">
            {[
              { v: "50+", l: "Restaurants" },
              { v: "25m", l: "Avg delivery" },
              { v: "4.8★", l: "Rating" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-3xl font-bold text-white sm:text-4xl">{s.v}</p>
                <p className="mt-1 text-sm text-stone-400">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/40">
          <ArrowRight className="h-6 w-6 rotate-90" />
        </div>
      </section>

      {/* Popular dishes */}
      <section className="relative bg-stone-950 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Popular right now</h2>
            <p className="mt-3 text-stone-400">Trending dishes from our partner restaurants</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularDishes.map((d) => (
              <article
                key={d.name}
                className="group overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 transition hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/10"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={d.img}
                    alt={d.name}
                    fill
                    className="object-contain p-4 transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-stone-900 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-brand-600 px-3 py-1 text-sm font-bold text-white">
                    {d.price}
                  </span>
                </div>
                <h3 className="p-4 text-lg font-semibold text-white">{d.name}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — visual steps with photos */}
      <section id="how-it-works" className="bg-stone-900 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-stone-400">
              From choosing your meal to smiling at the table — four simple steps.
            </p>
          </div>

          <div className="mt-16 space-y-20">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              const imageOnLeft = index % 2 === 0;
              return (
                <div
                  key={item.step}
                  className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
                >
                  <div
                    className={
                      imageOnLeft ? "lg:order-1" : "lg:order-2"
                    }
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-stone-800 shadow-2xl ring-1 ring-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.img}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute left-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-lg">
                        {item.step}
                      </span>
                    </div>
                  </div>

                  <div
                    className={
                      imageOnLeft ? "lg:order-2" : "lg:order-1"
                    }
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/20 text-brand-400">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-white sm:text-3xl">{item.title}</h3>
                    <p className="mt-4 text-lg leading-relaxed text-stone-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-24">
        <div className="absolute inset-0 bg-stone-950" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
            Everything you need in one app
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-stone-400">
            Customers, drivers, restaurants, and admins — each with a powerful dedicated experience.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-800 bg-stone-900/80 p-8 transition hover:border-brand-500/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/20 text-brand-400">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-stone-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — high contrast, readable text */}
      <section id="restaurants" className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-stone-950" />
        <Image
          src="/images/kitchen.svg"
          alt=""
          fill
          className="object-cover opacity-15"
          sizes="100vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-950/95 to-stone-950" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-3xl border border-stone-700 bg-stone-900 px-8 py-12 text-center shadow-2xl sm:px-12 sm:py-14">
            <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Ready to order?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-stone-300">
              Join thousands enjoying smarter food delivery with live tracking and AI recommendations.
            </p>
            <Link href="/register" className="mt-10 inline-block">
              <Button size="lg" className="min-w-[260px] text-lg shadow-lg shadow-brand-600/40">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
