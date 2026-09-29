import dbConnect from "@/lib/db";
import Product from "@/models/product";
import { NextResponse } from "next/server";
import { getActiveBrandsForSearch } from "@/lib/brandSearch";
import {
  buildSearchOrConditions,
  getBrandSearchConstraints,
  scoreProductMatch,
  escapeRegExp,
} from "@/lib/searchMatch";

export const runtime = "nodejs";

const REQUIRED_PROJECTION =
  "_id name item_code images price special_price slug search_keywords sub_category_new_name category_new brand createdAt model_number";

function sanitizeInput(str = "") {
  return str.replace(/[^\w\s\-/+().,&]/gi, "").trim();
}

function buildProductFindQuery(query, brands) {
  const base = { status: "Active" };
  const brandConstraints = getBrandSearchConstraints(query, brands);

  if (brandConstraints?.mode === "brand_product") {
    return {
      ...base,
      brand: brandConstraints.brandId,
      $or: buildSearchOrConditions(brandConstraints.productQuery, brands),
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

// In-process memory cache for repeated queries within 30s
const suggestionsCache = new Map();
const CACHE_TTL_MS = 30 * 1000;

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
  if (suggestionsCache.size > 500) {
    const firstKey = suggestionsCache.keys().next().value;
    if (firstKey) suggestionsCache.delete(firstKey);
  }
  suggestionsCache.set(key, { ts: Date.now(), data });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("q") || "").trim().slice(0, 100);
    const rawCategory = (searchParams.get("category") || "").trim().slice(0, 100);
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit"), 10) || 8));

    const q = sanitizeInput(rawQuery);
    const category = rawCategory;

    // Minimum 2 characters for search query
    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      });
    }

    const cacheKey = `${q.toLowerCase()}|${category.toLowerCase()}|p${page}|l${limit}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
      });
    }

    await dbConnect();
    const brands = await getActiveBrandsForSearch();
    const brandConstraints = getBrandSearchConstraints(q, brands);
    const findQuery = buildProductFindQuery(q, brands);

    // Filter by category if specified
    const catLower = category.toLowerCase();
    if (category && catLower !== "all category" && catLower !== "all categories") {
      const Category = (await import("@/models/ecom_category_info")).default;
      const categoryDoc = await Category.findOne({
        category_name: { $regex: new RegExp(`^${category}$`, "i") },
        status: "Active",
      }).select("md5_cat_name");
      if (categoryDoc?.md5_cat_name) {
        findQuery.sub_category_new = { $regex: categoryDoc.md5_cat_name, $options: "i" };
      }
    }

    // Base filter inherits active status and category if present
    const baseFilter = { status: "Active" };
    if (findQuery.sub_category_new) {
      baseFilter.sub_category_new = findQuery.sub_category_new;
    }

    const escapedQ = escapeRegExp(q.trim());

    // Priority 1: Exact matches (exact name, exact model_number, exact item_code, exact brand)
    const exactConditions = [
      { name: new RegExp(`^${escapedQ}$`, "i") },
      { name: new RegExp(`(^|[\\s\\-/,_(])${escapedQ}($|[\\s\\-/,_.)])`, "i") },
      { model_number: new RegExp(`^${escapedQ}$`, "i") },
      { item_code: new RegExp(`^${escapedQ}$`, "i") },
    ];
    if (brandConstraints?.mode === "exact") {
      exactConditions.push({ brand: brandConstraints.brandId });
    } else if (brandConstraints?.mode === "brand_product") {
      const pQueryEsc = escapeRegExp(brandConstraints.productQuery);
      exactConditions.push({
        brand: brandConstraints.brandId,
        $or: [
          { name: new RegExp(`^${pQueryEsc}$`, "i") },
          { name: new RegExp(`(^|[\\s\\-/,_(])${pQueryEsc}($|[\\s\\-/,_.)])`, "i") },
          { model_number: new RegExp(`^${pQueryEsc}$`, "i") },
          { item_code: new RegExp(`^${pQueryEsc}$`, "i") },
        ],
      });
    }
    const exactQuery = { ...baseFilter, $or: exactConditions };

    // Priority 2: Prefix and strong partial matches
    const prefixConditions = [
      { name: new RegExp(`^${escapedQ}`, "i") },
      { name: new RegExp(`(^|[\\s\\-/,_(])${escapedQ}`, "i") },
      { model_number: new RegExp(`^${escapedQ}`, "i") },
      { item_code: new RegExp(`^${escapedQ}`, "i") },
      { sub_category_new_name: new RegExp(escapedQ, "i") },
    ];
    if (brandConstraints?.mode === "brand_product") {
      const pQueryEsc = escapeRegExp(brandConstraints.productQuery);
      prefixConditions.push({
        brand: brandConstraints.brandId,
        $or: [
          { name: new RegExp(`^${pQueryEsc}`, "i") },
          { name: new RegExp(`(^|[\\s\\-/,_(])${pQueryEsc}`, "i") },
          { model_number: new RegExp(`^${pQueryEsc}`, "i") },
          { item_code: new RegExp(`^${pQueryEsc}`, "i") },
          { sub_category_new_name: new RegExp(pQueryEsc, "i") },
        ],
      });
    }
    const matchedBrandIds = (brands || [])
      .filter((b) => {
        const bName = (b?.brand_name || "").toLowerCase().trim();
        const qLower = q.toLowerCase();
        return (
          bName &&
          (bName === qLower ||
            (qLower.length >= 3 && bName.startsWith(qLower)) ||
            (bName.length >= 4 && qLower.startsWith(bName)))
        );
      })
      .map((b) => String(b._id));
    if (matchedBrandIds.length > 0) {
      prefixConditions.push({ brand: { $in: matchedBrandIds } });
    }
    const prefixQuery = { ...baseFilter, $or: prefixConditions };

    // Priority 3: Broader fallback candidates (sorted by newest)
    const fallbackLimit = Math.min(1000, Math.max(120, page * limit + 80));

    // Parallel execution of total count and candidate retrieval tiers
    const [total, exactDocs, prefixDocs, fallbackDocs] = await Promise.all([
      Product.countDocuments(findQuery),
      Product.find(exactQuery).select(REQUIRED_PROJECTION).limit(50).lean(),
      Product.find(prefixQuery).select(REQUIRED_PROJECTION).limit(80).lean(),
      Product.find(findQuery)
        .select(REQUIRED_PROJECTION)
        .sort({ createdAt: -1, _id: -1 })
        .limit(fallbackLimit)
        .lean(),
    ]);

    // Merge and deduplicate candidates safely by _id
    const candidateMap = new Map();
    for (const doc of exactDocs) {
      candidateMap.set(String(doc._id), doc);
    }
    for (const doc of prefixDocs) {
      if (!candidateMap.has(String(doc._id))) {
        candidateMap.set(String(doc._id), doc);
      }
    }
    for (const doc of fallbackDocs) {
      if (!candidateMap.has(String(doc._id))) {
        candidateMap.set(String(doc._id), doc);
      }
    }
    const combinedCandidates = Array.from(candidateMap.values());

    // Score and rank products with existing relevance scoring
    const ranked = combinedCandidates
      .map((product) => ({
        ...product,
        _score: scoreProductMatch(product, q, { brands }),
      }))
      .filter((product) => product._score > 0)
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return String(b._id).localeCompare(String(a._id));
      });

    // Pagination based on actual MongoDB total count
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const pagedItems = ranked
      .slice(skip, skip + limit)
      .map(({ _score, ...product }) => product);
    const hasMore = page < totalPages;

    const responsePayload = {
      success: true,
      results: pagedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    };

    setCache(cacheKey, responsePayload);

    return NextResponse.json(responsePayload, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch search suggestions",
        results: [],
        pagination: { page: 1, limit: 8, total: 0, totalPages: 0, hasMore: false },
      },
      { status: 500 }
    );
  }
}

