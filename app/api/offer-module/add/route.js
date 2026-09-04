import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferModule from "@/models/OfferModule";

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();

    const { offerName, slug } = data;

    if (!offerName || !slug) {
      return NextResponse.json({ success: false, error: "Offer name and slug are required" }, { status: 400 });
    }

    const existingOffer = await OfferModule.findOne({ slug });
    if (existingOffer) {
      return NextResponse.json({ success: false, error: "Slug already exists" }, { status: 400 });
    }

    const newOffer = new OfferModule({
      offerName,
      slug,
    });

    await newOffer.save();
    return NextResponse.json({ success: true, message: "Offer added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/offer-module/add:", error);
    return NextResponse.json({ success: false, error: "Error adding offer", message: error?.message }, { status: 500 });
  }
}
