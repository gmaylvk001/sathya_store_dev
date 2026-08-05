import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import {
  processWishlistMails,
  isWishlistMailTestAllowlistEnabled,
  getWishlistMailTestAllowlist,
  getWishlistMailConfig,
  isWithinCronWindow,
} from "@/lib/wishlistMail";

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow in dev if secret not set
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const querySecret = req.nextUrl?.searchParams?.get("secret");
  return token === secret || querySecret === secret;
}

export async function GET(req) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const config = await getWishlistMailConfig();
    const force = req.nextUrl.searchParams.get("force") === "1";
    const testAllowlist = isWishlistMailTestAllowlistEnabled();
    const inWindow = isWithinCronWindow(config, new Date());

    // Normal cron: only inside schedule window. ?force=1 bypasses window (still allowlisted).
    const result = await processWishlistMails({
      force,
      ignoreLimits: false,
      maxForceSends: testAllowlist ? 5 : 50,
    });

    return NextResponse.json({
      success: true,
      timezone: "Asia/Kolkata",
      cronTime: config.cronTime,
      enabled: config.enabled,
      inWindow,
      forced: force,
      testAllowlistEnabled: testAllowlist,
      testAllowlist: testAllowlist ? getWishlistMailTestAllowlist() : undefined,
      result,
    });
  } catch (error) {
    console.error("cron wishlist-mail error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  return GET(req);
}
