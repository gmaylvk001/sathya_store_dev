import { NextResponse } from "next/server";

const EMAIL_AUTH =
  process.env.EYGR_EMAIL_AUTH ||
  "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L";

// Loyalty campaign ID (same style as order mail). Replace the default below
// with the real Eygr loyalty campaign ID.
const LOYALTY_CAMPAIGN_ID =
  process.env.EYGR_LOYALTY_CAMPAIGN_ID ||
  "b190d8e6-6e3d-4b31-a2f2-56076230c1cb";

const formatPoints = (value) =>
  Number(value || 0).toLocaleString("en-IN");

async function getTotalPoints(phoneNumber) {
  if (!phoneNumber) return null;
  try {
    const res = await fetch(
      `${process.env.TRUCO_BASE_URL}/external/customer/check?phoneNumber=${phoneNumber}`,
      {
        headers: {
          "X-Api-Key": process.env.TRUCO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );
    const data = await res.json();
    if (data.customerExists) {
      return {
        total: data.currentPointsBalance || 0,
        value: data.currentBalanceValue || 0,
      };
    }
  } catch (error) {
    console.error("Truco balance fetch failed:", error);
  }
  return null;
}

async function sendEygrEmail(campaignId, email, params) {
  const formData = new FormData();
  formData.append("campaign_id", campaignId);
  formData.append("email", email);
  formData.append("params", JSON.stringify(params));

  const response = await fetch("https://bea.eygr.in/api/email/send-msg", {
    method: "POST",
    headers: { Authorization: EMAIL_AUTH },
    body: formData,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { raw: await response.text().catch(() => "") };
  }

  return { ok: response.ok, status: response.status, data, email };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      customerEmail,
      name,
      orderNumber,
      pointsEarned,
      phoneNumber,
      totalPoints: totalPointsFromBody,
    } = body;

    if (!customerEmail || !orderNumber) {
      return NextResponse.json(
        { success: false, error: "customerEmail and orderNumber are required" },
        { status: 400 },
      );
    }

    const balance = await getTotalPoints(phoneNumber);
    const totalPoints =
      balance?.total ?? Number(totalPointsFromBody || 0);

    // Params sent to Eygr loyalty campaign (campaign expects exactly 3).
    const params = [
      orderNumber, // {{1}} order id
      formatPoints(pointsEarned), // {{2}} points earned this order
      formatPoints(totalPoints), // {{3}} total available points
    ];

    const result = await sendEygrEmail(
      LOYALTY_CAMPAIGN_ID,
      customerEmail,
      params,
    );

    console.log("Loyalty email result:", { orderNumber, result });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: "Eygr delivery failed", result },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: true, orderNumber, totalPoints, result },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending loyalty email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send loyalty email" },
      { status: 500 },
    );
  }
}
