"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Package,
  Phone,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  isAvailable?: boolean;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
}

interface Restaurant {
  id: string;
  name: string;
  description?: string | null;
  phone?: string;
  phones?: string[];
  logo?: string | null;
  images?: string[];
  address?: string;
}

export default function RestaurantPage() {
  const params = useParams<{ id?: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { addItem, items: cartItems, total } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [activeCategory, setActiveCategory] = useState("all");
  const [customize, setCustomize] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/menu?restaurantId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        setMenuItems(data.items || []);
        setCategories(data.categories || []);
      });
    fetch(`/api/restaurants/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setRestaurant(data);
      });
  }, [id]);

  const phones = useMemo(() => {
    return [
      ...(restaurant?.phones || []),
      ...(restaurant?.phone && !restaurant.phones?.includes(restaurant.phone)
        ? [restaurant.phone]
        : []),
    ].filter((p, i, a) => a.indexOf(p) === i);
  }, [restaurant]);

  const groupedItems = useMemo(() => {
    const visibleItems = menuItems.filter((item) => item.isAvailable !== false);
    const list = categories.length
      ? categories.map((category) => ({
          category,
          items: visibleItems.filter((item) => item.categoryId === category.id),
        }))
      : [
          {
            category: { id: "all", name: "All items" },
            items: visibleItems,
          },
        ];

    if (activeCategory === "all")
      return list.filter((group) => group.items.length > 0);
    return list.filter((group) => group.category.id === activeCategory);
  }, [activeCategory, categories, menuItems]);

  const visibleCartCount = cartItems.length;

  if (!id) return <p>Loading...</p>;

  return (
    <section className="space-y-6 pb-24">
      {restaurant && (
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.95fr]">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start gap-4">
                {restaurant.logo ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-stone-50">
                    <Image
                      src={restaurant.logo}
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-600 to-amber-500 text-3xl font-black text-white">
                    {restaurant.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-3xl font-black text-stone-900">
                      {restaurant.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Open for orders
                    </span>
                  </div>
                  {restaurant.address && (
                    <p className="mt-2 text-sm text-stone-500">
                      {restaurant.address}
                    </p>
                  )}
                  {restaurant.description && (
                    <p className="mt-4 max-w-2xl text-stone-700">
                      {restaurant.description}
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-2 text-sm text-stone-500">
                    <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5">
                      <Clock3 className="h-4 w-4 text-brand-600" /> Fast menu
                      ordering
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5">
                      <Package className="h-4 w-4 text-brand-600" /> Restaurant
                      pickup & delivery
                    </span>
                  </div>
                  {phones.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-3">
                      {phones.map((p) => (
                        <li
                          key={p}
                          className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-sm text-brand-700"
                        >
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${p}`}>{p}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {restaurant.images && restaurant.images.length > 0 && (
                <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
                  {restaurant.images.map((src) => (
                    <div
                      key={src}
                      className="relative h-28 w-40 shrink-0 overflow-hidden rounded-2xl border bg-stone-50"
                    >
                      <Image src={src} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 bg-stone-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Cart summary
                </p>
                <p className="mt-2 text-2xl font-black text-stone-900">
                  {formatCurrency(total)}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {cartItems.length} item
                  {cartItems.length === 1 ? "" : "s"} ready to checkout
                </p>
                <Link
                  href="/customer/cart"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                >
                  Go to cart <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-stone-900">
                  Jump to category
                </p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === "all" ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === category.id ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-stone-900">Menu</h3>
          <p className="text-sm text-stone-500">
            Tap a category, customize an item, then add it to your cart
            instantly.
          </p>
        </div>
        <Link
          href="/customer/cart"
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          {visibleCartCount > 0
            ? `${visibleCartCount} item${visibleCartCount === 1 ? "" : "s"} in cart`
            : "Open cart"}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-6">
        {groupedItems.map((group) => (
          <section key={group.category.id} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-stone-900">
                  {group.category.name}
                </h4>
                <p className="text-sm text-stone-500">
                  {group.items.length} dishes available
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCategory(group.category.id)}
                className="rounded-full bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200"
              >
                Focus category
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {group.items.map((item) => {
                const unavailable = item.isAvailable === false;
                return (
                  <article
                    key={item.id}
                    className={`flex gap-4 rounded-2xl border bg-white p-4 shadow-sm transition ${unavailable ? "border-stone-200 opacity-60" : "border-stone-200 hover:-translate-y-0.5 hover:shadow-md"}`}
                  >
                    {item.image ? (
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-100 to-amber-100 text-2xl font-black text-brand-700">
                        {item.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-stone-900">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm text-stone-500">
                            {item.description}
                          </p>
                        </div>
                        <span className="font-bold text-brand-600">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                      <input
                        placeholder="Customizations (e.g. no onions)"
                        className="mt-3 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        value={customize[item.id] || ""}
                        onChange={(e) =>
                          setCustomize({
                            ...customize,
                            [item.id]: e.target.value,
                          })
                        }
                      />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-stone-500">
                          {unavailable
                            ? "Currently unavailable"
                            : "Ready to add to cart"}
                        </span>
                        <Button
                          size="sm"
                          disabled={unavailable}
                          onClick={() =>
                            addItem({
                              menuItemId: item.id,
                              name: item.name,
                              price: item.price,
                              restaurantId: id,
                              restaurantName: restaurant?.name || "",
                              customizations: customize[item.id],
                            })
                          }
                        >
                          <Plus className="h-4 w-4" /> Add
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {groupedItems.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-14 text-center text-stone-500">
          <p className="text-lg font-semibold text-stone-900">
            No menu items available right now.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            The restaurant may be updating its menu. Please check again shortly.
          </p>
        </div>
      )}
    </section>
  );
}
