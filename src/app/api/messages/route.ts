import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.status !== "ACTIVE")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const withUserId = searchParams.get("with");

  const messages = await db.message.findMany({
    where: {
      OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      ...(orderId ? { orderId } : {}),
      ...(withUserId
        ? {
            OR: [
              { senderId: session.user.id, receiverId: withUserId },
              { senderId: withUserId, receiverId: session.user.id },
            ],
          }
        : {}),
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.status !== "ACTIVE")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, content, orderId } = await req.json();
  if (!receiverId || !content?.trim()) {
    return NextResponse.json(
      { error: "receiverId and content required" },
      { status: 400 },
    );
  }

  const message = await db.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content: content.trim(),
      orderId: orderId || null,
    },
    include: {
      sender: { select: { name: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
