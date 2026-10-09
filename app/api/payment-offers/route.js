import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PaymentOffer from "@/models/PaymentOffer";
import Bank from "@/models/Bank";

export const dynamic = "force-dynamic";

/**
 * Admin API: Payment Offers CRUD
 * GET /api/payment-offers
 * POST /api/payment-offers
 * PATCH /api/payment-offers
 * DELETE /api/payment-offers
 */

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const offerType = searchParams.get("type"); // BANK_OFFER | EMI_OFFER
    const bankId = searchParams.get("bankId");

    const query = {};
    if (offerType) query.offerType = offerType;
    if (bankId) query.bank = bankId;

    const offers = await PaymentOffer.find(query)
      .populate({
        path: "bank",
        select: "name code shortCode logoUrl logo isActive",
      })
      .sort({ createdAt: -1 })
      .lean();

    const banks = await Bank.find({ isActive: true }).sort({ name: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: offers,
      banks,
      count: offers.length,
    });
  } catch (error) {
    console.error("Error fetching payment offers:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      bank,
      title,
      name,
      description,
      offerType,
      discountType = "PERCENTAGE",
      discountValue = 0,
      maxDiscountLimit = 0,
      minOrderValue = 0,
      applicableCategories = ["ALL"],
      cardType = "ALL",
      emiDetails = {},
      validFrom = null,
      validTill = null,
      isActive = true,
      priority = 0,
    } = body;

    if (!bank) {
      return NextResponse.json(
        { success: false, error: "Bank is required" },
        { status: 400 }
      );
    }

    if (!offerType || !["BANK_OFFER", "EMI_OFFER"].includes(offerType)) {
      return NextResponse.json(
        { success: false, error: "Valid offerType is required (BANK_OFFER or EMI_OFFER)" },
        { status: 400 }
      );
    }

    const newOffer = await PaymentOffer.create({
      bank,
      bankId: bank,
      title: title || name || "",
      name: name || title || "",
      description: description || "",
      offerType,
      discountType: (discountType || "PERCENTAGE").toUpperCase(),
      discountValue: Number(discountValue) || 0,
      maxDiscountLimit: Number(maxDiscountLimit) || 0,
      minOrderValue: Number(minOrderValue) || 0,
      applicableCategories: Array.isArray(applicableCategories)
        ? applicableCategories
        : ["ALL"],
      cardType: cardType || "ALL",
      emiDetails: {
        tenureMonths: Number(emiDetails?.tenureMonths) || 0,
        annualInterestRate: Number(emiDetails?.annualInterestRate) || 0,
        isNoCost: Boolean(emiDetails?.isNoCost),
      },
      validFrom: validFrom ? new Date(validFrom) : null,
      validTill: validTill ? new Date(validTill) : null,
      isActive: isActive !== false,
      priority: Number(priority) || 0,
    });

    const populated = await PaymentOffer.findById(newOffer._id)
      .populate("bank")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Payment offer created successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Error creating payment offer:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Offer ID is required" },
        { status: 400 }
      );
    }

    const updated = await PaymentOffer.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate("bank")
      .lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Offer updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating payment offer:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Offer ID is required" },
        { status: 400 }
      );
    }

    const deleted = await PaymentOffer.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment offer:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
