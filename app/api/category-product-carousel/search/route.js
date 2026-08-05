import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";

function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Collect this category + all descendant category ids as strings */
async function collectCategoryIds(rootId) {
  const ids = [String(rootId)];
  const queue = [String(rootId)];
  while (queue.length) {
    const parent = queue.shift();
    const children = await Category.find({ parentid: parent })
      .select("_id")
      .lean();
    for (const c of children) {
      const id = String(c._id);
      ids.push(id);
      queue.push(id);
    }
  }
  return [...new Set(ids)];
}

/**
 * GET /api/category-product-carousel/search?categoryId=&q=
 * Dropdown search — only products in the page category (and children).
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const q = (searchParams.get("q") || "").trim();

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { success: false, message: "Valid categoryId required" },
        { status: 400 }
      );
    }

    if (q.length < 1) {
      return NextResponse.json({ success: true, products: [] });
    }

    const catIds = await collectCategoryIds(categoryId);
    const rx = new RegExp(escapeRegExp(q), "i");

    const products = await Product.find({
      status: "Active",
      $and: [
        {
          $or: [
            { category: { $in: catIds } },
            { sub_category: { $in: catIds } },
          ],
        },
        {
          $or: [
            { name: rx },
            { item_code: rx },
            { model_number: rx },
            { search_keywords: rx },
          ],
        },
      ],
    })
      .select(
        "name slug images price special_price model_number item_code stock_status quantity brand"
      )
      .limit(20)
      .lean();

    return NextResponse.json({ success: true, products });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
