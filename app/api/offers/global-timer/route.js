import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Offertimer from "@/models/Offertimer";
import { normalizeRegion } from "@/lib/regionHelper";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const rawState =
      searchParams.get("state") ||
      searchParams.get("region") ||
      req.cookies.get("sathya_location")?.value;

    let region = "tamilnadu";
    if (rawState) {
      try {
        if (rawState.startsWith("{")) {
          const parsed = JSON.parse(rawState);
          region = normalizeRegion(parsed.region || parsed.state || parsed.stateName);
        } else {
          region = normalizeRegion(rawState);
        }
      } catch {
        region = normalizeRegion(rawState);
      }
    }

    const now = new Date();

    const activeTimer = await Offertimer.findOne({
      state: { $in: [region, "all"] },
      status: "active",
      offer_start: { $lte: now },
      offer_end: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      region,
      timer: activeTimer || null,
    });
  } catch (err) {
    console.error("Global timer error:", err);
    return NextResponse.json(
      { success: false, timer: null, message: err.message },
      { status: 500 }
    );
  }
}
