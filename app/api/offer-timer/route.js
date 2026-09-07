import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferTimer from "@/models/Offertimer";

export async function GET() {
  try {
    await dbConnect();
    const timers = await OfferTimer.find().sort({ timerId: -1 }).lean();
    return NextResponse.json({ success: true, data: timers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching offer timers:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch offer timers" }, { status: 500 });
  }
}
