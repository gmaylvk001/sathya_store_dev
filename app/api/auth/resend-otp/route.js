// app/api/auth/resend-otp/route.js

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, mobile } = body;

    if (!email && !mobile) {
      return NextResponse.json(
        { error: "Email or mobile is required" },
        { status: 400 }
      );
    }

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 🚀 Send Email or SMS here
    if (email) {
      console.log(`Resend OTP ${otp} to email ${email}`);
      // await sendEmail(email, otp);
    }

    if (mobile) {
      console.log(`Resend OTP ${otp} to mobile ${mobile}`);
      // await sendSMS(mobile, otp);
    }

    // Store OTP in DB/Redis with expiration if needed

    return NextResponse.json({ message: "New OTP resent successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to resend OTP" },
      { status: 500 }
    );
  }
}
