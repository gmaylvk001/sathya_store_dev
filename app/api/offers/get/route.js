import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Offer from "@/models/ecom_offer_info";

export async function GET() {
  try {
    await connectDB(); // Ensure DB connection

    // Fetch all offers
    const offers = await Offer.find({});

    // Get the current date
    const currentDate = new Date();

    // Update offers where to_date has passed
    const updatedOffers = await Promise.all(
      offers.map(async (offer) => {
        const toDate = new Date(offer.to_date);

        // Check if to_date has passed
        if (toDate < currentDate && offer.fest_offer_status !== "inactive") {
          // Update the status to inactive
          //offer.fest_offer_status = "inactive";
          await offer.save(); // Save the updated offer to the database
        }

        return offer;
      })
    );

    // Return the updated offers
    return NextResponse.json({ success: true, data: updatedOffers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}