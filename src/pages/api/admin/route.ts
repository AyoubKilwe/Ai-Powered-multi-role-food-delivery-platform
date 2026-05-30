import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Fallback placeholder used to satisfy the pages-layer build.
  // Real API is implemented under the App Router at /src/app/api/admin/route.ts
  res
    .status(200)
    .json({ ok: true, message: "pages-api fallback for /api/admin" });
}
