/**
 * Full local setup: start MongoDB, init replica set, push schema, seed data.
 * No Administrator rights required.
 */
import { execSync } from "child_process";

function run(cmd: string) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: process.cwd(), env: process.env });
}

async function main() {
  console.log("=== Borama Food Delivery - Local Setup ===\n");

  run("tsx scripts/start-mongo.ts");

  console.log("\n=== Setup complete ===");
  console.log("Database: borama_food_delivery @ 127.0.0.1:27018");
  console.log("Run: npm run dev");
  console.log("\nDemo login (password: password123):");
  console.log("  customer@boramafood.com | driver@boramafood.com");
  console.log("  reception@hoyos.com   | admin@boramafood.com");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
