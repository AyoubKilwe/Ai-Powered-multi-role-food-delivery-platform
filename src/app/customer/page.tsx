"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Flame,
  MapPin,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { BORAMA_CENTER, CUISINES } from "@/lib/utils";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryMins: number;
  minPrice: number;
  logo: string | null;
  description: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  isOpen?: boolean;
}

function distanceKm(
  from?: { lat?: number | null; lng?: number | null } | null,
  to?: { lat?: number | null; lng?: number | null } | null,
) {
  if (
    !from ||
    typeof from.lat !== "number" ||
    typeof from.lng !== "number" ||
    !to ||
    typeof to.lat !== "number" ||
    typeof to.lng !== "number"
  ) {
    return null;
  }

  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function CustomerHomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cuisine, setCuisine] = useState("all");
  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxDelivery, setMaxDelivery] = useState("");
  const [profile, setProfile] = useState<{
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((u) => setProfile(u));

    const params = new URLSearchParams();
    if (cuisine !== "all") params.set("cuisine", cuisine);
    if (search) params.set("search", search);
    if (minRating) params.set("minRating", minRating);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (maxDelivery) params.set("maxDelivery", maxDelivery);

    fetch(`/api/restaurants?${params}`)
      .then((r) => r.json())
      .then(setRestaurants);
  }, [cuisine, search, minRating, maxPrice, maxDelivery]);

  const liveRestaurants = useMemo(() => {
    const origin =
      profile?.lat && profile?.lng
        ? { lat: profile.lat, lng: profile.lng }
        : BORAMA_CENTER;

    return restaurants
      .map((restaurant) => ({
        ...restaurant,
        distanceKm: distanceKm(origin, restaurant),
      }))
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return b.rating - a.rating;
      });
  }, [profile, restaurants]);

  const nearbyRestaurants = liveRestaurants.filter(
    (restaurant) =>
      restaurant.distanceKm !== null && restaurant.distanceKm <= 4,
  );
  const featuredRestaurants = liveRestaurants.slice(0, 6);
  const totalOpen = liveRestaurants.length;

  return (
    <section className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-700 via-orange-600 to-amber-500 p-8 text-white shadow-2xl shadow-brand-700/20">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -right-12 top-4 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 left-16 h-32 w-32 rounded-full bg-black/10 blur-3xl" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <Flame className="h-4 w-4" />
              Order from restaurants near you in one tap
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-5xl">
              Discover restaurants, pick a category, and checkout fast.
            </h2>
            <p className="mt-4 max-w-xl text-base text-orange-50/90 sm:text-lg">
              We highlight open restaurants around your location, so you can go
              from browsing to ordering without the extra clicks.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/customer/chatbot"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-lg transition hover:-translate-y-0.5"
              >
                <Sparkles className="h-4 w-4" /> Ask Food AI
              </Link>
              <Link
                href="/customer/cart"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                View cart <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Delivery to</p>
            <p className="mt-1 text-lg font-bold text-stone-900">
              {profile?.address || "Your saved address"}
            </p>
            <p className="mt-2 text-sm text-stone-500">
              {profile?.lat && profile?.lng
                ? `${profile.lat.toFixed(4)}, ${profile.lng.toFixed(4)}`
                : "Set your location from profile or cart checkout."}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Open restaurants</p>
            <p className="mt-1 text-3xl font-black text-stone-900">
              {totalOpen}
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Sorted by distance when location is available.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Top discovery</p>
            <p className="mt-1 text-lg font-bold text-stone-900">
              {liveRestaurants[0]?.name || "Borama favorites"}
            </p>
            <p className="mt-2 text-sm text-stone-500">
              {liveRestaurants[0]
                ? `${liveRestaurants[0].deliveryMins} min delivery • ${liveRestaurants[0].rating}★`
                : "New restaurants appear here automatically."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
              Find food fast
            </p>
            <h3 className="text-lg font-bold text-stone-900">
              Search restaurants or jump into a cuisine.
            </h3>
          </div>
          <div className="text-sm text-stone-500">
            {nearbyRestaurants.length > 0
              ? `${nearbyRestaurants.length} nearby restaurants matched your area`
              : "Browse all open restaurants in Borama"}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 h-5 w-5 text-stone-400" />
            <input
              placeholder="Search restaurants or cuisine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-stone-200 py-3 pl-11 pr-4 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="rounded-xl border border-stone-200 px-4 py-3"
          >
            <option value="all">All cuisines</option>
            {CUISINES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="rounded-xl border border-stone-200 px-4 py-3"
          >
            <option value="">Any rating</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-xl border border-stone-200 px-4 py-3"
          >
            <option value="">Any price</option>
            <option value="10">Up to $10</option>
            <option value="15">Up to $15</option>
            <option value="20">Up to $20</option>
          </select>
          <select
            value={maxDelivery}
            onChange={(e) => setMaxDelivery(e.target.value)}
            className="rounded-xl border border-stone-200 px-4 py-3"
          >
            <option value="">Any delivery</option>
            <option value="20">Within 20 min</option>
            <option value="30">Within 30 min</option>
            <option value="45">Within 45 min</option>
          </select>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCuisine("all")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${cuisine === "all" ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}
          >
            All cuisines
          </button>
          {CUISINES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCuisine(c)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${cuisine === c ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {nearbyRestaurants.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-600" />
            <h3 className="text-xl font-bold text-stone-900">
              Restaurants near you
            </h3>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {nearbyRestaurants.slice(0, 6).map((r) => (
              <Link
                key={r.id}
                href={`/customer/restaurant/${r.id}`}
                className="group overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-48 bg-stone-100">
                  {r.logo ? (
                    <Image
                      src={r.logo}
                      alt={r.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-linear-to-br from-brand-500 to-amber-500 text-5xl font-black text-white">
                      {r.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-700 shadow">
                    {r.distanceKm !== null
                      ? `${r.distanceKm.toFixed(1)} km away`
                      : "Near Borama"}
                  </div>
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-sm font-bold shadow">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {r.rating}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-stone-900">{r.name}</h3>
                  <p className="text-sm text-brand-600">{r.cuisine}</p>
                  {r.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-stone-500">
                      {r.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {r.deliveryMins} min
                    </span>
                    <span className="font-semibold text-stone-800">
                      From ${r.minPrice}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" />
          <h3 className="text-xl font-bold text-stone-900">
            Featured restaurants
          </h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {featuredRestaurants.map((r) => (
            <Link
              key={r.id}
              href={`/customer/restaurant/${r.id}`}
              className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-48 bg-stone-100">
                {r.logo ? (
                  <Image
                    src={r.logo}
                    alt={r.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-linear-to-br from-brand-500 to-amber-500 text-5xl font-black text-white">
                    {r.name.charAt(0)}
                  </div>
                )}
                {r.distanceKm !== null && (
                  <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-700 shadow">
                    {r.distanceKm.toFixed(1)} km away
                  </div>
                )}
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-sm font-bold shadow">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {r.rating}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-stone-900">{r.name}</h3>
                <p className="text-sm text-brand-600">{r.cuisine}</p>
                {r.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-stone-500">
                    {r.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {r.deliveryMins} min
                  </span>
                  <span className="font-semibold text-stone-800">
                    From ${r.minPrice}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {restaurants.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center text-stone-500">
          <p className="text-lg font-semibold text-stone-900">
            No restaurants match your filters.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Try clearing search or choosing another cuisine chip.
          </p>
        </div>
      )}
    </section>
  );
}
