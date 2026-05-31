import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function fmt(n: number) {
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECEPTIONIST" || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") || "monthly") as string;
  let startDate = new Date();
  if (range === "daily") {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === "weekly") {
    startDate = new Date(Date.now() - 7 * 86400000);
  } else {
    startDate = new Date(Date.now() - 30 * 86400000);
  }

  const restaurantId = session.user.restaurantId;
  if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

  const orders = await db.order.findMany({
    where: { restaurantId, status: "DELIVERED", createdAt: { gte: startDate } },
    orderBy: { createdAt: "asc" },
    select: { orderNumber: true, createdAt: true, subtotal: true, deliveryFee: true, serviceTax: true, total: true },
  });

  const header = [
    "orderNumber",
    "date",
    "subtotal",
    "deliveryFee",
    "serviceTax",
    "platformFee",
    "driverFee",
    "restaurantPayout",
    "total",
  ];

  const rows = [header];
  for (const o of orders) {
    const subtotal = Number(o.subtotal || 0);
    const deliveryFee = Number(o.deliveryFee || 0);
    const serviceTax = Number(o.serviceTax || 0);
    const platformFee = subtotal * 0.05;
    const driverFee = 1;
    const restaurantPayout = subtotal * 0.95;
    rows.push([
      o.orderNumber,
      new Date(String(o.createdAt)).toISOString(),
      fmt(subtotal),
      fmt(deliveryFee),
      fmt(serviceTax),
      fmt(platformFee),
      fmt(driverFee),
      fmt(restaurantPayout),
      fmt(Number(o.total || 0)),
    ]);
  }

  // CSV escape
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          if (s.includes(",") || s.includes("\n") || s.includes('"')) {
            return '"' + s.replace(/"/g, '""') + '"';
          }
          return s;
        })
        .join(","),
    )
    .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payouts-${range}.csv"`,
    },
  });
}
