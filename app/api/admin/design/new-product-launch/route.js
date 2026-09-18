import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import LaunchProduct from "@/models/LaunchProduct";
import fs from "fs";
import path from "path";

async function saveFile(file, type) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "new-product-launch");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Clean up filename and append type
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filename = `${Date.now()}-${type}-${safeName}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, buffer);

    return "/uploads/new-product-launch/" + filename;
  } catch (err) {
    console.error("Save file error:", err);
    throw err;
  }
}

export async function GET() {
  try {
    await dbConnect();
    const launchProducts = await LaunchProduct.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: launchProducts || [] });
  } catch (err) {
    console.error("Error in GET /api/admin/design/new-product-launch:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const product_name = formData.get("product_name");
    const products = formData.get("products") || "";
    const stock_status = formData.get("stock_status") || "Choose";
    const status = formData.get("status") || "Choose";
    const page_design = formData.get("page_design") || "Choose";
    
    const desktop_image_files = formData.getAll("desktop_images");
    const mobile_image_files = formData.getAll("mobile_images");

    if (!product_name) {
      return NextResponse.json(
        { success: false, message: "Product Name is required" },
        { status: 400 }
      );
    }

    let desktop_images = [];
    for (const file of desktop_image_files) {
      if (file && file.size > 0) {
        desktop_images.push(await saveFile(file, "desktop"));
      }
    }

    let mobile_images = [];
    for (const file of mobile_image_files) {
      if (file && file.size > 0) {
        mobile_images.push(await saveFile(file, "mobile"));
      }
    }

    const newProduct = new LaunchProduct({
      product_name,
      products,
      stock_status,
      status,
      page_design,
      desktop_images,
      mobile_images,
    });

    await newProduct.save();

    return NextResponse.json({ success: true, data: newProduct });
  } catch (err) {
    console.error("POST ERROR in new-product-launch:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create" },
      { status: 500 }
    );
  }
}
