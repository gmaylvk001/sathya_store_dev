import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";

function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Collect this category + all descendant category docs.
 * parentid is stored as a string of the parent ObjectId.
 */
async function collectCategoryTree(rootId) {
  const root = await Category.findById(rootId)
    .select("_id md5_cat_name category_name")
    .lean();
  if (!root) return [];

  const tree = [root];
  const queue = [String(root._id)];
  const seen = new Set([String(root._id)]);

  while (queue.length) {
    const parent = queue.shift();
    const children = await Category.find({ parentid: parent })
      .select("_id md5_cat_name category_name parentid")
      .lean();
    for (const child of children) {
      const id = String(child._id);
      if (seen.has(id)) continue;
      seen.add(id);
      tree.push(child);
      queue.push(id);
    }
  }

  return tree;
}

function scoreProduct(product, q) {
  const query = q.toLowerCase();
  const name = String(product.name || "").toLowerCase();
  const itemCode = String(product.item_code || "").toLowerCase();
  const model = String(product.model_number || "").toLowerCase();
  const keywords = String(product.search_keywords || "").toLowerCase();

  if (name === query) return 100;
  if (name.startsWith(query)) return 90;
  if (itemCode === query || model === query) return 85;
  if (name.includes(` ${query}`) || name.includes(`${query} `)) return 75;
  if (name.includes(query)) return 60;
  if (itemCode.includes(query) || model.includes(query)) return 50;
  if (keywords.includes(query)) return 40;
  return 10;
}

/**
 * GET /api/category-product-carousel/search?categoryId=&q=
 * Dropdown search for all category-page product pickers.
 * Matches products via ObjectId category fields AND md5 category chains
 * (sub_category_new / category_new) — same linkage the storefront uses.
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

    const tree = await collectCategoryTree(categoryId);
    if (!tree.length) {
      return NextResponse.json({ success: true, products: [] });
    }

    const catIds = tree.map((c) => String(c._id));
    const md5List = tree
      .map((c) => c.md5_cat_name)
      .filter(Boolean);
    const md5Regex =
      md5List.length > 0
        ? new RegExp(md5List.map(escapeRegExp).join("|"), "i")
        : null;

    const rx = new RegExp(escapeRegExp(q), "i");

    // Products store category linkage in multiple shapes:
    // - category / sub_category → ObjectId strings
    // - category_new / sub_category_new → md5 hashes (##-joined chain)
    const categoryMatch = {
      $or: [
        { category: { $in: catIds } },
        { sub_category: { $in: catIds } },
        ...(md5List.length ? [{ category_new: { $in: md5List } }] : []),
        ...(md5Regex ? [{ sub_category_new: md5Regex }] : []),
      ],
    };

    const textMatch = {
      $or: [
        { name: rx },
        { item_code: rx },
        { model_number: rx },
        { search_keywords: rx },
        { sub_category_new_name: rx },
      ],
    };

    const products = await Product.find({
      status: "Active",
      $and: [categoryMatch, textMatch],
    })
      .select(
        "name slug images price special_price model_number item_code stock_status quantity brand search_keywords"
      )
      .limit(120)
      .lean();

    const ranked = products
      .map((p) => ({ ...p, _score: scoreProduct(p, q) }))
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        return String(a.name || "").localeCompare(String(b.name || ""));
      })
      .slice(0, 50)
      .map(({ _score, ...rest }) => rest);

    return NextResponse.json({ success: true, products: ranked });
  } catch (err) {
    console.error("category-product-carousel/search:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
