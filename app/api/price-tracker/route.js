import { NextResponse } from "next/server";
import {
  getLastVerifiedSlot,
  getLastVerifiedSlotDetailed,
  getNextSyncCountdown,
  getCompetitorDeals,
} from "@/lib/priceTrackerService";

export const dynamic = "force-dynamic";

/**
 * Live Market Price Comparison API
 * Route: GET /api/price-tracker?sku=[code]&price=[sathyaPrice]&title=[title]
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku") || searchParams.get("item_code") || "";
    const title = searchParams.get("title") || searchParams.get("name") || "";
    const rawPrice = searchParams.get("price") || "0";
    const sathyaPrice = parseFloat(rawPrice) || 0;

    const now = new Date();
    const lastVerifiedSlot = getLastVerifiedSlot(now);
    const slotDetails = getLastVerifiedSlotDetailed(now);
    const countdown = getNextSyncCountdown(now);

    if (sathyaPrice <= 0) {
      return NextResponse.json({
        success: true,
        sku,
        sathyaPrice: 0,
        lastVerifiedSlot,
        lastVerifiedSlotFormatted: slotDetails.label,
        nextSyncInSeconds: countdown,
        deals: [],
      });
    }

    const deals = getCompetitorDeals({
      sku,
      title,
      sathyaPrice,
      currentDate: now,
    });

    const maxAge = Math.min(3600, Math.max(60, countdown));

    return NextResponse.json(
      {
        success: true,
        sku,
        sathyaPrice,
        lastVerifiedSlot,
        lastVerifiedSlotFormatted: slotDetails.label,
        nextSyncInSeconds: countdown,
        deals,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=300`,
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/price-tracker:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", deals: [] },
      { status: 500 }
    );
  }
}
