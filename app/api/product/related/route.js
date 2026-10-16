// app/api/product/related/route.js

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const ids = searchParams.get("ids");
    const categoryId = searchParams.get("category");
    const brandId = searchParams.get("brand");
    const excludeId = searchParams.get("exclude");
    const cartItemIds = searchParams.get("cartItemIds") || searchParams.get("cartItems");
    const productId = searchParams.get("productId");
    const limit = parseInt(searchParams.get("limit"), 10) || 10;

    // 1. Fetch by explicit IDs if provided
    if (ids) {
      const productIds = ids
        .split(",")
        .filter(Boolean)
        .map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id));

      const products = await Product.find({
        _id: { $in: productIds },
        status: "Active",
      }).lean();

      return NextResponse.json({
        success: true,
        products,
      });
    }

    // 2. Cross-sell cross-recommendations based on cart items or current product
    if (cartItemIds || productId) {
      const parsedExcludeList = [
        ...(cartItemIds ? cartItemIds.split(",") : []),
        ...(productId ? [productId] : []),
        ...(excludeId ? excludeId.split(",") : []),
      ]
        .map((id) => id?.trim())
        .filter(Boolean);

      const objectIdExcludes = parsedExcludeList
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const sourceCartProducts = await Product.find({
        _id: { $in: objectIdExcludes },
      })
        .select("category brand related_products")
        .lean();

      const relatedIds = sourceCartProducts
        .flatMap((p) => p.related_products || [])
        .map((id) => id.toString())
        .filter((id) => !parsedExcludeList.includes(id));

      const sourceCategories = [
        ...new Set([
          ...sourceCartProducts.map((p) => p.category).filter(Boolean),
          ...(categoryId ? categoryId.split(",").map((c) => c.trim()).filter(Boolean) : []),
        ]),
      ];

      const recommendedProducts = [];

      // Step 2a: Explicitly mapped related products
      if (relatedIds.length > 0) {
        const explicitIds = relatedIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        if (explicitIds.length > 0) {
          const explicitDocs = await Product.find({
            _id: { $in: explicitIds },
            status: "Active",
          })
            .limit(limit)
            .lean();
          recommendedProducts.push(...explicitDocs);
        }
      }

      // Step 2b: Fill from same category/categories if needed
      if (recommendedProducts.length < limit && sourceCategories.length > 0) {
        const alreadyCollectedIds = [
          ...parsedExcludeList,
          ...recommendedProducts.map((p) => p._id.toString()),
        ];
        const categoryDocs = await Product.find({
          category: { $in: sourceCategories },
          status: "Active",
          _id: {
            $nin: alreadyCollectedIds
              .filter((id) => mongoose.Types.ObjectId.isValid(id))
              .map((id) => new mongoose.Types.ObjectId(id)),
          },
        })
          .limit(limit - recommendedProducts.length)
          .sort({ createdAt: -1 })
          .lean();

        recommendedProducts.push(...categoryDocs);
      }

      // Step 2c: Failsafe fallback to active in-stock products
      if (recommendedProducts.length < 4) {
        const alreadyCollectedIds = [
          ...parsedExcludeList,
          ...recommendedProducts.map((p) => p._id.toString()),
        ];
        const fallbackDocs = await Product.find({
          status: "Active",
          stock_status: "In Stock",
          _id: {
            $nin: alreadyCollectedIds
              .filter((id) => mongoose.Types.ObjectId.isValid(id))
              .map((id) => new mongoose.Types.ObjectId(id)),
          },
        })
          .limit(limit - recommendedProducts.length)
          .sort({ createdAt: -1 })
          .lean();

        recommendedProducts.push(...fallbackDocs);
      }

      return NextResponse.json({
        success: true,
        products: recommendedProducts,
      });
    }

    // 3. Fallback: Fetch by category / brand
    if (categoryId) {
      const catList = categoryId.split(",").map((c) => c.trim()).filter(Boolean);
      const query = { category: { $in: catList }, status: "Active" };
      if (brandId) query.brand = brandId;

      if (excludeId) {
        const excludes = excludeId.split(",").map((e) => e.trim()).filter(Boolean);
        query._id = {
          $nin: excludes
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id)),
        };
      }

      let products = await Product.find(query)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      // If brand filter was too narrow (< 4 products), broaden to category items
      if (products.length < 4 && brandId) {
        const existingIds = products.map((p) => p._id);
        const excludeList = excludeId ? [...existingIds, ...excludeId.split(",")] : existingIds;
        const moreProducts = await Product.find({
          category: { $in: catList },
          status: "Active",
          _id: {
            $nin: excludeList
              .filter((id) => mongoose.Types.ObjectId.isValid(id))
              .map((id) => new mongoose.Types.ObjectId(id)),
          },
        })
          .limit(limit - products.length)
          .sort({ createdAt: -1 })
          .lean();

        products = [...products, ...moreProducts];
      }

      // Failsafe fallback to active in-stock products
      if (products.length < 4) {
        const existingIds = products.map((p) => p._id);
        const fallbackDocs = await Product.find({
          status: "Active",
          stock_status: "In Stock",
          _id: {
            $nin: existingIds
              .filter((id) => mongoose.Types.ObjectId.isValid(id))
              .map((id) => new mongoose.Types.ObjectId(id)),
          },
        })
          .limit(limit - products.length)
          .sort({ createdAt: -1 })
          .lean();

        products = [...products, ...fallbackDocs];
      }

      return NextResponse.json({
        success: true,
        products,
      });
    }

    // Default safe fallback if neither id, category, nor cart products are specified
    const generalFallback = await Product.find({
      status: "Active",
      stock_status: "In Stock",
    })
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      products: generalFallback,
    });
  } catch (error) {
    console.error("Related products fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        products: [],
      },
      { status: 500 }
    );
  }
}