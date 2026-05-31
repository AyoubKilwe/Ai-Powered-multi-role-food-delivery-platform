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
        select: {
          id: true,
          name: true,
          phone: true,
          vehicleType: true,
          vehiclePlate: true,
          lat: true,
          lng: true,
        },
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
  if (!session || session.user.status !== "ACTIVE")
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
      const nextData: Record<string, unknown> = { status };

      if (status === "ACCEPTED" && !order.driverId) {
        const nearestDriver = await db.user.findFirst({
          where: { role: "DRIVER", status: "ACTIVE" },
          orderBy: { updatedAt: "desc" },
        });
        if (nearestDriver) {
          nextData.driverId = nearestDriver.id;
          nextData.driverLat = nearestDriver.lat;
          nextData.driverLng = nearestDriver.lng;

          await db.message.create({
            data: {
              senderId: session.user.id,
              receiverId: nearestDriver.id,
              content: `New delivery request for order ${order.orderNumber}`,
              orderId: order.id,
            },
          });
        }
      }

      if (
        status === "ACCEPTED" ||
        status === "DECLINED" ||
        status === "READY" ||
        status === "COOKING"
      ) {
        await db.message.create({
          data: {
            senderId: session.user.id,
            receiverId: order.customerId,
            content:
              status === "ACCEPTED"
                ? `Your order ${order.orderNumber} was accepted.`
                : status === "DECLINED"
                  ? `Your order ${order.orderNumber} was declined.`
                  : status === "COOKING"
                    ? `Your order ${order.orderNumber} is now being prepared.`
                    : `Your order ${order.orderNumber} is ready for delivery.`,
            orderId: order.id,
          },
        });
      }

      if (status === "READY") {
        const drivers = order.driverId
          ? await db.user.findMany({ where: { id: order.driverId, role: "DRIVER", status: "ACTIVE" } })
          : await db.user.findMany({ where: { role: "DRIVER", status: "ACTIVE" } });

        await Promise.all(
          drivers.map((driver) =>
            db.message.create({
              data: {
                senderId: session.user.id,
                receiverId: driver.id,
                content: `Order ${order.orderNumber} is ready for pickup from ${order.restaurant?.name || "the restaurant"}.`,
                orderId: order.id,
              },
            }),
          ),
        );
      }

      const updated = await db.order.update({
        where: { id },
        data: nextData,
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
      const driverFee = 1;
      await db.driverCommission.upsert({
        where: { orderId: id },
        create: { amount: driverFee, orderId: id, driverId: session.user.id },
        update: { amount: driverFee },
      });
      await db.transaction.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          restaurantPayout: order.subtotal * 0.95,
          driverFee,
          platformFee: order.subtotal * 0.05,
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
