// app/api/brand/get/route.js
import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    let brands = [];
    try {
      brands = await Brand.find({ status: "Active" })
        .select("brand_name image")
        .lean();
    } catch (queryErr) {
      console.warn("Status filter query failed in /api/brand/get, falling back to find all:", queryErr);
      brands = await Brand.find()
        .select("brand_name image")
        .lean();
    }

    return NextResponse.json({
      success: true,
      brands: (brands || []).map(brand => ({
        id: brand?._id ? brand._id.toString() : "",
        brand_name: brand?.brand_name || "",
        image: brand?.image || ""
      }))
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching brands in /api/brand/get:", error);
    return NextResponse.json({
      success: false,
      brands: [],
      error: error?.message || "Internal server error"
    }, { status: 200 });
  }
}