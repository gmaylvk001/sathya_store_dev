import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { writeFile } from "fs/promises";
import fs from "fs";
import path from "path";
import {
  calculateComboPricing,
  generateComboMarketingImage,
} from "@/lib/comboOffers";
import Product from "@/models/product";

/**
 * POST multipart: company logo upload
 * Fields: logo (file)
 */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const action = formData.get("action") || "logo";

    if (action === "pricing") {
      await dbConnect();
      const productIds = JSON.parse(formData.get("productIds") || "[]");
      const discountPercent = Number(formData.get("discountPercent") || 0);
      const products = await Product.find({ _id: { $in: productIds } }).lean();
      const pricing = calculateComboPricing(products, discountPercent);
      return NextResponse.json({ success: true, data: pricing });
    }

    if (action === "regenerate-image") {
      await dbConnect();
      const productIds = JSON.parse(formData.get("productIds") || "[]");
      const products = await Product.find({ _id: { $in: productIds } }).lean();
      const productImages = products
        .map((p) => (Array.isArray(p.images) ? p.images[0] : null))
        .filter(Boolean);

      const marketingImage = await generateComboMarketingImage({
        offerTitle: formData.get("offerTitle") || "",
        purpose: formData.get("purpose") || "",
        brandName: formData.get("brandName") || "",
        companyLogo: formData.get("companyLogo") || "",
        productImages,
      });
      return NextResponse.json({ success: true, data: { marketingImage } });
    }

    const file = formData.get("logo");
    if (!file || typeof file.name !== "string") {
      return NextResponse.json(
        { success: false, error: "No logo file" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "combo-branding");
    if (!fs.existsSync(uploadDir)) {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    }

    const filename = `logo-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({
      success: true,
      data: { companyLogo: `/uploads/combo-branding/${filename}` },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
