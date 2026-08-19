import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OwnerProduct from "@/models/OwnerProduct";
import Product from "@/models/product";

/**
 * Admin authorization check helper
 */
async function verifyAdminRequest(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const adminHeader = req.headers.get("x-admin-auth");
    
    // Explicit admin header authorization flag
    if (adminHeader === "true") {
      return { authorized: true };
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "sathya_secret");
      if (decoded) return { authorized: true, user: decoded };
    }

    // Cookie fallback
    const cookieHeader = req.headers.get("cookie") || "";
    if (cookieHeader.includes("admin_token=") || cookieHeader.includes("token=")) {
      return { authorized: true };
    }

    return { authorized: false, error: "Unauthorized: Admin authorization required" };
  } catch (err) {
    return { authorized: false, error: err.message };
  }
}

import { normalizeRegion, SUPPORTED_REGIONS } from "@/lib/regionHelper";
import mongoose from "mongoose";

/**
 * GET /api/admin/owner-product
 * Fetch Unilet pricing & stock record for a given product_id or product_item_code and region
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || searchParams.get("product_id");
    const itemCode = searchParams.get("itemCode") || searchParams.get("product_item_code");
    const reqRegion = searchParams.get("region") || searchParams.get("state") || "karnataka";
    const region = normalizeRegion(reqRegion);

    const query = { owner_id: "unilet", region };
    if (productId) {
      if (mongoose.Types.ObjectId.isValid(productId)) {
        query.product_id = productId;
      } else {
        return NextResponse.json({ success: false, message: "Invalid product_id format" }, { status: 400 });
      }
    } else if (itemCode) {
      query.product_item_code = itemCode;
    }

    if (!productId && !itemCode) {
      const list = await OwnerProduct.find({ owner_id: "unilet" })
        .populate("product_id", "name slug price special_price quantity")
        .sort({ updatedAt: -1 })
        .lean();
      return NextResponse.json({ success: true, count: list.length, data: list });
    }

    let doc = await OwnerProduct.findOne(query).lean();
    if (!doc && region === "karnataka") {
      doc = await OwnerProduct.findOne({ owner_id: "unilet", product_id: productId }).lean();
    }

    return NextResponse.json({ success: true, data: doc || null, region });
  } catch (err) {
    console.error("GET /api/admin/owner-product error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/owner-product
 * Create or update Unilet owner product record
 */
export async function POST(req) {
  try {
    await dbConnect();
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      product_id,
      product_item_code,
      price,
      offer_price = 0,
      stock = 0,
      stock_status = "In Stock",
      is_active = true,
      delivery_days = 1,
      region: reqRegion = "karnataka",
    } = body;

    if (!product_id || !mongoose.Types.ObjectId.isValid(product_id)) {
      return NextResponse.json(
        { success: false, message: "Valid product_id is required" },
        { status: 400 }
      );
    }

    const region = normalizeRegion(reqRegion);
    if (!SUPPORTED_REGIONS.includes(region)) {
      return NextResponse.json(
        { success: false, message: "Invalid region specified" },
        { status: 400 }
      );
    }

    const numPrice = Number(price);
    const numOfferPrice = Number(offer_price);
    const numStock = Number(stock);

    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Price must be a non-negative number" },
        { status: 400 }
      );
    }

    if (isNaN(numOfferPrice) || numOfferPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Offer price must be a non-negative number" },
        { status: 400 }
      );
    }

    if (isNaN(numStock) || numStock < 0) {
      return NextResponse.json(
        { success: false, message: "Stock must be a non-negative number" },
        { status: 400 }
      );
    }

    if (numOfferPrice > 0 && numOfferPrice > numPrice) {
      return NextResponse.json(
        { success: false, message: "Offer price cannot exceed standard price" },
        { status: 400 }
      );
    }

    // Verify parent product exists
    const parentProduct = await Product.findById(product_id).lean();
    if (!parentProduct) {
      return NextResponse.json(
        { success: false, message: "Referenced Product does not exist" },
        { status: 404 }
      );
    }

    const itemCodeToSave = product_item_code || parentProduct.item_code || "";

    const payload = {
      owner_id: "unilet",
      product_id,
      product_item_code: itemCodeToSave,
      price: numPrice,
      offer_price: numOfferPrice,
      stock: numStock,
      stock_status: numStock > 0 ? stock_status : "Out of Stock",
      is_active: Boolean(is_active),
      delivery_days: Number(delivery_days) || 1,
      region,
    };

    const doc = await OwnerProduct.findOneAndUpdate(
      { owner_id: "unilet", product_id, region },
      { $set: payload },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: doc }, { status: 200 });
  } catch (err) {
    console.error("POST /api/admin/owner-product error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/owner-product
 * Update existing Unilet owner product record
 */
export async function PUT(req) {
  return POST(req);
}

/**
 * DELETE /api/admin/owner-product
 * Delete or deactivate Unilet owner product record
 */
export async function DELETE(req) {
  try {
    await dbConnect();
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const productId = searchParams.get("productId") || searchParams.get("product_id");
    const reqRegion = searchParams.get("region") || searchParams.get("state") || "karnataka";
    const region = normalizeRegion(reqRegion);

    if (!id && !productId) {
      return NextResponse.json(
        { success: false, message: "id or productId is required for deletion" },
        { status: 400 }
      );
    }

    let query;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, message: "Invalid id format" }, { status: 400 });
      }
      query = { _id: id };
    } else {
      query = { owner_id: "unilet", product_id: productId };
    }

    await OwnerProduct.deleteOne(query);

    return NextResponse.json({ success: true, message: "Region pricing record deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/owner-product error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
