/*
 Backfill script: set createdAt for orders missing it by deriving from ObjectId timestamp.
 Run locally with Node: node scripts/backfill-createdAt.js
 Requires DATABASE_URL in environment or .env.
*/

const { MongoClient, ObjectId } = require("mongodb");
// load .env if dotenv available (optional)
try {
  require("dotenv").config();
} catch (e) {
  // dotenv not installed in this environment; rely on process.env
}

async function main() {
  const uri =
    process.env.DATABASE_URL ||
    "mongodb://127.0.0.1:27018/borama_food_delivery";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const orders = db.collection("orders");
    const cursor = orders.find({ createdAt: { $exists: false } });
    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) break;
      const id = doc._id;
      if (id instanceof ObjectId) {
        const ts = id.getTimestamp();
        await orders.updateOne({ _id: id }, { $set: { createdAt: ts } });
        console.log("Updated order", id.toHexString(), "->", ts.toISOString());
        count++;
      }
    }
    console.log("Backfill complete. Updated", count, "orders.");
  } catch (err) {
    console.error("Backfill failed", err);
  } finally {
    await client.close();
  }
}

if (require.main === module) main();
