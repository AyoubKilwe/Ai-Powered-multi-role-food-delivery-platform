import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type View = "dashboard" | "orders" | "commissions" | "documents";

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
  restaurant: { select: { name: true, phone: true, lat: true, lng: true } },
  customer: { select: { name: true, phone: true, address: true } },
} as const;

async function loadDriverContext(sessionUserId: string, view: View) {
  if (view === "commissions") {
    const commissions = await db.driverCommission.findMany({
      where: { driverId: sessionUserId },
      orderBy: { createdAt: "desc" },
      select: { id: true, amount: true, createdAt: true },
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
        { status: "READY", driverId: null },
        { status: "ACCEPTED", driverId: null },
      ],
    },
    select: driverOrderSelect,
    orderBy: { createdAt: "desc" },
  });

  return { orders };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const view = (searchParams.get("view") || "dashboard") as View;
  const data = await loadDriverContext(session.user.id, view);
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DRIVER") {
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
