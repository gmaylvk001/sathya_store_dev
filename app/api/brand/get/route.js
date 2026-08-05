// app/api/brand/get/route.js
import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    const brands = await Brand.find({ status: "Active" })
      .select("brand_name image")
      .lean();
console.log(brands)
    return new NextResponse(JSON.stringify({
      success: true,
      brands: brands.map(brand => ({
        id: brand._id.toString(),
        brand_name: brand.brand_name,
        image: brand.image
      }))
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error("Error fetching brands:", error);
    return new NextResponse(JSON.stringify({
      success: false,
      error: "Internal server error"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}