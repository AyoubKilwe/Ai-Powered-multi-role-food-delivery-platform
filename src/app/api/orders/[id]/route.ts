import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { menuItem: true } },
      restaurant: true,
      customer: { select: { id: true, name: true, phone: true } },
      driver: {
        select: { id: true, name: true, phone: true, lat: true, lng: true },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const order = await db.order.findUnique({
    where: { id },
    include: { restaurant: true },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, driverLat, driverLng } = body;

  if (session.user.role === "RECEPTIONIST") {
    if (["ACCEPTED", "DECLINED", "COOKING", "READY"].includes(status)) {
      const updated = await db.order.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json(updated);
    }
  }

  if (session.user.role === "DRIVER" && order.driverId === session.user.id) {
    const updated = await db.order.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(driverLat ? { driverLat } : {}),
        ...(driverLng ? { driverLng } : {}),
      },
    });

    if (status === "DELIVERED") {
      const driverFee = order.deliveryFee * 0.6;
      await db.driverCommission.upsert({
        where: { orderId: id },
        create: { amount: driverFee, orderId: id, driverId: session.user.id },
        update: { amount: driverFee },
      });
      await db.transaction.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          restaurantPayout: order.subtotal * 0.85,
          driverFee,
          platformFee: order.subtotal * 0.1,
          serviceTax: order.serviceTax,
          total: order.total,
        },
        update: {},
      });
    }
    return NextResponse.json(updated);
  }

  if (session.user.role === "ADMIN" && status) {
    const updated = await db.order.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
