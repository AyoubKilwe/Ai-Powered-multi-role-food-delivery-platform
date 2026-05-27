import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const imageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const driverDocTypes = new Set([
  ...imageTypes,
  "application/pdf",
]);

const folders: Record<
  string,
  { subdir: string; types: Set<string> }
> = {
  "restaurant-logos": {
    subdir: "restaurant-logos",
    types: imageTypes,
  },
  "restaurant-gallery": {
    subdir: "restaurant-gallery",
    types: imageTypes,
  },
  "driver-docs": {
    subdir: "driver-docs",
    types: driverDocTypes,
  },
};

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const folderKey = searchParams.get("folder") || "restaurant-logos";
  const config = folders[folderKey];

  if (!config) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  if (!config.types.has(file.type)) {
    return NextResponse.json(
      {
        error:
          folderKey === "driver-docs"
            ? "Allowed: images or PDF"
            : "Only image files are allowed",
      },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type.split("/")[1] || "png";
  const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", config.subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);

  return NextResponse.json({
    url: `/uploads/${config.subdir}/${fileName}`,
  });
}
