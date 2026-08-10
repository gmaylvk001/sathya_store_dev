import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getCategoryPagesAvailability } from "@/lib/categoryPageComponents/resolvePageComponents";

/**
 * POST /api/category-pages/availability
 * Body: { pages: [{ categoryId, pageType, slug? }, ...] }
 * Response: { success, availability: { "<categoryId>:<pageType>": boolean } }
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const pages = Array.isArray(body?.pages) ? body.pages : [];

    if (pages.length > 500) {
      return NextResponse.json(
        { success: false, message: "Too many pages requested" },
        { status: 400 }
      );
    }

    const availability = await getCategoryPagesAvailability(pages);
    return NextResponse.json({ success: true, availability });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Availability check failed" },
      { status: 500 }
    );
  }
}
