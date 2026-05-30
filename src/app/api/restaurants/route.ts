import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const minRating = searchParams.get("minRating");
  const maxPrice = searchParams.get("maxPrice");
  const maxDelivery = searchParams.get("maxDelivery");
  const search = searchParams.get("search");

  const restaurants = await db.restaurant.findMany({
    where: {
      ...(minRating ? { rating: { gte: parseFloat(minRating) } } : {}),
      ...(maxPrice ? { minPrice: { lte: parseFloat(maxPrice) } } : {}),
      ...(maxDelivery ? { deliveryMins: { lte: parseInt(maxDelivery) } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      menuItems: { where: { isAvailable: true }, take: 3 },
      _count: { select: { menuItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    restaurants.map((r) => ({
      ...r,
      rating: typeof r.rating === "number" ? r.rating : 4.5,
      deliveryMins: typeof r.deliveryMins === "number" ? r.deliveryMins : 30,
      minPrice: typeof r.minPrice === "number" ? r.minPrice : 5,
    })),
  );
}
