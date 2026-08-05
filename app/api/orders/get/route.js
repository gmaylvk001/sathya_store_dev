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
import Order from "@/models/ecom_order_info";
import product from "@/models/product";
import jwt from "jsonwebtoken";

export async function GET(req) {
  await dbConnect();

  try {
    console.log("hai");
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
    console.log(order_number);
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

    const orders        = await Order.find(query).sort({ createdAt: -1 });

    const updatedOrders = [];
    for (let order of orders) {
      const itemsWithSlug = [];

      for (let item of order.order_item) {
        const productDoc = await product.findOne(
          { item_code: item.item_code },
          "slug"
        );

        itemsWithSlug.push({
          ...item.toObject?.() || item,
          slug: productDoc?.slug || null
        });
      }

      updatedOrders.push({
        ...order.toObject(),
        order_item: itemsWithSlug
      });
    }
    
    if (order_number && updatedOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orders:updatedOrders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}