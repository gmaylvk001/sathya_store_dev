import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  //const categories = await Category.find().sort({ createdAt: -1 });
  const categories = await Category.find({ status: "Active" }).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, categories });
}

export async function POST(req) {
  await dbConnect();
  try {
    const formData = await req.formData();

    const categoryId = formData.get("categoryId");
    const bannerId = formData.get("bannerId");
    const category_name = formData.get("category_name");
    const category_slug = formData.get("category_slug");
    const md5_cat_name = formData.get("md5_cat_name");
    const status = formData.get("status");
    const banner_name = formData.get("banner_name");
    const redirect_url = formData.get("redirect_url");
    const banner_status = formData.get("banner_status");
    const bannerFile = formData.get("bannerImage");

    let bannerImagePath = null;

    if (bannerFile && bannerFile.size > 0) {
      const buffer = Buffer.from(await bannerFile.arrayBuffer());
      const filename = `${Date.now()}-${bannerFile.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      bannerImagePath = "/uploads/" + filename;
    }

    let category;

    if (categoryId) {
      category = await Category.findById(categoryId);
      if (!category) return NextResponse.json({ success: false, error: "Category not found" });

      if (bannerId) {
        // edit banner
        const banner = category.banners.id(bannerId);
        if (!banner) return NextResponse.json({ success: false, error: "Banner not found" });
        banner.banner_name = banner_name;
        banner.redirect_url = redirect_url;
        banner.banner_status = banner_status;
        if (bannerImagePath) banner.banner_image = bannerImagePath;
      } else {
        // add new banner
        if (!bannerImagePath) {
          return NextResponse.json({ success: false, error: "Banner image required" });
        }
        if (!category.banners) category.banners = [];
        category.banners.push({
          banner_name,
          banner_image: bannerImagePath,
          redirect_url,
          banner_status,
        });
      }

      await category.save();
    } else {
      // create new category
      category = new Category({
        category_name,
        category_slug,
        md5_cat_name,
        status,
        banners: [],
      });

      if (banner_name && bannerImagePath) {
        category.banners.push({
          banner_name,
          banner_image: bannerImagePath,
          redirect_url,
          banner_status,
        });
      }

      await category.save();
    }

    return NextResponse.json({ success: true, category });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function DELETE(req) {
  await dbConnect();
  const body = await req.json();
  const { categoryId, bannerId } = body;

  const category = await Category.findById(categoryId);
  if (!category) return NextResponse.json({ success: false, error: "Category not found" });

  if (bannerId) {
    const banner = category.banners.id(bannerId);
    if (!banner) return NextResponse.json({ success: false, error: "Banner not found" });
    banner.deleteOne();
    await category.save();
  } else {
    await Category.findByIdAndDelete(categoryId);
  }

  return NextResponse.json({ success: true });
}
