import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  vehiclePlate: true,
  vehicleType: true,
} as const;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN" || session.user.status !== "ACTIVE") {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "dashboard";

  if (view === "users") {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: adminUserSelect,
    });

    return NextResponse.json({ users });
  }

  if (view === "driver-docs") {
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const driverDocuments = await db.driverDocument.findMany({
      where: { driverId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        fileUrl: true,
        verified: true,
      },
    });

    return NextResponse.json({ driverDocuments });
  }

  if (view === "finance") {
    const transactions = await db.transaction.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        total: true,
        restaurantPayout: true,
        driverFee: true,
        platformFee: true,
        serviceTax: true,
        createdAt: true,
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ transactions });
  }

  if (view === "disputes") {
    const [orders, disputes] = await Promise.all([
      db.order.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      }),
      db.dispute.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reason: true,
          status: true,
          order: {
            select: {
              orderNumber: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ orders, disputes });
  }

  const [
    totalOrders,
    activeUsers,
    pendingDrivers,
    totalRestaurants,
    deliveredOrders,
    pendingOrders,
    openDisputes,
    totalRevenue,
  ] = await Promise.all([
    db.order.count(),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { role: "DRIVER", status: "PENDING" } }),
    db.restaurant.count(),
    db.order.count({ where: { status: "DELIVERED" } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.dispute.count({ where: { status: "OPEN" } }),
    db.transaction.aggregate({
      _sum: { total: true },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalOrders,
      totalRestaurants,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingDrivers,
      activeUsers,
      deliveredOrders,
      pendingOrders,
      openDisputes,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN" || session.user.status !== "ACTIVE") {
    return unauthorized();
  }

  const { userId, status, action, orderId, reason, resolution } =
    await req.json();

  if (userId && status) {
    const user = await db.user.update({
      where: { id: userId },
      data: { status },
    });
    if (status === "ACTIVE") {
      await db.driverDocument.updateMany({
        where: { driverId: userId },
        data: { verified: true },
      });
    }
    return NextResponse.json(user);
  }

  if (action === "delete" && userId) {
    await db.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  }

  if (action === "dispute" && orderId) {
    const dispute = await db.dispute.upsert({
      where: { orderId },
      create: { orderId, reason: reason || "Customer complaint" },
      update: { resolution, status: resolution ? "RESOLVED" : "OPEN" },
    });
    return NextResponse.json(dispute);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
