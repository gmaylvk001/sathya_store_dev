// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/db";
// import Order from "@/models/ecom_order_info";
// import jwt from "jsonwebtoken";


// export async function GET(req) {
//   await dbConnect();

//   try {
//     const { searchParams } = new URL(req.url);
//     const authHeader = req.headers.get('authorization');
//      const token = authHeader && authHeader.split(' ')[1];
        
//         if (!token) {
//           return NextResponse.json(
//             { error: "Authorization token required" },
//             { status: 401 }
//           );
//         }
    
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const userId = decoded.userId;
//     const status = searchParams.get("status");
//     let query = {};

//     if (status && status !== "all") {
//       query.order_status = status;
//     }

//     if(userId){
//       query.user_id = userId;
//     }

//     const orders = await Order.find(query);
//     return NextResponse.json({ success: true, orders }, { status: 200 });
//   } catch (error) {
//     return NextResponse.json({ success: false, message: "Server error", error: error.message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";
import OrderDetailsNew from "@/models/order_details_new";
import PaymentNewLive from "@/models/payment_new_live";
import CancelOrders from "@/models/cancel_orders";
import product from "@/models/product";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const status = searchParams.get("status");
    const order_number = searchParams.get("order_number");
    
    let query = {};

    if (status && status !== "all") {
      query.order_status = status;
    }

    if (order_number) {
      query.order_number = order_number;
    }
    if(userId){
      query.user_id = userId;
    }

    const orders = await OrderNew.find(query).sort({ created_at: -1 });

    const paymentObjectIds = [];
    const paymentStringIds = [];
    for (const order of orders) {
      if (!order.payment_id) continue;
      const pid = String(order.payment_id);
      paymentStringIds.push(pid);
      if (mongoose.isValidObjectId(pid)) {
        paymentObjectIds.push(new mongoose.Types.ObjectId(pid));
      }
    }

    const paymentQuery = [];
    if (paymentObjectIds.length) paymentQuery.push({ _id: { $in: paymentObjectIds } });
    if (paymentStringIds.length) {
      paymentQuery.push({ payment_id: { $in: paymentStringIds } });
      paymentQuery.push({ exist_id: { $in: paymentStringIds } });
    }
    if (orders.length) paymentQuery.push({ orderId: { $in: orders.map((order) => order._id) } });
    const orderNumbers = orders.map((order) => order.order_number).filter(Boolean);
    if (orderNumbers.length) paymentQuery.push({ order_number: { $in: orderNumbers } });

    const payments = paymentQuery.length
      ? await PaymentNewLive.find({ $or: paymentQuery }).lean()
      : [];

    const findPaymentForOrder = (order) => {
      const pid = order.payment_id ? String(order.payment_id) : "";
      return (
        payments.find((payment) =>
          (pid && String(payment._id) === pid) ||
          (pid && String(payment.payment_id) === pid) ||
          (pid && String(payment.exist_id) === pid) ||
          String(payment.orderId) === String(order._id) ||
          (order.order_number && payment.order_number === order.order_number)
        ) || null
      );
    };

    // Exist cancel_exists: any cancel_orders row for this order
    const cancelOrderIds = orders.map((o) => String(o._id));
    const cancelOrderNumbers = orders.map((o) => o.order_number).filter(Boolean);
    const cancelQuery = [];
    if (cancelOrderIds.length) cancelQuery.push({ order_id: { $in: cancelOrderIds } });
    if (cancelOrderNumbers.length) cancelQuery.push({ order_number: { $in: cancelOrderNumbers } });
    const cancelRows = cancelQuery.length
      ? await CancelOrders.find({ $or: cancelQuery }).select("order_id order_number").lean()
      : [];
    const cancelExistsByOrderId = new Set(cancelRows.map((r) => String(r.order_id || "")));
    const cancelExistsByOrderNumber = new Set(
      cancelRows.map((r) => String(r.order_number || "").trim()).filter(Boolean)
    );

    const updatedOrders = [];
    for (let order of orders) {
      // Find line items from order_details_new linked to this order
      const details = await OrderDetailsNew.find({
        $or: [
          { order_id: order._id },
          { orderNumber: order.order_number } // fallback for imported orders
        ]
      });

      const itemsWithSlug = [];

      // If the new table doesn't have details, fallback to order.order_item array if it exists
      const lineItems = details.length > 0 ? details : (order.order_item || []);

      for (let item of lineItems) {
        const itemCode = item.item_code;
        let productDoc = null;
        if (itemCode) {
          productDoc = await product.findOne({ item_code: itemCode }, "slug");
        }

        const itemObj = item.toObject ? item.toObject() : item;
        itemsWithSlug.push({
          ...itemObj,
          name: itemObj.product_name || itemObj.name,
          price: itemObj.product_price || itemObj.price,
          slug: productDoc?.slug || null
        });
      }

      const orderObj = order.toObject();
      const payment = findPaymentForOrder(order);
      const cancel_exists =
        cancelExistsByOrderId.has(String(order._id)) ||
        (order.order_number
          ? cancelExistsByOrderNumber.has(String(order.order_number).trim())
          : false);

      updatedOrders.push({
        ...orderObj,
        order_item: itemsWithSlug,
        payment_status: payment?.status || orderObj.payment_status || null,
        payment_type: payment?.PaymentMode || payment?.ModeType || orderObj.payment_type || orderObj.payment_method || null,
        payment_mode: payment?.PaymentMode || orderObj.payment_mode || null,
        createdAt: orderObj.created_at || orderObj.createdAt,
        updatedAt: orderObj.updated_at || orderObj.updatedAt,
        cancel_exists: Boolean(cancel_exists),
      });
    }
    
    if (order_number && updatedOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orders: updatedOrders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}