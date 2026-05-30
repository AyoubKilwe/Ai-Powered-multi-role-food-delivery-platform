"use strict";

import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

async function main() {
  const demo = [
    {
      email: "admin@boramafood.com",
      name: "Platform Admin",
      role: "ADMIN",
      password: "Admin@12345!",
    },
    {
      email: "customer@boramafood.com",
      name: "Demo Customer",
      role: "CUSTOMER",
      password: "Customer@12345!",
    },
    {
      email: "driver@boramafood.com",
      name: "Delivery Driver",
      role: "DRIVER",
      password: "Driver@12345!",
    },
    {
      email: "reception@hoyos.com",
      name: "Receptionist",
      role: "RECEPTIONIST",
      password: "Reception@12345!",
    },
  ];

  for (const u of demo) {
    const hashed = await bcrypt.hash(u.password, 10);
    const existing = await db.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await db.user.update({
        where: { email: u.email },
        data: {
          name: u.name,
          password: hashed,
          role: u.role,
          status: "ACTIVE",
        },
      });
      console.log(`Updated user: ${u.email}`);
    } else {
      await db.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: hashed,
          role: u.role,
          status: "ACTIVE",
        },
      });
      console.log(`Created user: ${u.email}`);
    }
  }

  await db.$disconnect();
}

main()
  .then(() => {
    console.log(
      [
        "Seeding complete. Demo login credentials:",
        "- ADMIN: admin@boramafood.com / Admin@12345!",
        "- CUSTOMER: customer@boramafood.com / Customer@12345!",
        "- DRIVER: driver@boramafood.com / Driver@12345!",
        "- RECEPTIONIST: reception@hoyos.com / Reception@12345!",
      ].join("\n"),
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
