import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";
import OrderDetailsNew from "@/models/order_details_new";
import Product from "@/models/product";

const ORDER_STATUSES = [
  "Billed",
  "Cancelled",
  "Complete",
  "failure",
  "Order Accepted",
  "Order Placed",
  "ordered",
  "Payment Initiated",
  "pending",
];

async function attachDetails(order) {
  const details = await OrderDetailsNew.find({ order_id: order._id }).lean();
  const productItemCodes = details.map((item) => {
    if (item.item_code && item.item_code.startsWith("ITEM")) {
      return item.item_code.substring(4);
    }
    return item.item_code;
  }).filter(Boolean);

  const products = productItemCodes.length
    ? await Product.find({ item_code: { $in: productItemCodes } }).select("slug item_code").lean()
    : [];

  order.order_details = details.map((item) => {
    const product = products.find((p) => item.item_code && item.item_code.endsWith(p.item_code));
    return { ...item, slug: product?.slug || null };
  });
  order.order_item = Array.isArray(order.order_item) ? order.order_item : [];
  return order;
}

export async function GET(req, { params }) {
  await dbConnect();
  const { orderId } = await params;

  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const order = await OrderNew.findById(orderId).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await attachDetails(order);
    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  await dbConnect();
  const { orderId } = await params;

  try {
    const { status, delivery_date } = await req.json();

    if (!status || !ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Valid order status is required" },
        { status: 400 }
      );
    }

    const updateData = { order_status: status };
    if (delivery_date) {
      updateData.delivery_date = delivery_date;
    }

    const updatedOrder = await OrderNew.findByIdAndUpdate(orderId, updateData, { new: true });
    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updatedOrder }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
