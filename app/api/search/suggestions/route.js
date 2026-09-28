import dbConnect from "@/lib/db";
import Product from "@/models/product";
import { NextResponse } from "next/server";
import { getActiveBrandsForSearch } from "@/lib/brandSearch";
import {
  buildSearchOrConditions,
  getBrandSearchConstraints,
  scoreProductMatch,
} from "@/lib/searchMatch";

function buildProductFindQuery(query, brands) {
  const base = { status: "Active" };
  const brandConstraints = getBrandSearchConstraints(query, brands);

  if (brandConstraints?.mode === "brand_product") {
    return {
      ...base,
      brand: brandConstraints.brandId,
      $or: buildSearchOrConditions(brandConstraints.productQuery, []),
    };
  }

  if (brandConstraints?.mode === "exact") {
    return {
      ...base,
      brand: brandConstraints.brandId,
    };
  }

  return {
    ...base,
    $or: buildSearchOrConditions(query, brands),
  };
}

// Simple in-process cache: avoids repeated DB hits for identical queries within 60s
const suggestionsCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function getCached(key) {
  const entry = suggestionsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    suggestionsCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  // Limit cache size to avoid memory leaks
  if (suggestionsCache.size > 500) {
    const firstKey = suggestionsCache.keys().next().value;
    suggestionsCache.delete(firstKey);
  }
  suggestionsCache.set(key, { ts: Date.now(), data });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim();

  if (!q || q.length < 2) return NextResponse.json([]);

  // Cache key includes category so different categories get separate caches
  const cacheKey = `${q.toLowerCase()}|${category.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  }

  try {
    await dbConnect();
    const brands = await getActiveBrandsForSearch();
    const findQuery = buildProductFindQuery(q, brands);
    const brandConstraints = getBrandSearchConstraints(q, brands);
    const limit = brandConstraints ? 200 : q.length <= 2 ? 120 : 60;

    // Apply category filter if provided and not "All Category"
    if (category && category !== "all category" && category !== "all categories") {
      const Category = (await import("@/models/ecom_category_info")).default;
      const categoryDoc = await Category.findOne({
        category_name: { $regex: new RegExp(`^${category}$`, "i") },
        status: "Active",
      }).select("md5_cat_name");
      if (categoryDoc?.md5_cat_name) {
        findQuery.sub_category_new = { $regex: categoryDoc.md5_cat_name, $options: "i" };
      }
    }

    const products = await Product.find(findQuery)
      .select(
        "_id name item_code images price special_price slug search_keywords sub_category_new_name category_new brand createdAt"
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    const ranked = products
      .map((product) => ({
        ...product,
        _score: scoreProductMatch(product, q, { brands }),
      }))
      .filter((product) => product._score > 0)
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 12)
      .map(({ _score, ...product }) => product);

    setCache(cacheKey, ranked);

    return NextResponse.json(ranked, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
