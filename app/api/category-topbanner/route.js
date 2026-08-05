import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CategoryTopBanner from "@/models/categoryTopbanner";
import ecom_category_info from "@/models/ecom_category_info";
import { saveCategoryTopBannerImage } from "@/lib/categoryTopbannerUpload";

/**
 * GET /api/category-topbanner
 * ?categoryId= | ?slug= | all list for admin
 * ?activeOnly=1 for storefront
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const slug = searchParams.get("slug");
    const activeOnly = searchParams.get("activeOnly") === "1";

    if (categoryId || slug) {
      const filter = categoryId
        ? { categoryId }
        : { categorySlug: slug };

      const doc = await CategoryTopBanner.findOne(filter).lean();
      if (!doc) {
        return NextResponse.json({ success: true, data: null, banners: [] });
      }

      let banners = [...(doc.banners || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );

      if (activeOnly || doc.status !== "active") {
        if (doc.status !== "active" && activeOnly) {
          return NextResponse.json({
            success: true,
            data: doc,
            banners: [],
          });
        }
        if (activeOnly) {
          banners = banners.filter((b) => b.isActive !== false);
        }
      }

      return NextResponse.json({ success: true, data: doc, banners });
    }

    const list = await CategoryTopBanner.find()
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, list });
  } catch (err) {
    console.error("GET category-topbanner", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/category-topbanner
 * Create or replace banner set for a category.
 * multipart: categoryId, pageType, status, banners JSON metadata + files desktopImage_0, mobileImage_0, ...
 * OR JSON: { categoryId, pageType, status, banners: [{ url, isActive, desktopImage?, mobileImage? }] }
 */
export async function POST(req) {
  try {
    await dbConnect();
    const contentType = req.headers.get("content-type") || "";

    let categoryId;
    let pageType = "category";
    let status = "active";
    let banners = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      categoryId = formData.get("categoryId");
      pageType = formData.get("pageType") || "category";
      status = formData.get("status") || "active";

      const metaRaw = formData.get("bannersMeta");
      const meta = metaRaw ? JSON.parse(String(metaRaw)) : [];

      for (let i = 0; i < meta.length; i++) {
        const item = meta[i] || {};
        let desktopImage = item.desktopImage || "";
        let mobileImage = item.mobileImage || "";

        const deskFile = formData.get(`desktopImage_${i}`);
        const mobFile = formData.get(`mobileImage_${i}`);

        if (deskFile && typeof deskFile === "object" && deskFile.size > 0) {
          desktopImage = await saveCategoryTopBannerImage(deskFile);
        }
        if (mobFile && typeof mobFile === "object" && mobFile.size > 0) {
          mobileImage = await saveCategoryTopBannerImage(mobFile);
        }

        banners.push({
          desktopImage,
          mobileImage,
          url: item.url || "",
          isActive: item.isActive !== false,
          order: typeof item.order === "number" ? item.order : i,
        });
      }
    } else {
      const body = await req.json();
      categoryId = body.categoryId;
      pageType = body.pageType || "category";
      status = body.status || "active";
      banners = (body.banners || []).map((b, i) => ({
        desktopImage: b.desktopImage || "",
        mobileImage: b.mobileImage || "",
        url: b.url || "",
        isActive: b.isActive !== false,
        order: typeof b.order === "number" ? b.order : i,
      }));
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "categoryId is required" },
        { status: 400 }
      );
    }

    const category = await ecom_category_info.findById(categoryId).lean();
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    const payload = {
      categoryId,
      categoryName: category.category_name,
      categorySlug: category.category_slug,
      pageType,
      status,
      banners,
    };

    const doc = await CategoryTopBanner.findOneAndUpdate(
      { categoryId },
      { $set: payload },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (err) {
    console.error("POST category-topbanner", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/category-topbanner?id=
 */
export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "id required" },
        { status: 400 }
      );
    }
    await CategoryTopBanner.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
