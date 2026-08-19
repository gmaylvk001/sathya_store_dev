import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import OwnerProduct from "@/models/OwnerProduct";
import Store from "@/models/store";
import PincodeLocation from "@/models/PincodeLocation";
import {
  calculateHaversineDistance,
  calculateDeliveryDays,
  formatDeliveryMessage,
} from "@/lib/distanceCalculator";
import {
  isValidPincode,
  isKarnatakaPincode,
  lookupPincode,
  normalizeRegion,
} from "@/lib/regionHelper";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode")?.trim();
    const itemCode = searchParams.get("item_code")?.trim();
    const productId = searchParams.get("productId")?.trim();

    if (!pincode || !isValidPincode(pincode)) {
      return NextResponse.json(
        {
          status: 0,
          available: false,
          message: "Please enter a valid 6-digit pincode",
        },
        { status: 400 }
      );
    }

    // 1. Resolve target location and state
    let targetLat = null;
    let targetLng = null;
    let region = "tamilnadu";

    const cachedLoc = await PincodeLocation.findOne({ pincode }).lean();
    if (cachedLoc && cachedLoc.latitude && cachedLoc.longitude) {
      targetLat = cachedLoc.latitude;
      targetLng = cachedLoc.longitude;
      region = cachedLoc.region || "tamilnadu";
    } else {
      const geo = await lookupPincode(pincode);
      region = geo.region || "tamilnadu";
      if (geo.latitude && geo.longitude) {
        targetLat = geo.latitude;
        targetLng = geo.longitude;
      }
    }

    const isKarnataka = region === "karnataka" || isKarnatakaPincode(pincode);

    // 2. Fetch Product
    let product = null;
    if (itemCode) {
      product = await Product.findOne({ item_code: itemCode, status: "Active" }).lean();
    } else if (productId) {
      product = await Product.findById(productId).lean();
    }

    if (product) {
      // Check Karnataka specific Unilet stock rule
      if (isKarnataka) {
        const ownerProduct = await OwnerProduct.findOne({
          $or: [{ product_id: product._id }, { product_item_code: product.item_code }],
          is_active: true,
        }).lean();

        if (!ownerProduct || ownerProduct.stock <= 0 || ownerProduct.stock_status === "Out of Stock") {
          return NextResponse.json({
            status: 0,
            available: false,
            message: "Not Available for Delivery at Your Location",
            state: "Karnataka",
            isKarnataka: true,
          });
        }
      } else {
        // Non-Karnataka standard stock check
        if (product.quantity <= 0 && product.movement !== "CUS-Order" && product.stock_status === "Out of Stock") {
          return NextResponse.json({
            status: 0,
            available: false,
            message: "Out of Stock",
          });
        }
      }
    }

    // 3. Find closest store/warehouse to compute delivery time
    const stores = await Store.find({ status: "Active" }).lean();

    // Check exact store zipcode match
    const exactMatch = stores.find((s) => s.zipcode === pincode);
    if (exactMatch) {
      return NextResponse.json({
        status: 1,
        available: true,
        days: 1,
        message: "Delivery in One Day",
        region,
      });
    }

    // Calculate minimum distance from available physical stores
    let minDistance = 9999;

    if (targetLat && targetLng && stores.length > 0) {
      for (const store of stores) {
        if (store.location_map?.lat && store.location_map?.lng) {
          const dist = calculateHaversineDistance(
            targetLat,
            targetLng,
            store.location_map.lat,
            store.location_map.lng
          );
          if (dist < minDistance) {
            minDistance = dist;
          }
        }
      }
    }

    const days = minDistance < 9999 ? calculateDeliveryDays(minDistance, 100, 1) : 2;
    const message = formatDeliveryMessage(days, false);

    return NextResponse.json({
      status: 1,
      available: true,
      days,
      distanceKm: minDistance < 9999 ? Math.round(minDistance) : null,
      message,
      region,
    });
  } catch (err) {
    console.error("Check delivery pincode error:", err);
    return NextResponse.json(
      {
        status: 0,
        available: false,
        message: "Unable to calculate delivery estimate at this time",
      },
      { status: 500 }
    );
  }
}
