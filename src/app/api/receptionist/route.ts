import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLATFORM_FEE_RATE } from "@/lib/utils";

type View = "dashboard" | "orders" | "bookings" | "menu" | "profile";

const dashboardOrderSelect = {
  id: true,
  orderNumber: true,
  total: true,
  status: true,
  restaurant: { select: { id: true, name: true } },
  items: {
    select: {
      quantity: true,
      menuItem: { select: { name: true, image: true } },
    },
  },
} as const;
const boardOrderSelect = {
  id: true,
  orderNumber: true,
  total: true,
  status: true,
  customer: { select: { name: true, phone: true } },
  items: { select: { quantity: true, menuItem: { select: { name: true } } } },
} as const;
const bookingSelect = {
  id: true,
  date: true,
  timeSlot: true,
  guests: true,
  status: true,
  customerNameSnapshot: true,
  customerPhoneSnapshot: true,
  table: { select: { tableNumber: true, capacity: true } },
  customer: { select: { name: true, phone: true } },
} as const;
const menuItemSelect = {
  id: true,
  categoryId: true,
  name: true,
  price: true,
  description: true,
  image: true,
  isAvailable: true,
} as const;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function loadRestaurantContext(
  sessionUserId: string,
  restaurantId?: string | null,
  include: Record<string, unknown> | undefined = undefined,
) {
  const user = await db.user.findUnique({
    where: { id: sessionUserId },
    include: { restaurant: true },
  });

  const existing = await db.restaurant.findFirst({
    where: {
      OR: [
        ...(restaurantId ? [{ id: restaurantId }] : []),
        { ownerId: sessionUserId },
      ],
    },
    include: include ?? {
      categories: { include: { items: true } },
      tables: true,
      timeSlots: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { menuItem: true } },
          customer: { select: { name: true, phone: true } },
        },
      },
      bookings: {
        include: {
          customer: { select: { name: true, phone: true } },
          table: true,
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (existing) return existing;
  if (user?.restaurant) return user.restaurant;

  const created = await db.restaurant.create({
    data: {
      name: user?.name ? `${user.name}'s Restaurant` : "My Restaurant",
      cuisine: "Somali",
      isOpen: true,
      phone: user?.phone || "",
      phones: user?.phone ? [user.phone] : [],
      address: user?.address || "Borama, Somaliland",
      lat: user?.lat,
      lng: user?.lng,
      description: "",
      logo: null,
      images: [],
      ownerId: sessionUserId,
    },
    include: include ?? {
      categories: { include: { items: true } },
      tables: true,
      timeSlots: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { menuItem: true } },
          customer: { select: { name: true, phone: true } },
        },
      },
      bookings: {
        include: {
          customer: { select: { name: true, phone: true } },
          table: true,
        },
        orderBy: { date: "desc" },
      },
    },
  });

  return created;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST" || session.user.status !== "ACTIVE") return unauthorized();

  const { searchParams } = new URL(request.url);
  const view = (searchParams.get("view") || "dashboard") as View;

  if (view === "orders") {
    const restaurant = await loadRestaurantContext(
      session.user.id,
      session.user.restaurantId,
      {
        orders: {
          orderBy: { createdAt: "desc" },
          // include items and customer so the receptionist client receives
          // the nested items.menuItem.name and customer fields expected by the UI
          include: {
            items: { include: { menuItem: true } },
            customer: { select: { name: true, phone: true } },
          },
          select: boardOrderSelect,
        },
      },
    );
    if (!restaurant)
      return NextResponse.json({ error: "No restaurant" }, { status: 404 });
    return NextResponse.json({
      restaurant: { id: restaurant.id, orders: restaurant.orders },
    });
  }

  if (view === "bookings") {
    const restaurant = await loadRestaurantContext(
      session.user.id,
      session.user.restaurantId,
      {
        bookings: { orderBy: { date: "desc" }, select: bookingSelect },
      },
    );
    if (!restaurant)
      return NextResponse.json({ error: "No restaurant" }, { status: 404 });
    return NextResponse.json({ bookings: restaurant.bookings });
  }

  if (view === "menu") {
    const restaurant = await loadRestaurantContext(
      session.user.id,
      session.user.restaurantId,
      {
        categories: {
          select: {
            id: true,
            name: true,
            items: { orderBy: { name: "asc" }, select: menuItemSelect },
          },
        },
      },
    );
    if (!restaurant)
      return NextResponse.json({ error: "No restaurant" }, { status: 404 });
    return NextResponse.json({
      restaurant: { id: restaurant.id, categories: restaurant.categories },
    });
  }

  if (view === "profile") {
    const restaurant = await loadRestaurantContext(
      session.user.id,
      session.user.restaurantId,
      { tables: true, timeSlots: true },
    );
    if (!restaurant)
      return NextResponse.json({ error: "No restaurant" }, { status: 404 });
    return NextResponse.json({ restaurant });
  }

  const restaurant = await loadRestaurantContext(
    session.user.id,
    session.user.restaurantId,
    {
      orders: {
        take: 6,
        orderBy: { createdAt: "desc" },
        select: dashboardOrderSelect,
        include: {
          items: { include: { menuItem: true } },
          restaurant: { select: { id: true, name: true } },
          customer: { select: { name: true, phone: true } },
        },
      },
    },
  );

  if (!restaurant)
    return NextResponse.json({ error: "No restaurant" }, { status: 404 });
  const bookings = await db.booking.findMany({
    where: { restaurantId: restaurant.id },
    select: { id: true },
  });
  const bookingCount = bookings.length;
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const monthAgo = new Date(Date.now() - 30 * 86400000);

  const [daily, weekly, monthly] = await Promise.all([
    db.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        status: "DELIVERED",
        createdAt: { gte: startOfDay },
      },
      _sum: { total: true },
      _count: true,
    }),
    db.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        status: "DELIVERED",
        createdAt: { gte: weekAgo },
      },
      _sum: { total: true },
      _count: true,
    }),
    db.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        status: "DELIVERED",
        createdAt: { gte: monthAgo },
      },
      _sum: { total: true },
      _count: true,
    }),
  ]);
  // Also compute payout breakdowns (restaurant payout after driver & platform fees)
  const [dailyAgg, weeklyAgg, monthlyAgg] = await Promise.all([
    db.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        status: "DELIVERED",
        createdAt: { gte: startOfDay },
      },
      _sum: { subtotal: true, deliveryFee: true, serviceTax: true },
      _count: true,
    }),
    db.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        status: "DELIVERED",
        createdAt: { gte: weekAgo },
      },
      _sum: { subtotal: true, deliveryFee: true, serviceTax: true },
      _count: true,
    }),
    db.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        status: "DELIVERED",
        createdAt: { gte: monthAgo },
      },
      _sum: { subtotal: true, deliveryFee: true, serviceTax: true },
      _count: true,
    }),
  ]);

  function toNumbers(agg: unknown) {
    const a = agg as { _sum?: { subtotal?: number; deliveryFee?: number; serviceTax?: number }; _count?: number };
    const subtotal = (a?._sum?.subtotal as number) || 0;
    const deliveryFee = (a?._sum?.deliveryFee as number) || 0;
    const serviceTax = (a?._sum?.serviceTax as number) || 0;
    const orders = a?._count || 0;
    const restaurantPayout = subtotal * (1 - PLATFORM_FEE_RATE); // matches transaction creation logic
    const driverFee = orders * 1; // fixed $1 per delivered order
    const platformFee = subtotal * PLATFORM_FEE_RATE;
    return { subtotal, deliveryFee, serviceTax, orders, restaurantPayout, driverFee, platformFee };
  }

  const d = toNumbers(dailyAgg);
  const w = toNumbers(weeklyAgg);
  const m = toNumbers(monthlyAgg);

  return NextResponse.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      orders: restaurant.orders,
      bookingCount,
    },
    sales: {
      daily: { revenue: daily._sum.total || 0, orders: daily._count, payout: d.restaurantPayout, driverFee: d.driverFee, tax: d.serviceTax, platformFee: d.platformFee },
      weekly: { revenue: weekly._sum.total || 0, orders: weekly._count, payout: w.restaurantPayout, driverFee: w.driverFee, tax: w.serviceTax, platformFee: w.platformFee },
      monthly: { revenue: monthly._sum.total || 0, orders: monthly._count, payout: m.restaurantPayout, driverFee: m.driverFee, tax: m.serviceTax, platformFee: m.platformFee },
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST" || session.user.status !== "ACTIVE") return unauthorized();

  const restaurant = await loadRestaurantContext(
    session.user.id,
    session.user.restaurantId,
    { tables: true, timeSlots: true },
  );
  if (!restaurant)
    return NextResponse.json({ error: "No restaurant" }, { status: 404 });
  const body = await req.json();

  if (body.profile) {
    const updated = await db.restaurant.update({
      where: { id: restaurant.id },
      data: body.profile,
    });
    return NextResponse.json(updated);
  }

  if (body.table) {
    const table = await db.restaurantTable.create({
      data: { ...body.table, restaurantId: restaurant.id },
    });
    return NextResponse.json(table);
  }

  if (body.timeSlot) {
    if (body.timeSlot.action === "create") {
      const label = `${body.timeSlot.start} - ${body.timeSlot.end}`;
      const timeSlot = await db.timeSlot.create({
        data: {
          restaurantId: restaurant.id,
          label,
          capacity: body.timeSlot.capacity || 2,
        },
      });
      return NextResponse.json(timeSlot);
    }

    if (body.timeSlot.action === "delete" && body.timeSlot.id) {
      await db.timeSlot.delete({ where: { id: body.timeSlot.id } });
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}
