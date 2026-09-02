import Order from '@/models/ecom_order_info';
import Product from "@/models/product";
import { NextResponse } from "next/server";
import dbConnect from '@/lib/db';
import { verifyAdminRole } from '@/lib/adminAuth';

function isKarnatakaScopeOrder(order) {
  if (!order) return false;
  if (order.store_id === "unilet" || order.region === "karnataka") return true;
  if (order.order_deliveryaddress && /karnataka/i.test(order.order_deliveryaddress)) return true;
  if (Array.isArray(order.order_item) && order.order_item.some(i => i.store_id === "unilet")) return true;
  return false;
}

export async function GET(req, { params }) {
  await dbConnect();
  const awaitedParams = await params;
  const orderId = awaitedParams.orderId;
  const roleCheck = await verifyAdminRole(req);

  try {
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (roleCheck.isKarnatakaAdmin && !isKarnatakaScopeOrder(order)) {
      return NextResponse.json({ error: "Access denied: Unauthorized to view orders outside Karnataka Unilet" }, { status: 403 });
    }

    const productItemCodes = order.order_details.map(item => {
      // Check if the item_code starts with 'ITEM' and remove it
      if (item.item_code && item.item_code.startsWith('ITEM')) {
        return item.item_code.substring(4); // 'ITEM' is 4 characters long
      }
      return item.item_code;
    });

    console.log("Trimmed Item codes:", productItemCodes);

    const products = await Product.find({ item_code: { $in: productItemCodes } })
      .select("slug item_code")
      .lean();

    // Log the fetched products to check if a match was found
    console.log("Fetched Products:", products);

    order.order_details = order.order_details.map(item => {
      // Find the corresponding product using the original item_code
      const product = products.find(p => {
        const trimmedCode = p.item_code;
        // Compare the trimmed code from the products array with the order item code
        return item.item_code.endsWith(trimmedCode);
      });
      return { ...item, slug: product?.slug || null };
    });

    console.log("Order with Slugs:", order);
    
    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  await dbConnect();
  const awaitedParams = await params;
  const orderId = awaitedParams.orderId;
  const roleCheck = await verifyAdminRole(req);

  try {
    const existing = await Order.findById(orderId).lean();
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (roleCheck.isKarnatakaAdmin && !isKarnatakaScopeOrder(existing)) {
      return NextResponse.json({ error: "Access denied: Unauthorized to update orders outside Karnataka Unilet" }, { status: 403 });
    }

    const { status, comment, customer_notified } = await req.json();

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: { status }, // update main order status
        $push: {
          order_history: {  // ✅ correct field name
            status,
            comment,
            customer_notified,
            date: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

   return NextResponse.json(updatedOrder, { status: 200 });
// return NextResponse.json(
//   {
//     message: "History updated successfully",
//     order: updatedOrder
//   },
//   { status: 200 }
// );

  } catch (err) {
    console.error("❌ Error updating order:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


