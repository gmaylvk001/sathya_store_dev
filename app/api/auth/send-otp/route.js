import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { mobile } = await req.json();

    // Validate 10-digit Indian mobile number
    if (!mobile || !/^[6-9][0-9]{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    await connectDB();

    // TODO: Replace with real SMS OTP API when key is available
    // For now, OTP is hardcoded as 1234
    const otp = "1234";

    console.log(`[OTP] Sending OTP ${otp} to mobile ${mobile}`);

    // In a real implementation, you would:
    // 1. Generate a random 4-6 digit OTP
    // 2. Store it in DB or cache (Redis) with expiry (e.g., 5 minutes)
    // 3. Send it via SMS API (MSG91, Twilio, etc.)

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
