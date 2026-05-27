"use strict";

import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

async function main() {
  const demo = [
    {
      email: "admin@boramafood.com",
      name: "Platform Admin",
      role: "ADMIN",
      password: "password123",
    },
    {
      email: "driver@boramafood.com",
      name: "Delivery Driver",
      role: "DRIVER",
      password: "password123",
    },
    {
      email: "reception@hoyos.com",
      name: "Receptionist",
      role: "RECEPTIONIST",
      password: "password123",
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
    console.log("Seeding complete. Use the demo passwords: password123");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
