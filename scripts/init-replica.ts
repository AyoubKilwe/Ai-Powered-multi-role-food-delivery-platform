/**
 * MongoDB on this project uses a single-node replica set for local dev.
 * Run once: npm run mongo:init
 */
import { MongoClient } from "mongodb";

const uri =
  process.env.DATABASE_URL?.split("?")[0] ||
  "mongodb://127.0.0.1:27018/borama_food_delivery";

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const admin = client.db("admin");

  try {
    const status = await admin.command({ replSetGetStatus: 1 });
    console.log(`Replica set already active: ${status.set}`);
  } catch {
    console.log("Initializing single-node replica set (rs0)...");
    await admin.command({
      replSetInitiate: {
        _id: "rs0",
        members: [{ _id: 0, host: "127.0.0.1:27018" }],
      },
    });
    console.log("Done. Wait ~5 seconds, then run: npm run db:seed");
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
