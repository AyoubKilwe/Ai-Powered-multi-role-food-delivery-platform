import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type View = "dashboard" | "orders" | "commissions" | "documents";

function normalizeOrderStatus(status: unknown) {
  if (typeof status !== "string" || !status.trim()) return "PENDING";
  const upper = status.trim().toUpperCase();
  if (upper.includes("READY")) return "READY";
  if (upper.includes("PICKED")) return "PICKED_UP";
  if (upper.includes("DELIVERING")) return "DELIVERING";
  if (upper.includes("DELIVERED")) return "DELIVERED";
  if (upper.includes("COOKING")) return "COOKING";
  if (upper.includes("ACCEPTED")) return "ACCEPTED";
  if (upper.includes("DECLINED")) return "DECLINED";
  if (upper.includes("CANCELLED")) return "CANCELLED";
  if (upper.includes("PENDING")) return "PENDING";
  return upper;
}

const driverOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  total: true,
  deliveryAddress: true,
  deliveryLat: true,
  deliveryLng: true,
  driverLat: true,
  driverLng: true,
  restaurant: true,
  customer: true,
} as const;

async function loadDriverContext(sessionUserId: string, view: View) {
  if (view === "commissions") {
    const commissions = await db.driverCommission.findMany({
      where: { driverId: sessionUserId },
      orderBy: { createdAt: "desc" },
      include: { order: { select: { orderNumber: true } } },
      select: { id: true, amount: true, createdAt: true, order: true },
    });
    const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
    return { commissions, totalCommission };
  }

  if (view === "documents") {
    const documents = await db.driverDocument.findMany({
      where: { driverId: sessionUserId },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, fileUrl: true, verified: true },
    });
    return { documents };
  }

  const orders = await db.order.findMany({
    where: {
      OR: [
        { driverId: sessionUserId },
        { status: { contains: "ready" } },
        { status: "ACCEPTED", driverId: null },
      ],
    },
    select: driverOrderSelect,
    include: {
      restaurant: true,
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Also include any orders that have an explicit message sent to this driver
  // (e.g., receptionist notified drivers when an order became READY).
  const messages = await db.message.findMany({
    where: { receiverId: sessionUserId, orderId: { not: null } },
    select: { orderId: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const messageOrderIds = Array.from(new Set(messages.map((m) => m.orderId)));

  if (messageOrderIds.length) {
    const messagedOrders = await db.order.findMany({
      where: { id: { in: messageOrderIds } },
      select: driverOrderSelect,
      include: {
        restaurant: true,
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // merge orders and messagedOrders, dedupe by id
    const merged = [...orders];
    const existingIds = new Set(orders.map((o) => o.id));
    for (const mo of messagedOrders) {
      if (!existingIds.has(mo.id)) merged.push(mo);
    }
    return {
      orders: merged.map((order) => ({
        ...order,
        status: normalizeOrderStatus(order.status),
      })),
    };
  }

  return {
    orders: orders.map((order) => ({
      ...order,
      status: normalizeOrderStatus(order.status),
    })),
  };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DRIVER" || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const view = (searchParams.get("view") || "dashboard") as View;
  const data = await loadDriverContext(session.user.id, view);
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DRIVER" || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { lat, lng, orderId, accept, document } = await req.json();

  if (document?.type && document?.fileUrl) {
    const existing = await db.driverDocument.findMany({
      where: { driverId: session.user.id, type: document.type },
    });
    if (existing.length) {
      await db.driverDocument.updateMany({
        where: { driverId: session.user.id, type: document.type },
        data: { fileUrl: document.fileUrl, verified: false },
      });
    } else {
      await db.driverDocument.createMany({
        data: [
          {
            type: document.type,
            fileUrl: document.fileUrl,
            driverId: session.user.id,
            verified: false,
          },
        ],
      });
    }
    await db.user.update({
      where: { id: session.user.id },
      data: { status: "PENDING" },
    });
    return NextResponse.json({ success: true });
  }

  if (lat && lng) {
    await db.user.update({
      where: { id: session.user.id },
      data: { lat, lng },
    });

    const activeOrders = await db.order.findMany({
      where: {
        driverId: session.user.id,
        status: { in: ["PICKED_UP", "DELIVERING", "READY", "ACCEPTED"] },
      },
      select: { id: true },
    });

    if (activeOrders.length) {
      await Promise.all(
        activeOrders.map((order) =>
          db.order.update({
            where: { id: order.id },
            data: { driverLat: lat, driverLng: lng },
          }),
        ),
      );
    }
  }

  if (accept && orderId) {
    const order = await db.order.update({
      where: { id: orderId },
      data: {
        driverId: session.user.id,
        status: "PICKED_UP",
        driverLat: lat,
        driverLng: lng,
      },
    });
    return NextResponse.json(order);
  }

  return NextResponse.json({ success: true });
}
