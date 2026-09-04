import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferModule from "@/models/OfferModule";

export async function PUT(req) {
  try {
    await dbConnect();
    const data = await req.json();

    const { id, offerName, slug } = data;

    if (!id || !offerName || !slug) {
      return NextResponse.json({ success: false, error: "ID, offer name, and slug are required" }, { status: 400 });
    }

    const existingOffer = await OfferModule.findOne({ slug, _id: { $ne: id } });
    if (existingOffer) {
      return NextResponse.json({ success: false, error: "Slug already exists for another offer" }, { status: 400 });
    }

    const updatedOffer = await OfferModule.findByIdAndUpdate(
      id,
      { offerName, slug },
      { new: true }
    );

    if (!updatedOffer) {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Offer updated successfully", data: updatedOffer }, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/offer-module/update:", error);
    return NextResponse.json({ success: false, error: "Error updating offer", message: error?.message }, { status: 500 });
  }
}
