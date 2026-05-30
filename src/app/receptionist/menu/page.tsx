"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";

interface MenuItem {
  id: string;
  categoryId: string | null;
  name: string;
  price: number;
  description: string | null;
  image: string | null;
  isAvailable: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
}

function isMenuItem(value: unknown): value is MenuItem {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MenuItem>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.price === "number"
  );
}

function normalizeItems(input: unknown): MenuItem[] {
  if (!Array.isArray(input)) return [];
  return input.filter(isMenuItem);
}

export default function MenuPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    price: "",
    description: "",
    categoryId: "",
    image: "",
  });

  useEffect(() => {
    fetch("/api/receptionist?view=menu")
      .then((r) => r.json())
      .then((d) => {
        const restaurant = d?.restaurant;
        const loadedCategories = Array.isArray(restaurant?.categories)
          ? restaurant.categories
          : [];
        setRestaurantId(
          typeof restaurant?.id === "string" ? restaurant.id : "",
        );
        setCategories(
          loadedCategories.filter(
            (c: unknown): c is MenuCategory =>
              Boolean(c) &&
              typeof c === "object" &&
              typeof (c as MenuCategory).id === "string" &&
              typeof (c as MenuCategory).name === "string",
          ),
        );
        setItems(
          loadedCategories.flatMap((c: unknown) =>
            normalizeItems((c as { items?: unknown })?.items),
          ),
        );
      });
  }, []);

  async function refreshMenu() {
    const data = await fetch(`/api/menu?restaurantId=${restaurantId}`).then(
      (r) => r.json(),
    );
    setItems(normalizeItems(data?.items));
    setCategories(
      Array.isArray(data?.categories)
        ? data.categories.filter(
            (c: unknown): c is MenuCategory =>
              Boolean(c) &&
              typeof c === "object" &&
              typeof (c as MenuCategory).id === "string" &&
              typeof (c as MenuCategory).name === "string",
          )
        : [],
    );
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "category",
        action: "create",
        name: categoryName,
        restaurantId,
      }),
    });
    setCategoryName("");
    await refreshMenu();
  }

  async function renameCategory(id: string, name: string) {
    await fetch("/api/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", action: "update", id, name }),
    });
    await refreshMenu();
  }

  async function deleteCategory(id: string) {
    await fetch("/api/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", action: "delete", id }),
    });
    await refreshMenu();
  }

  async function uploadItemImage(file: File) {
    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingImage(false);
    if (!res.ok) {
      alert(data.error || "Image upload failed");
      return;
    }
    setForm((prev) => ({ ...prev, image: data.url }));
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        price: form.price,
        description: form.description,
        categoryId: form.categoryId || null,
        image: form.image || null,
      }),
    });
    setForm({
      id: "",
      name: "",
      price: "",
      description: "",
      categoryId: "",
      image: "",
    });
    await refreshMenu();
  }

  async function toggleAvailability(id: string, isAvailable: boolean) {
    await fetch("/api/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isAvailable: !isAvailable }),
    });
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isAvailable: !isAvailable } : i)),
    );
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: form.id,
        name: form.name,
        price: parseFloat(form.price),
        description: form.description,
        categoryId: form.categoryId || null,
        image: form.image || null,
      }),
    });
    setForm({
      id: "",
      name: "",
      price: "",
      description: "",
      categoryId: "",
      image: "",
    });
    await refreshMenu();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Digital menu</h2>
        <p className="text-sm text-stone-500">
          Manage categories, items, prices, and descriptions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border bg-white p-4">
          <h3 className="font-semibold">Categories</h3>
          <form onSubmit={addCategory} className="flex gap-2">
            <Input
              placeholder="New category"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
            <Button type="submit">Add</Button>
          </form>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 rounded-xl border p-3"
              >
                {editingCategoryId === cat.id ? (
                  <input
                    className="flex-1 rounded-lg border px-3 py-2"
                    defaultValue={cat.name}
                    autoFocus
                    onBlur={(e) => {
                      setEditingCategoryId("");
                      if (
                        e.target.value.trim() &&
                        e.target.value !== cat.name
                      ) {
                        void renameCategory(cat.id, e.target.value.trim());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="flex-1 text-left font-medium"
                    onClick={() => setEditingCategoryId(cat.id)}
                  >
                    {cat.name}
                  </button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingCategoryId(cat.id)}
                >
                  Rename
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => deleteCategory(cat.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border bg-white p-4">
          <h3 className="font-semibold">
            {form.id ? "Edit menu item" : "Add menu item"}
          </h3>
          <form
            onSubmit={form.id ? saveItem : addItem}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Input
              placeholder="Item name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="Price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="sm:col-span-2 space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
              <label className="block text-sm font-medium text-stone-700">
                Menu image
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadItemImage(file);
                }}
              />
              <p className="text-xs text-stone-500">
                {uploadingImage
                  ? "Uploading image..."
                  : "Upload a dish photo; it will be saved to the server automatically."}
              </p>
              {form.image && (
                <div className="relative h-32 overflow-hidden rounded-lg border bg-white">
                  <Image
                    src={form.image}
                    alt="Menu item preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            <select
              className="rounded-xl border border-stone-200 px-4 py-2.5 sm:col-span-2"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button type="submit" className="sm:col-span-2">
              {form.id ? "Save changes" : "Add item"}
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border bg-white p-4">
            {item.image && (
              <div className="relative mb-3 h-40 overflow-hidden rounded-lg bg-stone-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-stone-500">{item.description}</p>
              <p className="text-brand-600">{formatCurrency(item.price)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    id: item.id,
                    name: item.name,
                    price: String(item.price),
                    description: item.description || "",
                    categoryId: item.categoryId || "",
                    image: item.image || "",
                  })
                }
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleAvailability(item.id, item.isAvailable)}
              >
                {item.isAvailable ? "Disable" : "Enable"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => deleteItem(item.id)}
              >
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
