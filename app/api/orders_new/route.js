import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";

export async function GET() {
  try {
    await dbConnect();
    const orders = await OrderNew.find().sort({ created_at: -1 }).lean();
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching orders", error: error.message }, { status: 500 });
  }
}
