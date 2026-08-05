import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ecom_brand_info from "@/models/ecom_brand_info";

export async function GET(req) {
  try {
    await dbConnect();
    const brands = await ecom_brand_info.find();
    return Response.json({ data: brands }, {status: 200} );
  } catch (error) {
    return Response.json({ error: "Error fetching brands" }, { status: 500 });
  }
}
