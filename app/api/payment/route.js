import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import PaymentNewLive from "@/models/payment_new_live";
import OrderNew from "@/models/orders_new";

function toObjectId(value) {
  if (!value) return null;
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const userId = body.user_id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const modevalue = body.modevalue ?? null;
    const payment_Date = body.payment_Date || null;
    const payment_id = body.payment_id || null;
    const status = body.status || null;
    const payment_mode = body.payment_mode || null;

    await connectDB();

    const recentCutoff = new Date(Date.now() - 10 * 60 * 1000);
    const recentOrder = await OrderNew.findOne({
      user_id: String(userId),
      created_at: { $gte: recentCutoff },
    })
      .sort({ created_at: -1 })
      .lean();

    const payload = {
      userId: toObjectId(userId),
      order_number: recentOrder?.order_number || null,
      amount: modevalue != null && modevalue !== "" ? Number(modevalue) : null,
      status,
      ModeType: payment_mode,
      PaymentMode: payment_mode,
      ModeValue: modevalue != null ? String(modevalue) : null,
      payment_id,
      payment_date: payment_Date ? String(payment_Date) : null,
      ReferenceDate: payment_Date ? new Date(payment_Date) : new Date(),
    };

    let paymentData;

    if (recentOrder?._id) {
      paymentData = await PaymentNewLive.findOneAndUpdate(
        { orderId: recentOrder._id },
        { $set: { ...payload, orderId: recentOrder._id } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      paymentData = await PaymentNewLive.create({
        ...payload,
        orderId: new mongoose.Types.ObjectId(),
      });
    }

    return NextResponse.json(
      {
        message: "Payment saved successfully",
        paymentData: {
          ...paymentData.toObject(),
          payment_id: paymentData.payment_id,
          status: paymentData.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
