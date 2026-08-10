import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { resolveCategoryPageComponents } from "@/lib/categoryPageComponents/resolvePageComponents";

/**
 * GET /api/category-pages/render?categoryId=&pageType= OR ?slug=&pageType=
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const slug = searchParams.get("slug");
    const pageType = searchParams.get("pageType");

    const result = await resolveCategoryPageComponents({
      categoryId,
      slug,
      pageType,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err?.message || "Failed to render category page";
    const status =
      message.includes("pageType") || message.includes("categoryId or slug")
        ? 400
        : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
