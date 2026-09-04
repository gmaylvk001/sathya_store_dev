import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import HighlightedProductSettings from "@/models/HighlightedProductSettings";

export async function GET() {
  try {
    await dbConnect();
    let settings = await HighlightedProductSettings.findOne();
    if (!settings) {
      settings = await HighlightedProductSettings.create({
        labelText: "Highlighted Products",
        labelColor: "#ff0000",
      });
    }
    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching highlighted settings:", error);
    return NextResponse.json({ success: false, error: "Error fetching settings" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    await dbConnect();

    let settings = await HighlightedProductSettings.findOne();
    if (settings) {
      settings.labelText = data.labelText;
      settings.labelColor = data.labelColor;
      await settings.save();
    } else {
      settings = await HighlightedProductSettings.create({
        labelText: data.labelText,
        labelColor: data.labelColor,
      });
    }

    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error) {
    console.error("Error updating highlighted settings:", error);
    return NextResponse.json({ success: false, error: "Error updating settings" }, { status: 500 });
  }
}
