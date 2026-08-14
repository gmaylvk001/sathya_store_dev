import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import HomeTopBanner from "@/models/homeTopBanner";
import HomePage from "@/models/homePage";
import { saveCategoryTopBannerImage } from "@/lib/categoryTopbannerUpload";

/**
 * GET /api/home-topbanner
 * ?pageId= | all list for admin
 * ?activeOnly=1 for storefront
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");
    const activeOnly = searchParams.get("activeOnly") === "1";

    if (pageId) {
      const doc = await HomeTopBanner.findOne({ pageId }).lean();
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

    const list = await HomeTopBanner.find()
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, list });
  } catch (err) {
    console.error("GET home-topbanner", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/home-topbanner
 * multipart/json: pageId, status, bannersMeta + files
 */
export async function POST(req) {
  try {
    await dbConnect();
    const contentType = req.headers.get("content-type") || "";

    let pageId;
    let status = "active";
    let banners = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      pageId = formData.get("pageId");
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
      pageId = body.pageId;
      status = body.status || "active";
      banners = (body.banners || []).map((b, i) => ({
        desktopImage: b.desktopImage || "",
        mobileImage: b.mobileImage || "",
        url: b.url || "",
        isActive: b.isActive !== false,
        order: typeof b.order === "number" ? b.order : i,
      }));
    }

    if (!pageId) {
      return NextResponse.json(
        { success: false, message: "pageId is required" },
        { status: 400 }
      );
    }

    const page = await HomePage.findById(pageId);
    if (!page) {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }

    const payload = {
      pageId: page._id,
      name: page.name || "Home Page",
      pageType: "home",
      status,
      banners,
    };

    const doc = await HomeTopBanner.findOneAndUpdate(
      { pageId: page._id },
      { $set: payload },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (err) {
    console.error("POST home-topbanner", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/home-topbanner?id=
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
    await HomeTopBanner.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
