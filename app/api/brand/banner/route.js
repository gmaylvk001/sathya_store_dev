import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ✅ GET all brands with banners
export async function GET() {
  try {
    await dbConnect();
    const brands = await Brand.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, brands });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ✅ POST: Add/Edit brand or add/edit banner
export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const brandId = formData.get("brandId");
    const bannerId = formData.get("bannerId"); // optional for editing banner
    const brand_name = formData.get("brand_name");
    const brand_slug = formData.get("brand_slug");
    const status = formData.get("status");
    const banner_name = formData.get("banner_name");
    const redirect_url = formData.get("redirect_url");
    const banner_status = formData.get("banner_status");

    // Brand Image upload
    let brandImagePath = null;
    const brandImage = formData.get("brandImage");
    if (brandImage && typeof brandImage === "object") {
      const buffer = Buffer.from(await brandImage.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public/uploads/brands");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `${Date.now()}_${brandImage.name}`;
      brandImagePath = `/uploads/brands/${filename}`;
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
    }

    // Banner Image upload
    let bannerImagePath = null;
    const bannerImage = formData.get("bannerImage");
    if (bannerImage && typeof bannerImage === "object") {
      const buffer = Buffer.from(await bannerImage.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public/uploads/banners");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `${Date.now()}_${bannerImage.name}`;
      bannerImagePath = `/uploads/banners/${filename}`;
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
    }

    let brand;

    if (brandId) {
      // 🔹 Update brand info
      const updateData = { brand_name, brand_slug, status, updatedAt: new Date() };
      if (brandImagePath) updateData.image = brandImagePath;

      brand = await Brand.findByIdAndUpdate(brandId, updateData, { new: true });

      // 🔹 Add/Edit banner
      if (banner_name && bannerImagePath) {
        if (bannerId) {
          // Edit existing banner
          const bannerIndex = brand.banners.findIndex(b => b._id.toString() === bannerId);
          if (bannerIndex !== -1) {
            brand.banners[bannerIndex] = {
              ...brand.banners[bannerIndex]._doc,
              banner_name,
              banner_image: bannerImagePath,
              redirect_url,
              banner_status,
            };
          }
        } else {
          // Add new banner
          brand.banners.push({ banner_name, banner_image: bannerImagePath, redirect_url, banner_status });
        }
        await brand.save();
        console.log("Updated brand with banners:", brand);
      }
    } else {
      // 🔹 Create new brand with optional banner
      const banners = banner_name && bannerImagePath ? [{ banner_name, banner_image: bannerImagePath, redirect_url, banner_status }] : [];
      brand = await Brand.create({
        brand_name,
        brand_slug,
        status,
        image: brandImagePath,
        banners,
      });
    }

    return NextResponse.json({ success: true, brand });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ✅ DELETE brand or banner
export async function DELETE(req) {
  try {
    await dbConnect();
    const { brandId, bannerId } = await req.json();

    if (bannerId) {
      // Delete a banner from brand
      const brand = await Brand.findById(brandId);
      if (!brand) return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
      brand.banners = brand.banners.filter(b => b._id.toString() !== bannerId);
      await brand.save();
      return NextResponse.json({ success: true, message: "Banner deleted", brand });
    }

    if (brandId) {
      // Delete brand
      await Brand.findByIdAndDelete(brandId);
      return NextResponse.json({ success: true, message: "Brand deleted" });
    }

    return NextResponse.json({ success: false, error: "brandId or bannerId required" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
