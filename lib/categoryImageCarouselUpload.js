import fs from "fs";
import path from "path";
import sharp from "sharp";
import convert from "heic-convert";

/**
 * Detect container from magic bytes (don't trust filename alone).
 */
function detectImageKind(buffer) {
  if (!buffer || buffer.length < 12) return "unknown";

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  if (buffer.toString("ascii", 0, 3) === "GIF") {
    return "gif";
  }

  // ISO BMFF (HEIC / HEIF / AVIF) — "ftyp" at offset 4
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (brand.includes("avif")) return "avif";
    if (
      brand.includes("heic") ||
      brand.includes("heif") ||
      brand.includes("mif1") ||
      brand.includes("msf1")
    ) {
      return "heif";
    }
  }

  return "unknown";
}

async function convertHeicToJpeg(buffer) {
  const output = await convert({
    buffer,
    format: "JPEG",
    quality: 0.92,
  });
  return Buffer.from(output);
}

/**
 * Save carousel image. Keeps original dimensions.
 * HEIC/HEIF is auto-converted to JPG. JPG/PNG/WebP/GIF saved as-is.
 */
export async function saveCategoryImageCarouselImage(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Invalid image file");
  }

  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);
  const originalName = (file.name || "image.jpg").toLowerCase();
  const mime = (file.type || "").toLowerCase();

  let kind = detectImageKind(buffer);
  const looksHeic =
    kind === "heif" ||
    originalName.endsWith(".heic") ||
    originalName.endsWith(".heif") ||
    mime.includes("heic") ||
    mime.includes("heif");

  if (looksHeic) {
    try {
      buffer = await convertHeicToJpeg(buffer);
      kind = "jpg";
    } catch (err) {
      console.error("HEIC convert failed:", err);
      throw new Error(
        "Could not convert HEIC image. Please export as JPG or PNG and try again."
      );
    }
  }

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "category-image-carousel"
  );
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const base = `${Date.now()}-${(file.name || "image")
    .replace(/\s/g, "_")
    .replace(/\.[^.]+$/, "")}`;

  if (kind === "jpg" || kind === "png" || kind === "webp" || kind === "gif") {
    const ext = kind === "jpg" ? "jpg" : kind;
    const filename = `${base}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    let width;
    let height;
    try {
      const meta = await sharp(buffer, { failOn: "none" }).metadata();
      width = meta.width;
      height = meta.height;
    } catch {
      // dimensions optional
    }

    return {
      path: `/uploads/category-image-carousel/${filename}`,
      width,
      height,
    };
  }

  try {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    if (meta.format === "heif") {
      buffer = await convertHeicToJpeg(buffer);
      const filename = `${base}.jpg`;
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      const jpgMeta = await sharp(buffer, { failOn: "none" }).metadata();
      return {
        path: `/uploads/category-image-carousel/${filename}`,
        width: jpgMeta.width,
        height: jpgMeta.height,
      };
    }

    const filename = `${base}.webp`;
    await sharp(buffer, { failOn: "none" })
      .rotate()
      .webp({ quality: 85 })
      .toFile(path.join(uploadDir, filename));

    return {
      path: `/uploads/category-image-carousel/${filename}`,
      width: meta.width,
      height: meta.height,
    };
  } catch (err) {
    console.error("Image carousel upload failed:", err);
    throw new Error(
      "Could not process this image. Please upload a JPG, PNG, WebP, or HEIC file."
    );
  }
}
