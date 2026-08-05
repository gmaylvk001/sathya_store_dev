import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { writeFile, unlink } from "fs/promises";
// app/api/brand/route.js
export async function PUT(req) {
  try {
    await dbConnect();
    
    const formData = await req.formData();
    const id = formData.get("id");
    const brand_name = formData.get("brand_name");
    const status = formData.get("status");
    const image = formData.get("image");
    const existingImage = formData.get("existingImage");

    // Validate required fields
    if (!id || !brand_name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the existing brand
    const existingBrand = await Brand.findById(id);
    if (!existingBrand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    // Handle image upload
    /* let imagePath = existingBrand.image;
    if (image && image.name) {
      // Delete old image if it exists
      if (existingImage) {
        try {
          const oldImagePath = path.join(process.cwd(), "public", existingImage);
          await unlink(oldImagePath);
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }

      // Save new image
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(image.name);
      const fileName = `brand_${Date.now()}${ext}`;
      const filePath = path.join(process.cwd(), "public/uploads/brands", fileName);

      await writeFile(filePath, buffer);
      imagePath = `${fileName}`; 
    } */

       // Existing image name from DB
    let imagePath = existingBrand.image;

    // Upload new image
    if (image && image.name) {

      // Delete old image
      if (existingBrand.image) {
        try {
          const oldImagePath = path.join(
            process.cwd(),
            "public",
            "uploads",
            "Brands",
            path.basename(existingBrand.image)
          );

          // Check file exists
          await fs.access(oldImagePath);

          // Delete file
          await fs.unlink(oldImagePath);

        } catch (err) {
          console.log("Old image not found or already deleted");
        }
      }

      // Save new image
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(image.name);
      const fileName = `brand_${Date.now()}${ext}`;

      const newFilePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "Brands",
        fileName
      );
      await writeFile(newFilePath, buffer);
      
      imagePath = fileName;
    }


    // Update the brand
    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      {
        brand_name,
        brand_slug: brand_name.toLowerCase().replace(/\s+/g, "-"),
        status,
        image: imagePath
      },
      { new: true }
    );

    return NextResponse.json(
      { 
        success: true, 
        message: "Brand updated successfully",
        data: updatedBrand 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}