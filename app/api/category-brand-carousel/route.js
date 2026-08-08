import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CategoryBrandCarousel from "@/models/categoryBrandCarousel";
import CategoryPage from "@/models/categoryPage";
import { saveCategoryBrandCarouselImage } from "@/lib/categoryBrandCarouselUpload";

function parseShowGap(value) {
  return value === true || value === "true" || value === "1";
}

/**
 * GET /api/category-brand-carousel?instanceId= | ?configId=
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const instanceId = searchParams.get("instanceId");
    const configId = searchParams.get("configId");
    const activeOnly = searchParams.get("activeOnly") === "1";

    let doc = null;
    if (configId) {
      doc = await CategoryBrandCarousel.findById(configId).lean();
    } else if (instanceId) {
      doc = await CategoryBrandCarousel.findOne({ instanceId }).lean();
    } else {
      return NextResponse.json(
        { success: false, message: "instanceId or configId required" },
        { status: 400 }
      );
    }

    if (!doc) {
      return NextResponse.json({ success: true, data: null, items: [] });
    }

    let items = [...(doc.items || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    if (activeOnly) {
      if (doc.status !== "active") {
        return NextResponse.json({ success: true, data: doc, items: [] });
      }
      items = items.filter((i) => i.isActive !== false);
    }

    return NextResponse.json({ success: true, data: doc, items });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/category-brand-carousel
 */
export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();
    const instanceId = formData.get("instanceId");
    const pageId = formData.get("pageId");
    const name = String(formData.get("name") || "").trim();
    const status = formData.get("status") || "active";
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

    const metaRaw = formData.get("itemsMeta");
    const meta = metaRaw ? JSON.parse(String(metaRaw)) : [];
    const items = [];

    for (let i = 0; i < meta.length; i++) {
      const item = meta[i] || {};
      let image = item.image || "";
      const file = formData.get(`image_${i}`);
      if (file && typeof file === "object" && file.size > 0) {
        const saved = await saveCategoryBrandCarouselImage(file);
        image = saved.path;
      }
      if (!image) continue;
      items.push({
        image,
        url: item.url || "",
        notes: "",
        isActive: item.isActive !== false,
        order: typeof item.order === "number" ? item.order : i,
      });
    }

    let doc = await CategoryBrandCarousel.findOne({ instanceId });
    const payload = {
      name,
      status,
      showGap,
      items,
      categoryId: page.categoryId,
      pageId: page._id,
    };

    if (doc) {
      await CategoryBrandCarousel.updateOne({ instanceId }, { $set: payload });
    } else {
      await CategoryBrandCarousel.create({
        instanceId,
        ...payload,
      });
    }

    doc = await CategoryBrandCarousel.findOne({ instanceId }).lean();

    const comp = page.components.find((c) => c.instanceId === instanceId);
    if (comp) {
      comp.configId = doc._id;
      comp.title = name;
      await page.save();
    }

    return NextResponse.json({ success: true, data: doc });
  } catch (err) {
    console.error("POST category-brand-carousel", err);
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

    const doc = await CategoryBrandCarousel.findOneAndDelete({ instanceId });
    const pageId = doc?.pageId;
    if (pageId) {
      const page = await CategoryPage.findById(pageId);
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
