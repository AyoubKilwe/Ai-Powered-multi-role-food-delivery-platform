import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
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
  if (!session || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { restaurantId, date, timeSlot, guests, tableId } = await req.json();

  const booking = await db.booking.create({
    data: {
      restaurantId,
      customerId: session.user.id,
      date: new Date(date),
      timeSlot,
      guests: parseInt(guests),
      tableId: tableId || null,
    },
    include: { restaurant: true, table: true },
  });

  return NextResponse.json(booking, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();
  const booking = await db.booking.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(booking);
}
