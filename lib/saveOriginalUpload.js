import fs from "fs";
import path from "path";
import { assertAllowedCategoryPageImage } from "@/lib/categoryPageComponents/registry";

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/x-ms-bmp": "bmp",
  "image/tiff": "tiff",
  "image/tif": "tiff",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

/** Keep the original filename extension when present; otherwise map from MIME. */
export function originalUploadExtension(file) {
  const fromName = path
    .extname(String(file?.name || ""))
    .replace(/^\./, "")
    .toLowerCase();
  if (fromName) return fromName;
  const mime = String(file?.type || "").toLowerCase();
  return MIME_TO_EXT[mime] || "img";
}

export function originalUploadBasename(file) {
  const raw = String(file?.name || "image").replace(/\s/g, "_");
  const withoutExt = raw.replace(/\.[^.]+$/, "");
  return withoutExt || "image";
}

export async function readUploadBuffer(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Invalid image file");
  }
  const mime = String(file?.type || "").toLowerCase();
  if (mime && !mime.startsWith("image/") && mime !== "application/octet-stream") {
    throw new Error("Invalid image file");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) {
    throw new Error("Invalid image file");
  }
  return buffer;
}

export function writeOriginalUpload(buffer, folder, filename) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

/**
 * Save the uploaded bytes as-is (no format conversion).
 * `filenamePrefix` is the name without extension, e.g. `${Date.now()}-topbanner`.
 */
export async function saveOriginalImageUpload(file, folder, filenamePrefix) {
  assertAllowedCategoryPageImage(file);
  const buffer = await readUploadBuffer(file);
  const ext = originalUploadExtension(file);
  const filename = filenamePrefix
    ? `${filenamePrefix}.${ext}`
    : `${Date.now()}-${originalUploadBasename(file)}.${ext}`;
  const publicPath = writeOriginalUpload(buffer, folder, filename);
  return { path: publicPath, filename };
}
