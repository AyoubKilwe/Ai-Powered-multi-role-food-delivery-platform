import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateOrderTotals, generateOrderNumber } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.status !== "ACTIVE")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let receptionistRestaurantId = session.user.restaurantId;
  if (session.user.role === "RECEPTIONIST" && !receptionistRestaurantId) {
    const r = await db.restaurant.findFirst({
      where: { ownerId: session.user.id },
    });
    receptionistRestaurantId = r?.id;
  }

  const where =
    session.user.role === "CUSTOMER"
      ? { customerId: session.user.id }
      : session.user.role === "DRIVER"
        ? { driverId: session.user.id }
        : session.user.role === "RECEPTIONIST" && receptionistRestaurantId
          ? { restaurantId: receptionistRestaurantId }
          : {};

  const orders = await db.order.findMany({
    where,
    include: {
      restaurant: { select: { id: true, name: true } },
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
      items: {
        include: {
          menuItem: {
            select: { id: true, name: true, price: true, image: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CUSTOMER" || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    restaurantId,
    items,
    notes,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
  } = await req.json();
  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const subtotal = items.reduce(
    (sum: number, i: { price: number; quantity: number }) =>
      sum + i.price * i.quantity,
    0,
  );
  const { serviceTax, deliveryFee, platformFee, total } = calculateOrderTotals(subtotal);

  const order = await db.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      status: "PENDING",
      createdAt: new Date(),
      subtotal,
      serviceTax,
      deliveryFee,
      platformFee,
      total,
      notes,
      customerId: session.user.id,
      restaurantId,
      deliveryAddress: deliveryAddress || session.user.name,
      deliveryLat: typeof deliveryLat === "number" ? deliveryLat : undefined,
      deliveryLng: typeof deliveryLng === "number" ? deliveryLng : undefined,
      items: {
        create: items.map(
          (i: {
            menuItemId: string;
            quantity: number;
            price: number;
            customizations?: string;
          }) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            price: i.price,
            customizations: i.customizations,
          }),
        ),
      },
    },
    include: { restaurant: true, items: { include: { menuItem: true } } },
  });

  const nearestDriver = await db.user.findFirst({
    where: { role: "DRIVER", status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
  });

  if (nearestDriver) {
    await db.order.update({
      where: { id: order.id },
      data: {
        driverId: nearestDriver.id,
        driverLat: nearestDriver.lat,
        driverLng: nearestDriver.lng,
      },
    });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(deliveryAddress ? { address: deliveryAddress } : {}),
      ...(typeof deliveryLat === "number" ? { lat: deliveryLat } : {}),
      ...(typeof deliveryLng === "number" ? { lng: deliveryLng } : {}),
    },
  });

  // Notify the restaurant owner (receptionist) about the new order so it appears
  // in their messages/notifications and they can see it immediately.
  try {
    const ownerId = order.restaurant?.ownerId;
    if (ownerId) {
      await db.message.create({
        data: {
          senderId: session.user.id,
          receiverId: ownerId,
          content: `New order ${order.orderNumber} from ${order.customer?.name || "a customer"}`,
          orderId: order.id,
        },
      });
    }
  } catch (err) {
    // Non-fatal: if messaging fails, don't block the order creation
    console.error("Failed to create owner notification:", err);
  }

  return NextResponse.json(order, { status: 201 });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CUSTOMER" || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  type CustomerOrderRow = { id: string };

  // Mark all orders for this customer as CANCELLED (soft-clear)
  try {
    const orders = await db.order.findMany({
      where: { customerId: session.user.id },
    });
    await Promise.all(
      (orders || []).map((o: CustomerOrderRow) =>
        db.order.update({ where: { id: o.id }, data: { status: "CANCELLED" } }),
      ),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to clear orders:", err);
    return NextResponse.json(
      { error: "Failed to clear orders" },
      { status: 500 },
    );
  }
}
