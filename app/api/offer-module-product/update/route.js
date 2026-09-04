import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferModuleProduct from "@/models/OfferModuleProduct";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PUT(req) {
  try {
    await dbConnect();
    const formData = await req.formData();
    
    const id = formData.get("id");
    const productName = formData.get("productName");
    const offerId = formData.get("offerId");
    const productSellingType = formData.get("productSellingType");
    const price = formData.get("price");
    const specialPrice = formData.get("specialPrice");
    const categories = formData.get("categories");
    const isCombo = formData.get("isCombo");
    const existingImage = formData.get("existingImage");
    const file = formData.get("primaryImage");

    if (!id || !productName || !offerId) {
      return NextResponse.json({ success: false, error: "ID, Product name, and Offer are required" }, { status: 400 });
    }

    let image_url = existingImage || "";
    if (file && file.size > 0) {
      const uploadDir = path.join(process.cwd(), "public/uploads/OfferProducts");
      
      // Ensure the directory exists
      await mkdir(uploadDir, { recursive: true });

      const buffer = Buffer.from(await file.arrayBuffer());
      const timestamp = Date.now();
      const ext = path.extname(file.name || "") || ".img";
      const filename = `offer-product-${timestamp}${ext}`;
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      image_url = filename;
    }

    const updatedProduct = await OfferModuleProduct.findByIdAndUpdate(
      id,
      {
        productName,
        offerId,
        productSellingType,
        price: price ? parseFloat(price) : undefined,
        specialPrice: specialPrice ? parseFloat(specialPrice) : undefined,
        categories,
        isCombo,
        primaryImage: image_url,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ success: false, error: "Offer Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Offer Product updated successfully", data: updatedProduct }, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/offer-module-product/update:", error);
    return NextResponse.json({ success: false, error: "Error updating offer product", message: error?.message }, { status: 500 });
  }
}
