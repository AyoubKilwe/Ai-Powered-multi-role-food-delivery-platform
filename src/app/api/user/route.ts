import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      lat: true,
      lng: true,
      role: true,
      status: true,
      vehiclePlate: true,
      vehicleType: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
      ...(typeof body.lat === "number" ? { lat: body.lat } : {}),
      ...(typeof body.lng === "number" ? { lng: body.lng } : {}),
      ...(body.vehiclePlate !== undefined && {
        vehiclePlate: body.vehiclePlate,
      }),
      ...(body.vehicleType !== undefined && { vehicleType: body.vehicleType }),
    },
  });

  return NextResponse.json(user);
}
