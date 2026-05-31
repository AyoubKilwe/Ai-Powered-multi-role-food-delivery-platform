import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json(
      { error: "restaurantId required" },
      { status: 400 },
    );
  }

  const items = await db.menuItem.findMany({
    where: { restaurantId },
    select: {
      id: true,
      categoryId: true,
      name: true,
      price: true,
      description: true,
      image: true,
      isAvailable: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const categories = await db.menuCategory.findMany({
    where: { restaurantId },
    select: {
      id: true,
      name: true,
      items: {
        select: {
          id: true,
          categoryId: true,
          name: true,
          price: true,
          description: true,
          image: true,
          isAvailable: true,
        },
      },
    },
  });

  return NextResponse.json({ items, categories });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== "RECEPTIONIST" ||
    session.user.status !== "ACTIVE" ||
    !session.user.restaurantId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const restaurantId = session.user.restaurantId;

  if (body.type === "category") {
    const cat = await db.menuCategory.create({
      data: { name: body.name, restaurantId },
    });
    return NextResponse.json(cat);
  }

  const item = await db.menuItem.create({
    data: {
      name: body.name,
      description: body.description,
      price: parseFloat(body.price),
      image: body.image,
      restaurantId,
      categoryId: body.categoryId,
    },
  });
  return NextResponse.json(item);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST" || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.type === "category") {
    if (body.action === "create") {
      const cat = await db.menuCategory.create({
        data: { name: body.name, restaurantId: body.restaurantId },
      });
      return NextResponse.json(cat);
    }

    if (body.action === "update") {
      const category = await db.menuCategory.update({
        where: { id: body.id },
        data: { name: body.name },
      });
      return NextResponse.json(category);
    }

    if (body.action === "delete") {
      await db.menuItem.updateMany({
        where: { categoryId: body.id },
        data: { categoryId: null },
      });
      await db.menuCategory.delete({ where: { id: body.id } });
      return NextResponse.json({ success: true });
    }
  }

  const { id, ...data } = body;
  const item = await db.menuItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST" || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.menuItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
