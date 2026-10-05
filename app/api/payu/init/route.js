import { NextResponse } from "next/server";
import { getPayuConfig, generatePayuHash } from "@/lib/payu";
import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";

/**
 * POST /api/payu/init
 * Generates PayU checkout parameters and hash for Unilet / Karnataka orders.
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      order_number,
      amount,
      firstname,
      email,
      phone,
      productinfo,
      user_id,
    } = body;

    if (!order_number || !amount) {
      return NextResponse.json(
        { success: false, error: "order_number and amount are required" },
        { status: 400 }
      );
    }

    const { key, actionUrl } = getPayuConfig();
    const txnid = `TXN_${order_number}_${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const surl = `${baseUrl}/api/payu/status?txnid=${encodeURIComponent(txnid)}`;
    const furl = `${baseUrl}/api/payu/status?txnid=${encodeURIComponent(txnid)}`;

    const {
      hash,
      formattedAmount,
      cleanProductInfo,
      cleanFirstName,
      cleanEmail,
    } = generatePayuHash({
      txnid,
      amount,
      productinfo: productinfo || `Order #${order_number}`,
      firstname: firstname || "Customer",
      email: email || "customer@example.com",
      udf1: String(order_number),
      udf2: String(user_id || ""),
      udf3: "unilet",
      udf4: "",
      udf5: "",
    });

    // Save transaction ID reference on the order(s)
    await OrderNew.updateMany(
      {
        $or: [
          { order_number: order_number },
          { order_number: { $regex: new RegExp(`^${order_number}`) } },
        ],
      },
      {
        $set: {
          online_pay_refid: txnid,
          payment_mode: "PayU",
          payment_type: "PayU",
          payment_method: "online",
        },
      }
    );

    const params = {
      key,
      txnid,
      amount: formattedAmount,
      productinfo: cleanProductInfo,
      firstname: cleanFirstName,
      email: cleanEmail,
      phone: String(phone || "").replace(/\D/g, "").slice(-10) || "9999999999",
      surl,
      furl,
      hash,
      service_provider: "payu_paisa",
      udf1: String(order_number),
      udf2: String(user_id || ""),
      udf3: "unilet",
      udf4: "",
      udf5: "",
    };

    return NextResponse.json({
      success: true,
      action: actionUrl,
      params,
    });
  } catch (error) {
    console.error("[PayU Init Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize PayU" },
      { status: 500 }
    );
  }
}
