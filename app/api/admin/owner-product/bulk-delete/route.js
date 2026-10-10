import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import OwnerProduct from "@/models/OwnerProduct";

export const dynamic = "force-dynamic";

function isAdminRequest(req) {
  if (req.headers.get("x-admin-auth") === "true") return true;
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader.includes("admin_token=") || cookieHeader.includes("token=");
}

/**
 * POST /api/admin/owner-product/bulk-delete
 * Body: { ids: [OwnerProduct _id, ...] }
 */
export async function POST(req) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.ids)
      ? [...new Set(body.ids.map((id) => String(id || "").trim()))].filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];

    if (!ids.length) {
      return NextResponse.json({ success: false, message: "Select at least one product to delete" }, { status: 400 });
    }

    await dbConnect();
    const result = await OwnerProduct.deleteMany({ _id: { $in: ids }, owner_id: "unilet" });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount || 0,
      message: `${result.deletedCount || 0} Unilet product(s) deleted`,
    });
  } catch (error) {
    console.error("Unilet products bulk delete error:", error);
    return NextResponse.json({ success: false, message: error.message || "Bulk delete failed" }, { status: 500 });
  }
}
