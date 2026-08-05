import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import crypto from 'crypto'; // Add crypto import

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification parameters" },
        { status: 400 }
      );
    }

    // Generate signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Validate signature
    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid signature' }, 
        { status: 400 }
      );
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const isEmiPayment =
      payment.method === 'emi' ||
      payment.method === 'cardless_emi' ||
      (payment.method === 'card' && payment.card?.emi === true);

    return NextResponse.json(
      { 
        success: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        method: payment.method,
        isEmiPayment,
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Payment verification failed' 
      }, 
      { status: 500 }
    );
  }
}