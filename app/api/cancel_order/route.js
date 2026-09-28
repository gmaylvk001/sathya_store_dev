import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";
import CancelOrders from "@/models/cancel_orders";
import OrderDetailsNew from "@/models/order_details_new";
import { cancelOrder } from "@/lib/cancelOrder";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const reason = String(body.reason || "").trim();
    const comments = body.comments != null ? String(body.comments).trim() : "";
    const cancel_order_number = String(body.cancel_order_number || "").trim();
    const cancel_order_id = String(body.cancel_order_id || "").trim();
    const customer_id = String(body.customer_id || "").trim();
    const order_status = String(body.order_status || "").trim();

    if (!reason) {
      return NextResponse.json(
        { result: "Please select a reason", message: "Please select a reason" },
        { status: 400 }
      );
    }
    if (!cancel_order_id || !mongoose.Types.ObjectId.isValid(cancel_order_id)) {
      return NextResponse.json(
        { result: "Invalid order id", message: "Invalid order id" },
        { status: 400 }
      );
    }
    if (!cancel_order_number) {
      return NextResponse.json(
        { result: "Order number is required", message: "Order number is required" },
        { status: 400 }
      );
    }

    const order = await OrderNew.findById(cancel_order_id).lean();
    if (!order) {
      return NextResponse.json(
        { result: "Order not found", message: "Order not found" },
        { status: 404 }
      );
    }

    // --- Server-side spec guards ---

    // 1. Duplicate cancel request check
    const existingCancel = await CancelOrders.findOne({
      $or: [
        { order_id: String(order._id) },
        ...(order.order_number ? [{ order_number: String(order.order_number).trim() }] : []),
      ],
    }).lean();
    if (existingCancel) {
      return NextResponse.json(
        { result: "Cancel request already exists", message: "A cancellation request already exists for this order." },
        { status: 400 }
      );
    }

    // 2. Order status must be cancellable (Pending/Processing per spec)
    const statusKey = String(order.order_status || "").trim().toLowerCase();
    const cancellableStatuses = new Set(["ordered", "order placed", "order accepted", "billed"]);
    if (!cancellableStatuses.has(statusKey)) {
      return NextResponse.json(
        { result: "Order cannot be cancelled", message: "This order is not eligible for cancellation." },
        { status: 400 }
      );
    }

    // 3. Warranty items cannot be cancelled
    const orderDetails = await OrderDetailsNew.find({
      $or: [
        { order_id: order._id },
        ...(order.order_number ? [{ orderNumber: order.order_number }] : []),
      ],
    }).lean();
    const hasWarrantyItem = orderDetails.some((item) => Number(item.is_warranty) === 1);
    if (hasWarrantyItem) {
      return NextResponse.json(
        { result: "Warranty orders cannot be cancelled", message: "Orders containing warranty items cannot be cancelled." },
        { status: 400 }
      );
    }

    const outcome = await cancelOrder({
      order,
      reason,
      comments,
      customerId: customer_id || String(order.user_id || ""),
      orderStatus: order_status || order.order_status || "",
    });

    const isSuccess = outcome.result === "Success";
    return NextResponse.json(
      {
        result: outcome.result,
        message: isSuccess
          ? "Thank you!. Your request has been sent."
          : outcome.result,
        order_status: outcome.order_status,
        branch: outcome.branch,
        wondersoft: outcome.wondersoft || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("cancel_order error:", error);
    return NextResponse.json(
      {
        result: "something is wrong. Please try again later!",
        message: error.message || "something is wrong. Please try again later!",
      },
      { status: 500 }
    );
  }
}
