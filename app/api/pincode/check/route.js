import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PincodeServiceability from "@/models/PincodeServiceability";
import Store from "@/models/store";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode")?.trim();

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Invalid pincode" },
        { status: 400 }
      );
    }

    // Step 1: PincodeServiceability DB-la search → distanceKm sort → top 3
    const results = await PincodeServiceability.find({ serviceablePincode: pincode })
      .sort({ distanceKm: 1 })
      .lean();

    if (!results.length) {
      return NextResponse.json(
        { success: false, error: "Pincode not serviceable" },
        { status: 404 }
      );
    }

    const filtered = results.filter((r) => r.distanceKm > 0).slice(0, 3);
    const nearest3 = filtered.length > 0 ? filtered : results.slice(0, 3);

    
    const branchPincodes = nearest3.map((r) => r.branchPincode).filter(Boolean);

    if (!branchPincodes.length) {
      return NextResponse.json(
        { success: false, error: "No branch pincodes found" },
        { status: 404 }
      );
    }

    const stores = await Store.find({
      zipcode: { $in: branchPincodes },
    }).lean();

    if (!stores.length) {
      return NextResponse.json(
        { success: false, error: "No stores found for nearby branches" },
        { status: 404 }
      );
    }

    const storeMap = {};
    stores.forEach((s) => {
      storeMap[s.zipcode] = s;
    });

    const orderedStores = nearest3
      .map((branch) => {
        const store = storeMap[branch.branchPincode];
        if (!store) return null;
        return {
          ...store,
          distanceKm: branch.distanceKm,
          branchPincode: branch.branchPincode,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      pincode,
      stores: orderedStores,
    });
  } catch (err) {
    console.error("Pincode check error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}