import { NextResponse } from "next/server";

const ADMIN_EMAILS = [
  "arunkarthik@bharathelectronics.in",
  "ecom@bharathelectronics.in",
  "itadmin@bharathelectronics.in",
  "telemarketing@bharathelectronics.in",
  "sekarcorp@bharathelectronics.in",
  "abu@bharathelectronics.in",
  "customercare@bharathelectronics.in",
];

// const ADMIN_EMAILS = [
//   "hariharann2026@gmail.com",
// ];

const EMAIL_AUTH = "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L";
// Contact-form campaign (name, email, mobile, city/category, message)
const EMAIL_CAMPAIGN_ID = "04024860-c288-405b-9be7-9d111419093d";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      fullName,
      mobile,
      email,
      category,
      requirement,
      preferredDate,
      preferredTime,
      connectMethod,
      additionalInfo,
    } = body || {};

    if (!fullName?.trim() || !mobile?.trim() || !preferredDate || !preferredTime) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const messageHtml = [
      "<b>BEA Live Video Call Demo Request</b>",
      `Name: ${fullName}`,
      `Mobile: ${mobile}`,
      `Email: ${email || "N/A"}`,
      `Category: ${category || "N/A"}`,
      `Requirement: ${requirement || "N/A"}`,
      `Preferred Date: ${preferredDate}`,
      `Preferred Time: ${preferredTime}`,
      `Connect via: ${connectMethod || "N/A"}`,
      `Additional: ${additionalInfo || "N/A"}`,
      `Customer WhatsApp: https://wa.me/91${String(mobile).replace(/\D/g, "")}`,
    ].join("<br/>");

    const results = [];

    for (const adminEmail of ADMIN_EMAILS) {
      const fd = new FormData();
      fd.append("campaign_id", EMAIL_CAMPAIGN_ID);
      fd.append("email", adminEmail);
      fd.append(
        "params",
        JSON.stringify([
          fullName,
          email || "N/A",
          mobile,
          category || "Live Demo",
          messageHtml,
        ])
      );

      const res = await fetch("https://bea.eygr.in/api/email/send-msg", {
        method: "POST",
        headers: { Authorization: EMAIL_AUTH },
        body: fd,
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = { raw: await res.text().catch(() => "") };
      }

      results.push({
        email: adminEmail,
        ok: res.ok,
        status: res.status,
        data,
      });
    }

    const anyOk = results.some((r) => r.ok);
    if (!anyOk) {
      console.error("Live demo email send failed:", results);
      return NextResponse.json(
        { success: false, message: "Email API failed", results },
        { status: 502 }
      );
    }

    const waText = [
      "BEA Live Demo Request",
      "",
      `Name: ${fullName}`,
      `Mobile: ${mobile}`,
      `Email: ${email || "N/A"}`,
      `Category: ${category || "N/A"}`,
      `Requirement: ${requirement || "N/A"}`,
      `Preferred Date: ${preferredDate}`,
      `Preferred Time: ${preferredTime}`,
      `Connect via: ${connectMethod || "N/A"}`,
      `Additional: ${additionalInfo || "N/A"}`,
    ].join("\n");

    return NextResponse.json({
      success: true,
      message: "Live demo request sent",
      results,
      whatsappUrl: `https://wa.me/919842344323?text=${encodeURIComponent(waText)}`,
    });
  } catch (error) {
    console.error("Live demo submit error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
