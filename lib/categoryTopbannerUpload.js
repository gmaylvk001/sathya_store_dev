import fs from "fs";
import path from "path";
import sharp from "sharp";

export async function saveCategoryTopBannerImage(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Invalid image file");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    await sharp(buffer).metadata();
  } catch {
    throw new Error("Invalid image file. Please upload a valid image.");
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

  const safeName = (file.name || "image").replace(/\s/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  await sharp(buffer).toFile(path.join(uploadDir, filename));

  return `/uploads/category-topbanner/${filename}`;
}
