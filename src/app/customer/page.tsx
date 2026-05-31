import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import CustomerHomeClient, {
  type ProfileSummary,
  type RestaurantSummary,
} from "./CustomerHomeClient";

export const dynamic = "force-dynamic";

export default async function CustomerHomePage() {
  const session = await getServerSession(authOptions);

  const [restaurants, profile] = await Promise.all([
    db.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        cuisine: true,
        rating: true,
        deliveryMins: true,
        minPrice: true,
        logo: true,
        images: true,
        description: true,
        address: true,
        lat: true,
        lng: true,
        isOpen: true,
      },
    }),
    session?.user?.id
      ? db.user.findUnique({
          where: { id: session.user.id },
          select: { address: true, lat: true, lng: true },
        })
      : Promise.resolve(null),
  ]);

  const initialRestaurants: RestaurantSummary[] = restaurants.map((r) => ({
    ...r,
    rating: typeof r.rating === "number" ? r.rating : 4.5,
    deliveryMins: typeof r.deliveryMins === "number" ? r.deliveryMins : 30,
    minPrice: typeof r.minPrice === "number" ? r.minPrice : 5,
  }));

  const initialProfile: ProfileSummary = profile
    ? {
        address: profile.address,
        lat: profile.lat,
        lng: profile.lng,
      }
    : null;

  return (
    <CustomerHomeClient
      initialRestaurants={initialRestaurants}
      initialProfile={initialProfile}
    />
  );
}
