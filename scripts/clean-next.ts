import { rmSync, existsSync } from "fs";
import path from "path";

const targets = [
  path.join(process.cwd(), ".next"),
  path.join(process.cwd(), "node_modules", ".cache"),
];

for (const dir of targets) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`Removed ${path.basename(dir)}`);
  }
}

console.log("Cache clean complete. Restart with: npm run dev");
