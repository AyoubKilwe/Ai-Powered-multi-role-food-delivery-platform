import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type View = "dashboard" | "orders" | "bookings" | "menu" | "profile";
const dashboardOrderSelect = {
  id: true,
  orderNumber: true,
const boardOrderSelect = {
  id: true,
  orderNumber: true,
const bookingSelect = {
  id: true,
  date: true,
const menuItemSelect = {
  id: true,
  categoryId: true,
function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
async function loadRestaurantContext(
  sessionUserId: string,
  restaurantId: string | null | undefined,
) {
  const user = await db.user.findUnique({
    where: { id: sessionUserId },
  const existing = await db.restaurant.findFirst({
    where: {
      OR: [
        ...(restaurantId ? [{ id: restaurantId }] : []),
        { ownerId: sessionUserId },
      ],
    include,
  });

  if (existing) return existing;
  if (user?.restaurant?.id) {
    return db.restaurant.findUnique({
      where: { id: user.restaurant.id },
  const created = await db.restaurant.create({
    data: {
      name: user?.name ? `${user.name}'s Restaurant` : "My Restaurant",
  cuisine: "Somali",
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
    include,
  });

  return created;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST") {
    return unauthorized();
  const { searchParams } = new URL(request.url);
  const view = (searchParams.get("view") || "dashboard") as View;

  if (view === "orders") {
    const restaurant = await loadRestaurantContext(
      session.user.id,
      session.user.restaurantId,
      {
        orders: {
          orderBy: { createdAt: "desc" },
          select: boardOrderSelect,
        },
      },
  );

  if (!restaurant) return NextResponse.json({ error: "No restaurant" }, { status: 404 });
    return NextResponse.json({ restaurant: { id: restaurant.id, orders: restaurant.orders } });
  }

  if (view === "bookings") {
    const restaurant = await loadRestaurantContext(
      session.user.id,
      session.user.restaurantId,
      {
        bookings: {
          orderBy: { date: "desc" },
          select: bookingSelect,
        },
      },
  );

  if (!restaurant) return NextResponse.json({ error: "No restaurant" }, { status: 404 });
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
            items: {
              orderBy: { name: "asc" },
              select: menuItemSelect,
            },
          },
        },
      },
  );

  if (!restaurant) return NextResponse.json({ error: "No restaurant" }, { status: 404 });
    return NextResponse.json({ restaurant: { id: restaurant.id, categories: restaurant.categories } });
  }

  if (view === "profile") {
    const restaurant = await loadRestaurantContext(
      session.user.id,
      session.user.restaurantId,
      {
        tables: true,
        timeSlots: true,
      },
  );

  if (!restaurant) return NextResponse.json({ error: "No restaurant" }, { status: 404 });
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
      },
    },
  );

  if (!restaurant) return NextResponse.json({ error: "No restaurant" }, { status: 404 });
  const bookingCount = await db.booking.count({
    where: { restaurantId: restaurant.id },
  });
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));

  const daily = await db.order.aggregate({
    where: {
      restaurantId: restaurant.id,
      status: "DELIVERED",
      createdAt: { gte: startOfDay },
    },
    _sum: { total: true },
    _count: true,
  });

  return NextResponse.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      orders: restaurant.orders,
      bookingCount,
    },
    sales: {
      daily: { revenue: daily._sum.total || 0, orders: daily._count },
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST") {
    return unauthorized();
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
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function loadRestaurantContext(
  sessionUserId: string,
  restaurantId?: string,
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
    include: {
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
    include: {
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurant = await loadRestaurantContext(
    session.user.id,
    session.user.restaurantId,
  );

  if (!restaurant)
    return NextResponse.json({ error: "No restaurant" }, { status: 404 });

  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
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

  return NextResponse.json({
    restaurant,
    sales: {
      daily: { revenue: daily._sum.total || 0, orders: daily._count },
      weekly: { revenue: weekly._sum.total || 0, orders: weekly._count },
      monthly: { revenue: monthly._sum.total || 0, orders: monthly._count },
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurant = await loadRestaurantContext(
    session.user.id,
    session.user.restaurantId,
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
