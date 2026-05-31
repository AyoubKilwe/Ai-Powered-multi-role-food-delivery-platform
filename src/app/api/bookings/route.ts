import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.status !== "ACTIVE")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where =
    session.user.role === "CUSTOMER"
      ? { customerId: session.user.id }
      : session.user.restaurantId
        ? { restaurantId: session.user.restaurantId }
        : {};

  const bookings = await db.booking.findMany({
    where,
    include: {
      restaurant: true,
      table: true,
      customer: { select: { name: true, phone: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CUSTOMER" || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { restaurantId, date, timeSlot, guests, tableId } = body;
  const customerPhone =
    typeof body?.phone === "string" && body.phone.trim()
      ? body.phone.trim()
      : ((session.user as { phone?: string }).phone || "");

  const booking = await db.booking.create({
    data: {
      restaurantId,
      customerId: session.user.id,
      customerNameSnapshot: session.user.name || "Guest",
      customerPhoneSnapshot: customerPhone,
      status: "PENDING",
      date: new Date(date),
      timeSlot,
      guests: parseInt(guests),
      tableId: tableId || null,
    },
    include: { restaurant: true, table: true },
  });

  // Notify restaurant owner (receptionist) about the new booking so it appears in their inbox
  try {
    const restaurant = booking.restaurant;
    const ownerId = restaurant?.ownerId;
    if (ownerId) {
      await db.message.create({
        data: {
          senderId: session.user.id,
          receiverId: ownerId,
          content: `New booking for ${booking.date.toString()} — ${booking.timeSlot} for ${booking.guests} guests`,
          orderId: null,
        },
      });
    }
  } catch (err) {
    console.error("Failed to notify owner about booking:", err);
  }

  return NextResponse.json(booking, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST" || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();
  const existingBooking = (await db.booking.findMany({
    where: { id },
    include: { restaurant: true, customer: true, table: true },
  }))[0];

  if (!existingBooking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updatedBooking = await db.booking.update({
    where: { id },
    data: { status },
  });

  if (status === "CONFIRMED" || status === "CANCELLED") {
    try {
      await db.message.create({
        data: {
          senderId: session.user.id,
          receiverId: existingBooking.customerId,
          content:
            status === "CONFIRMED"
              ? `Your booking at ${existingBooking.restaurant?.name || "the restaurant"} for ${new Date(existingBooking.date).toISOString().slice(0, 10)} was confirmed.`
              : `Your booking at ${existingBooking.restaurant?.name || "the restaurant"} was cancelled.`,
          orderId: null,
        },
      });
    } catch (err) {
      console.error("Failed to notify customer about booking status:", err);
    }
  }

  return NextResponse.json(updatedBooking);
}
