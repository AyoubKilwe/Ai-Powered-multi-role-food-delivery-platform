import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import MenuClient from "./MenuClient";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return <p className="p-6">Unauthorized</p>;
  }

  const restaurant = await db.restaurant.findFirst({
    where: { ownerId: session.user.id },
    include: {
      categories: { include: { items: true } },
    },
  });

  type MenuItemLocal = { id: string; categoryId: string | null; name: string; price: number; description: string | null; image: string | null; isAvailable: boolean };
  type MenuCategoryLocal = { id: string; name: string; items: MenuItemLocal[] };

  const initialCategories: MenuCategoryLocal[] = Array.isArray(restaurant?.categories)
    ? (restaurant.categories as unknown as MenuCategoryLocal[]).map((category) => ({
        id: category.id,
        name: category.name,
        items: Array.isArray(category.items)
          ? category.items.map((it) => ({
              id: it.id,
              categoryId: it.categoryId ?? category.id,
              name: it.name ?? "",
              price: Number((it as unknown as { price?: number }).price ?? 0),
              description: (it as unknown as { description?: string | null }).description ?? null,
              image: (it as unknown as { image?: string | null }).image ?? null,
              isAvailable: Boolean((it as unknown as { isAvailable?: boolean }).isAvailable),
            }))
          : [],
      }))
    : [];

  const initialItems: MenuItemLocal[] = initialCategories.flatMap((category) => category.items || []);

  return <MenuClient initialRestaurantId={restaurant?.id || ""} />;
}
