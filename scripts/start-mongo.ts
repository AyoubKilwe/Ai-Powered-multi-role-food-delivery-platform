import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const mongoDir = path.join(process.cwd(), "mongodb");
const dataDir = path.join(mongoDir, "data");
const logDir = path.join(mongoDir, "log");
const configPath = path.join(mongoDir, "mongod.conf");
const pidFile = path.join(mongoDir, "mongod.pid");

const mongodPaths = [
  "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe",
  "C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe",
  "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe",
];

function findMongod(): string {
  for (const p of mongodPaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    "mongod.exe not found. Install MongoDB Community Server or add mongod to PATH."
  );
}

async function isRunning(): Promise<boolean> {
  if (!fs.existsSync(pidFile)) return false;
  const pid = parseInt(fs.readFileSync(pidFile, "utf8").trim(), 10);
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForMongo(port: number, maxMs = 30000): Promise<void> {
  const { MongoClient } = await import("mongodb");
  const uri = `mongodb://127.0.0.1:${port}/?directConnection=true`;
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      await client.close();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw new Error(`MongoDB did not start on port ${port} within ${maxMs}ms`);
}

async function ensureReplicaSet(port: number) {
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(`mongodb://127.0.0.1:${port}/?directConnection=true`);
  await client.connect();
  const admin = client.db("admin");
  try {
    await admin.command({ replSetGetStatus: 1 });
    console.log("Replica set rs0 ready");
  } catch {
    console.log("Initializing replica set rs0...");
    await admin.command({
      replSetInitiate: {
        _id: "rs0",
        members: [{ _id: 0, host: `127.0.0.1:${port}` }],
      },
    });
    await new Promise((r) => setTimeout(r, 6000));
    console.log("Replica set initialized");
  }
  await client.close();
}

async function main() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });

  if (await isRunning()) {
    console.log("Local MongoDB already running (port 27018)");
    await waitForMongo(27018);
    await ensureReplicaSet(27018);
    return;
  }

  const mongod = findMongod();
  console.log(`Starting MongoDB: ${mongod}`);

  const child = spawn(mongod, [`--config`, configPath], {
    cwd: mongoDir,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });

  child.unref();
  if (child.pid) fs.writeFileSync(pidFile, String(child.pid));

  await waitForMongo(27018);
  await ensureReplicaSet(27018);
  console.log("MongoDB ready on mongodb://127.0.0.1:27018");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
