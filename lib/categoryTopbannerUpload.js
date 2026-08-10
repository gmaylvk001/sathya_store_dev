import fs from "fs";
import path from "path";
import sharp from "sharp";

function detectImageKind(buffer) {
  if (!buffer || buffer.length < 12) return null;

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
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (brand.includes("avif")) return "avif";
    if (
      brand.includes("heic") ||
      brand.includes("heif") ||
      brand.includes("mif1") ||
      brand.includes("msf1")
    ) {
      return "heic";
    }
  }
  return null;
}

/**
 * Save Top Banner image. Supports JPG, PNG, WebP, GIF, AVIF, and HEIC/HEIF.
 */
export async function saveCategoryTopBannerImage(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Invalid image file");
  }

  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);
  let kind = detectImageKind(buffer);
  const originalName = (file.name || "image.jpg").toLowerCase();

  if (
    !kind &&
    (originalName.endsWith(".heic") ||
      originalName.endsWith(".heif") ||
      file.type === "image/heic" ||
      file.type === "image/heif")
  ) {
    kind = "heic";
  }

  if (kind === "heic") {
    try {
      const convert = (await import("heic-convert")).default;
      buffer = Buffer.from(
        await convert({
          buffer,
          format: "JPEG",
          quality: 0.9,
        })
      );
      kind = "jpg";
    } catch {
      throw new Error(
        "Could not convert HEIC/HEIF. Please upload JPG, PNG, WebP, GIF, or AVIF."
      );
    }
  }

  try {
    await sharp(buffer, { failOn: "none" }).metadata();
  } catch {
    throw new Error(
      "Invalid image file. Please upload JPG, PNG, WebP, GIF, AVIF, or HEIC."
    );
  }

  if (
    !(
      kind === "jpg" ||
      kind === "png" ||
      kind === "webp" ||
      kind === "gif" ||
      kind === "avif"
    )
  ) {
    // Sharp validated it — keep original extension when possible
    kind = kind || "jpg";
  }

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "category-topbanner"
  );
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = kind === "jpg" ? "jpg" : kind || "jpg";
  const filename = `${Date.now()}-topbanner.${ext}`;
  const outPath = path.join(uploadDir, filename);

  if (kind === "jpg" || kind === "png" || kind === "webp" || kind === "gif" || kind === "avif") {
    await fs.promises.writeFile(outPath, buffer);
  } else {
    await sharp(buffer, { failOn: "none" })
      .webp({ quality: 85 })
      .toFile(outPath.replace(/\.[^.]+$/, ".webp"));
    return `/uploads/category-topbanner/${filename.replace(/\.[^.]+$/, ".webp")}`;
  }

  return `/uploads/category-topbanner/${filename}`;
}
