// app/api/product/featured/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";

export async function POST(req) {
  await dbConnect();
  const { ids } = await req.json();

  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ message: "Invalid product IDs" }, { status: 400 });
  }

  try {
    const products = await Product.find({ _id: { $in: ids } });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
