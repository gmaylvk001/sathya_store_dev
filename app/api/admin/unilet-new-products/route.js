import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import ProductAllU from "@/models/product_all_u";
import { requireAdmin } from "@/lib/adminRequest";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/unilet-new-products
 * All product_all_u records, newest first.
 */
export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    await dbConnect();
    const products = await ProductAllU.find({}).sort({ created_at: -1, _id: -1 }).lean();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("[unilet-new-products] GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load Unilet new products" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/unilet-new-products?id=<product_all_u _id>
 * Removes one record from product_all_u.
 */
export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Valid id is required" }, { status: 400 });
    }

    await dbConnect();
    const deleted = await ProductAllU.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Product removed" });
  } catch (error) {
    console.error("[unilet-new-products] DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to remove product" }, { status: 500 });
  }
}
