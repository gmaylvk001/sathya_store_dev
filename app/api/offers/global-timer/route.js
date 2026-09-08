import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Offertimer from "@/models/Offertimer";
import { normalizeRegion } from "@/lib/regionHelper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const rawState =
      searchParams.get("state") ||
      searchParams.get("region") ||
      req.cookies?.get("sathya_location")?.value;

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
    const regionRegex = new RegExp(`^${region}$`, "i");
    const stateNameMap = {
      tamilnadu: "Tamil Nadu",
      kerala: "Kerala",
      andhra: "Andhra Pradesh",
      karnataka: "Karnataka",
      telangana: "Telangana",
    };
    const friendlyName = stateNameMap[region] || "";
    const nameRegex = friendlyName ? new RegExp(`^${friendlyName}$`, "i") : null;

    const stateMatchOr = [
      { offerViewStates: "all" },
      { offerViewStates: region },
      { offerViewStates: regionRegex },
      { states: "all" },
      { states: region },
      { states: regionRegex },
      { state: "all" },
      { state: region },
      { state: regionRegex },
    ];
    if (nameRegex) {
      stateMatchOr.push(
        { offerViewStates: nameRegex },
        { states: nameRegex },
        { state: nameRegex }
      );
    }

    const activeTimer = await Offertimer.findOne({
      $and: [
        {
          $or: [
            { timerDisplayStatus: "Yes" },
            { status: "active" },
          ],
        },
        {
          $or: [
            { startDate: { $lte: now }, endDate: { $gt: now } },
            { offer_start: { $lte: now }, offer_end: { $gt: now } },
          ],
        },
        {
          $or: stateMatchOr,
        },
      ],
    })
      .sort({ startDate: -1, offer_start: -1, createdAt: -1 })
      .lean();

    const banner = activeTimer?.topBanner || activeTimer?.top_banner_url || null;
    const top_banner_url = banner
      ? (banner.startsWith("/") ? banner : `/uploads/topbanner/${banner}`)
      : null;

    return NextResponse.json(
      {
        success: true,
        region,
        top_banner_url,
        activeTopBanner: top_banner_url,
        timer: activeTimer
          ? {
              ...activeTimer,
              top_banner_url,
              topBanner: top_banner_url,
              startDate: activeTimer.startDate || activeTimer.offer_start,
              endDate: activeTimer.endDate || activeTimer.offer_end,
              offerTitle: activeTimer.offerTitle || activeTimer.offer_title,
            }
          : null,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("Global timer error:", err);
    return NextResponse.json(
      { success: false, timer: null, message: err.message },
      { status: 500 }
    );
  }
}
