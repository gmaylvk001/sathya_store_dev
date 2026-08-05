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

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) return NextResponse.json([]);

  try {
    await dbConnect();
    const brands = await getActiveBrandsForSearch();
    const findQuery = buildProductFindQuery(q, brands);
    const brandConstraints = getBrandSearchConstraints(q, brands);
    const limit = brandConstraints ? 200 : q.length <= 2 ? 120 : 60;

    const products = await Product.find(findQuery)
      .select(
        "_id name item_code images price special_price slug search_keywords sub_category_new_name category_new brand"
      )
      .limit(limit)
      .lean();

    const ranked = products
      .map((product) => ({
        ...product,
        _score: scoreProductMatch(product, q, { brands }),
      }))
      .filter((product) => product._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 12)
      .map(({ _score, ...product }) => product);

    return NextResponse.json(ranked);
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
