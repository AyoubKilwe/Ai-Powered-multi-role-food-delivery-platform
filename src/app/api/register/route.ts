import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getDashboardPath } from "@/lib/dashboard";
import type { Role } from "@/lib/roles";
import { z } from "zod";

const docSchema = z.object({
  type: z.string(),
  fileUrl: z.string(),
});

const schema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    role: z.enum(["CUSTOMER", "DRIVER", "RECEPTIONIST"]),
    restaurantName: z.string().optional(),
    restaurantPhone: z.string().optional(),
    restaurantPhones: z.array(z.string()).optional(),
    restaurantAbout: z.string().optional(),
    restaurantLogo: z.string().optional(),
    restaurantImages: z.array(z.string()).optional(),
    vehiclePlate: z.string().optional(),
    vehicleType: z.string().optional(),
    driverDocuments: z.array(docSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "CUSTOMER" || data.role === "RECEPTIONIST") {
      if (typeof data.lat !== "number" || typeof data.lng !== "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Location is required. Use GPS or enter coordinates.",
          path: ["lat"],
        });
      }
    }
    if (data.role === "RECEPTIONIST" && !data.restaurantName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Restaurant name is required",
        path: ["restaurantName"],
      });
    }
    if (data.role === "DRIVER") {
      const docs = data.driverDocuments || [];
      const required = ["Driving License", "National ID"];
      for (const t of required) {
        if (!docs.some((d) => d.type === t && d.fileUrl)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${t} upload is required`,
            path: ["driverDocuments"],
          });
        }
      }
      if (!data.vehiclePlate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vehicle plate is required",
          path: ["vehiclePlate"],
        });
      }
      if (!data.vehicleType?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vehicle type is required",
          path: ["vehicleType"],
        });
      }
    }
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.trim().toLowerCase();

    const exists = await db.user.findUnique({
      where: { email },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const status = data.role === "DRIVER" ? "PENDING" : "ACTIVE";

    const phones =
      data.restaurantPhones?.filter(Boolean) ||
      (data.restaurantPhone ? [data.restaurantPhone] : []);

    const user = await db.user.create({
      data: {
        name: data.name,
        email,
        phone: data.phone,
        password: hashed,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        role: data.role as Role,
        status,
        ...(data.role === "DRIVER"
          ? {
              vehiclePlate: data.vehiclePlate,
              vehicleType: data.vehicleType,
            }
          : {}),
      },
    });

    if (data.role === "RECEPTIONIST" && data.restaurantName) {
      await db.restaurant.create({
        data: {
          name: data.restaurantName,
          cuisine: "Somali",
          phone: phones[0] || data.phone || "",
          phones,
          address: data.address || "Borama, Somaliland",
          lat: data.lat,
          lng: data.lng,
          description: data.restaurantAbout || "",
          logo: data.restaurantLogo || null,
          images: data.restaurantImages || [],
          ownerId: user.id,
        },
      });
    }

    if (data.role === "DRIVER" && data.driverDocuments?.length) {
      await db.driverDocument.createMany({
        data: data.driverDocuments.map((d) => ({
          type: d.type,
          fileUrl: d.fileUrl,
          driverId: user.id,
          verified: false,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      redirect: getDashboardPath(data.role as Role),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.errors[0]?.message || "Invalid data" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
