import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/ecom_payment_info";

export async function POST(req) {
  try {
    // Parse JSON body instead of formData
    const body = await req.json();
    
    const userId = body.user_id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const modevalue = body.modevalue || undefined;
    const payment_Date = body.payment_Date || undefined;
    const payment_id = body.payment_id || undefined;
    const status = body.status || undefined;
    const payment_mode = body.payment_mode || undefined;

    await connectDB();
    
    const paymentData = new Payment({
      userId: userId,
      modevalue: modevalue,
      payment_id: payment_id,
      payment_Date: payment_Date,
      payment_mode: payment_mode,
      status: status,
    });
    
    await paymentData.save();

    return NextResponse.json(
      { 
        message: "Payment saved successfully", 
        paymentData: paymentData 
      },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}