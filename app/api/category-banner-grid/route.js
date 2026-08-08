import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CategoryBannerGrid from "@/models/categoryBannerGrid";
import CategoryPage from "@/models/categoryPage";
import { saveCategoryBannerGridImage } from "@/lib/categoryBannerGridUpload";

function parseShowGap(value) {
  return value === true || value === "true" || value === "1";
}

/**
 * GET /api/category-banner-grid?instanceId= | ?configId=
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const instanceId = searchParams.get("instanceId");
    const configId = searchParams.get("configId");

    let doc = null;
    if (configId) {
      doc = await CategoryBannerGrid.findById(configId).lean();
    } else if (instanceId) {
      doc = await CategoryBannerGrid.findOne({ instanceId }).lean();
    } else {
      return NextResponse.json(
        { success: false, message: "instanceId or configId required" },
        { status: 400 }
      );
    }

    if (!doc) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: doc });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST multipart — create or update banner grid set
 */
export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();
    const instanceId = formData.get("instanceId");
    const pageId = formData.get("pageId");
    const name = String(formData.get("name") || "").trim();
    const status = formData.get("status") || "active";
    const imageCountRaw = parseInt(String(formData.get("imageCount") || "4"), 10);
    const imageCount = [2, 3, 4].includes(imageCountRaw) ? imageCountRaw : 4;
    const bannersMetaRaw = formData.get("bannersMeta");
    const bannersMeta = bannersMetaRaw ? JSON.parse(String(bannersMetaRaw)) : [];
    const showGap = parseShowGap(formData.get("showGap"));

    if (!instanceId || !pageId) {
      return NextResponse.json(
        { success: false, message: "instanceId and pageId required" },
        { status: 400 }
      );
    }

    const page = await CategoryPage.findById(pageId);
    if (!page) {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }

    const banners = [];
    for (let i = 0; i < imageCount; i++) {
      const meta = bannersMeta[i] || {};
      let image = meta.image || "";
      const file = formData.get(`bannerImage_${i}`);
      if (file && typeof file === "object" && file.size > 0) {
        image = await saveCategoryBannerGridImage(file);
      }
      if (!image) {
        return NextResponse.json(
          { success: false, message: `Banner image ${i + 1} is required` },
          { status: 400 }
        );
      }
      banners.push({
        image,
        url: String(meta.url || "").trim(),
        order: i,
      });
    }

    const payload = {
      name,
      status: status === "inactive" ? "inactive" : "active",
      imageCount,
      banners,
      showGap,
      categoryId: page.categoryId,
      pageId: page._id,
    };

    let doc = await CategoryBannerGrid.findOne({ instanceId });
    if (doc) {
      await CategoryBannerGrid.updateOne({ instanceId }, { $set: payload });
    } else {
      await CategoryBannerGrid.create({
        instanceId,
        ...payload,
      });
    }

    doc = await CategoryBannerGrid.findOne({ instanceId }).lean();

    const comp = page.components.find((c) => c.instanceId === instanceId);
    if (comp) {
      comp.configId = doc._id;
      comp.title = name;
      await page.save();
    }

    return NextResponse.json({ success: true, data: doc });
  } catch (err) {
    console.error("POST category-banner-grid", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const instanceId = new URL(req.url).searchParams.get("instanceId");
    if (!instanceId) {
      return NextResponse.json(
        { success: false, message: "instanceId required" },
        { status: 400 }
      );
    }

    const doc = await CategoryBannerGrid.findOneAndDelete({ instanceId });
    if (doc) {
      const page = await CategoryPage.findById(doc.pageId);
      if (page) {
        page.components = page.components.filter(
          (c) => c.instanceId !== instanceId
        );
        page.components
          .sort((a, b) => a.order - b.order)
          .forEach((c, i) => {
            c.order = i;
          });
        await page.save();
      }
    } else {
      await CategoryPage.updateOne(
        { "components.instanceId": instanceId },
        { $pull: { components: { instanceId } } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
