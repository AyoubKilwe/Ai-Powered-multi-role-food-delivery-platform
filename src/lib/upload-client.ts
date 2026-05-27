export type UploadFolder =
  | "restaurant-logos"
  | "restaurant-gallery"
  | "driver-docs";

export async function uploadFile(
  file: File,
  folder: UploadFolder,
): Promise<{ url?: string; error?: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/uploads?folder=${folder}`, {
    method: "POST",
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Upload failed" };
  return { url: data.url };
}
