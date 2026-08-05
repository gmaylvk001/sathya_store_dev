import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CategoryPage from "@/models/categoryPage";
import ecom_category_info from "@/models/ecom_category_info";
import {
  PAGE_TYPES,
  PAGE_TYPE_LABELS,
} from "@/lib/categoryPageComponents/registry";

/** GET /api/category-pages — list layouts */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const pageType = searchParams.get("pageType");

    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (pageType) filter.pageType = pageType;

    const pages = await CategoryPage.find(filter).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({
      success: true,
      pages: pages.map((p) => ({
        ...p,
        pageTypeLabel: PAGE_TYPE_LABELS[p.pageType] || p.pageType,
        componentCount: p.components?.length || 0,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/** POST /api/category-pages — create layout { pageType, categoryId } */
export async function POST(req) {
  try {
    await dbConnect();
    const { pageType, categoryId } = await req.json();

    if (!pageType || !Object.values(PAGE_TYPES).includes(pageType)) {
      return NextResponse.json(
        { success: false, message: "Invalid pageType" },
        { status: 400 }
      );
    }
    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "categoryId required" },
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

    const existing = await CategoryPage.findOne({ pageType, categoryId });
    if (existing) {
      return NextResponse.json({
        success: true,
        page: existing,
        alreadyExists: true,
      });
    }

    const page = await CategoryPage.create({
      pageType,
      categoryId,
      categoryName: category.category_name,
      categorySlug: category.category_slug,
      status: "active",
      components: [],
    });

    return NextResponse.json({ success: true, page }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Page already exists for this category" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
