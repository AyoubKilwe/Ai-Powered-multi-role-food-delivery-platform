import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cuisine = searchParams.get("cuisine");
  const minRating = searchParams.get("minRating");
  const maxPrice = searchParams.get("maxPrice");
  const maxDelivery = searchParams.get("maxDelivery");
  const search = searchParams.get("search");

  const restaurants = await db.restaurant.findMany({
    where: {
      isOpen: true,
      ...(cuisine && cuisine !== "all" ? { cuisine } : {}),
      ...(minRating ? { rating: { gte: parseFloat(minRating) } } : {}),
      ...(maxPrice ? { minPrice: { lte: parseFloat(maxPrice) } } : {}),
      ...(maxDelivery ? { deliveryMins: { lte: parseInt(maxDelivery) } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { cuisine: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      menuItems: { where: { isAvailable: true }, take: 3 },
      _count: { select: { menuItems: true } },
    },
    orderBy: { rating: "desc" },
  });

  return NextResponse.json(restaurants);
}
