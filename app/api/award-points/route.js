import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const {
      phoneNumber,
      orderNumber,
      orderAmount,
      firstName,
      lastName,
      email,
      cartItems,
      loyaltyPointsRedeemedAmount,
      loyaltyPointsRedeemedCode,
      paymentMode,
      promotionCode,
      promotionDiscount,
    } = body;

    if (!phoneNumber || !orderNumber || !orderAmount) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

   
    console.log("AWARD-POINTS called for orderNumber:", orderNumber);

    const trucoUrl = `${process.env.TRUCO_BASE_URL}/external/transaction`;
    console.log("Truco transaction URL:", trucoUrl);

    const trucoRes = await fetch(
      trucoUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.TRUCO_API_KEY
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          invoice: {
            invoice_number: orderNumber,
            invoice_date: new Date().toISOString(),
            gross_amount: orderAmount,
            net_amount: orderAmount,
            currency: "INR",
            payment_method: paymentMode === "Cash on Delivery" ? "cod" : "card",
            sales_channel: "online",
            loyalty_points_redeemed_amount: loyaltyPointsRedeemedAmount || 0,
            loyalty_points_redeemed_code: loyaltyPointsRedeemedCode || "",
            promotion_code_applied: promotionCode || "",
            promotion_discount_applied: promotionDiscount || 0,
            line_items: cartItems.map((item) => ({
              product_code: item.item_code || String(item.id),
              product_name: item.name,
              category: item.category || "General",
              quantity: item.quantity,
              unit_price: item.price,
              line_total: item.price * item.quantity
            }))
          },
          store_info: {
            store_code: "ECOM",
            store_name: "Online Store",
            location: "web",
            terminal_id: "ecom-web",
            cashier_code: "system"
          },
          metadata: {
            source_system: "bea-ecom",
            customer_first_name: firstName,
            customer_last_name: lastName,
            customer_email: email
          }
        })
      }
    );

    const rawBody = await trucoRes.text();
    const contentType = trucoRes.headers.get("content-type") || "";

    if (!trucoRes.ok || !contentType.includes("application/json")) {
      console.error(
        "Truco returned a non-JSON / error response.",
        "status:", trucoRes.status,
        "content-type:", contentType,
        "url:", trucoUrl,
        "body(first 300 chars):", rawBody.slice(0, 300)
      );
      return NextResponse.json(
        {
          success: false,
          message: `Truco API error (HTTP ${trucoRes.status}). Endpoint did not return JSON.`,
          status: trucoRes.status,
          url: trucoUrl,
          bodyPreview: rawBody.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const trucoData = JSON.parse(rawBody);
    console.log("Truco response:", trucoData);
    console.log("Truco invoice_number vs our orderNumber:", trucoData.invoice_number, "vs", orderNumber); // 🆕

    if (trucoData.success) {
      const updateResult = await EcomOrderInfo.findOneAndUpdate(
        { order_number: orderNumber },
        {
          loyalty_points_awarded: trucoData.points_awarded,
          truco_transaction_id: trucoData.transaction_id,
          promotion_code_applied: promotionCode || null,
          promotion_discount_applied: promotionDiscount || 0,
        },
        { new: true }   
      );

      console.log("DB update result:", updateResult ? "FOUND & UPDATED" : "ORDER NOT FOUND IN DB", "for orderNumber:", orderNumber); // 🆕

      return NextResponse.json({
        success: true,
        points_awarded: trucoData.points_awarded,
        message: trucoData.messages?.[0] || "Points awarded successfully"
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Truco API failed",
        error: trucoData.error
      });
    }

  } catch (error) {
    console.error("Award points error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ success: false, points: 0 });
  }

  try {
    const res = await fetch(
      `${process.env.TRUCO_BASE_URL}/external/customer/check?phoneNumber=${phone}`,
      {
        headers: {
          'X-Api-Key': process.env.TRUCO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await res.json();

    if (data.customerExists) {
      return NextResponse.json({
        success: true,
        points: data.currentPointsBalance || 0,
        value: data.currentBalanceValue || 0,
        pointsPerCurrencyUnit: data.pointsPerCurrencyUnit || null,
      });
    } else {
      return NextResponse.json({ success: false, points: 0 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, points: 0 });
  }
}