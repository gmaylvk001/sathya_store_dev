import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import Order from '@/models/ecom_order_info';
import { verifyAdminRole } from '@/lib/adminAuth';

export async function GET(req) {
  try {
    await dbConnect();
    const roleCheck = await verifyAdminRole(req);

    let filter = {};
    if (roleCheck.isKarnatakaAdmin) {
      filter = {
        $or: [
          { store_id: "unilet" },
          { region: "karnataka" },
          { order_deliveryaddress: /karnataka/i },
          { "order_item.store_id": "unilet" }
        ]
      };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching orders', error: error.message }, { status: 500 });
  }
}
