import dbConnect from "@/lib/db";
import Product from "@/models/product";
import { NextResponse } from "next/server";

export async function POST(request) {
  await dbConnect();

  const { ids } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = await Product.find({
    _id: { $in: ids }
  });

  return NextResponse.json({ products });
}
