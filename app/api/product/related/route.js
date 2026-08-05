/* // app/api/products/related/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // your DB connection
import Product from "@/models/product";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category"); // category ID
    const excludeId = searchParams.get("exclude"); // optional product to exclude
    const limit = parseInt(searchParams.get("limit")) || 5; // default 5

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is requiredd" }, { status: 400 });
    }

    const query = { category: categoryId };
    if (excludeId) query._id = { $ne: excludeId }; // exclude current product

    const relatedProducts = await Product.find(query)
      .limit(limit)
      .sort({ createdAt: -1 }); // latest products first

    return NextResponse.json({
  success: true,
  products: relatedProducts, // ✅ match frontend expectation
});

  } catch (error) {
    console.error("Error fetching related products:", error);
    return NextResponse.json({ error: "Failed to fetch related products" }, { status: 500 });
  }
}
 */


// app/api/products/related/route.js

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const ids = searchParams.get("ids");

    if (!ids) {
      return NextResponse.json(
        {
          success: false,
          products: [],
          error: "Related product IDs are required",
        },
        { status: 400 }
      );
    }

    // Convert comma separated ids to ObjectIds
    const productIds = ids
      .split(",")
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(id));

    const products = await Product.find({
      _id: { $in: productIds },
    }).lean();

    return NextResponse.json({
      success: true,
      products,
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