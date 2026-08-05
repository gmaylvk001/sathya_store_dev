import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import Product from "@/models/product";
import Brand from "@/models/ecom_brand_info";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

/**
 * Recursively fetch all descendant category IDs
 */
async function getDescendantCategoryIds(categoryId, visited = new Set()) {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) return [];

  const idStr = categoryId.toString();
  if (visited.has(idStr)) return []; // avoid loops
  visited.add(idStr);

  const children = await Category.find({ parentid: categoryId });
  let ids = [categoryId];

  for (const child of children) {
    const childIds = await getDescendantCategoryIds(child._id, visited);
    ids = ids.concat(childIds);
  }

  return ids;
}

/**
 * GET /api/categories/get
 * Fetch all categories with their products and related brands
 */
export async function GET() {
  try {
    await dbConnect();

    const categories = await Category.find().sort({ position: 1 });

    const categoriesWithProducts = await Promise.all(
      categories.map(async (cat) => {
        console.log(
          `📂 Processing category: ${cat.category_name} (${cat._id})`,
        );

        // fetch all descendant IDs (including itself)
        //const categoryIds = await getDescendantCategoryIds(cat._id);

        // fetch products within these categories
        /*
        const products = await Product.find({ category: { $in: categoryIds } }).sort({ createdAt: -1 });

        if (products.length > 0) {
          console.log(`✅ Found ${products.length} products for "${cat.category_name}"`);
        } else {
          console.log(`⚠️ No products found for "${cat.category_name}"`);
        }

        // extract unique valid brand IDs
        const brandIds = [
          ...new Set(
            products
              .map((p) => p.brand?.toString())
              .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
          ),
        ];

        // fetch related brands
        const brands = brandIds.length
          ? await Brand.find({ _id: { $in: brandIds } })
          : [];

        return {
          ...cat.toObject(),
          products,
          brands,
        }; */

        // fetch all descendant IDs (including itself)
        const categoryIds = await getDescendantCategoryIds(cat._id);

        // fetch products within these categories

        const brandIds = await Product.distinct("brand", {
          category: { $in: categoryIds },
        });

        if (brandIds.length > 0) {
          console.log(
            `✅ Found ${brandIds.length} brands for "${cat.category_name}"`,
          );
        } else {
          console.log(`⚠️ No brands found for "${cat.category_name}"`);
        }

        const validBrandIds = brandIds.filter(
          (id) => id && mongoose.Types.ObjectId.isValid(id),
        );

        const brands = validBrandIds.length
          ? await Brand.find({ _id: { $in: validBrandIds } })
          : [];

        return {
          ...cat.toObject(),
          parentid: cat.parentid?.toString() || "none",
          brands,
        };
      }),
    );

    console.log(
      `✅ Done! Fetched ${categoriesWithProducts.length} categories.`,
    );
    return NextResponse.json(categoriesWithProducts, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching categories with products/brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories", details: error.message },
      { status: 500 },
    );
  }
}
