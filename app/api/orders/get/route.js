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
import product from "@/models/product";
import jwt from "jsonwebtoken";

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
      updatedOrders.push({
        ...orderObj,
        order_item: itemsWithSlug,
        // Map created_at to createdAt for frontend backwards compatibility
        createdAt: orderObj.created_at || orderObj.createdAt,
        updatedAt: orderObj.updated_at || orderObj.updatedAt,
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