import connectDB from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import Cart from "@/models/ecom_cart_info";
import Offer from "@/models/ecom_offer_info";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { mobile, otp, guestId } = await req.json();

    // Validate mobile
    if (!mobile || !/^[6-9][0-9]{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    // Validate OTP
    if (!otp) {
      return NextResponse.json(
        { success: false, error: "OTP is required" },
        { status: 400 }
      );
    }

    // TODO: Replace with real OTP verification when API key is available
    // For now, only accept hardcoded OTP "1234"
    if (otp !== "1234") {
      return NextResponse.json(
        { success: false, error: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user with this mobile already exists
    let user = await User.findOne({ mobile });
    let isNewUser = false;

    if (!user) {
      // Create new user with just the mobile number
      user = await User.create({
        mobile,
        name: null,
        email: null,
        password: null,
        user_type: "user",
        status: "Active",
      });
      isNewUser = true;

      // Add new user to all offers with selected_user_type "all"
      try {
        await Offer.updateMany(
          { selected_user_type: "all" },
          {
            $addToSet: { selected_users: user._id },
            $set: { updated_at: new Date() },
          }
        );
      } catch (offerErr) {
        console.warn("Offer update for new OTP user skipped:", offerErr?.message);
      }
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email || "",
        name: user.name || "",
        mobile: user.mobile,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    // Merge guest cart → user cart (same logic as existing login)
    let cartCount = 0;
    if (guestId) {
      const guestCart = await Cart.findOne({ guestId });
      let userCart = await Cart.findOne({ userId: user._id });

      if (guestCart) {
        if (userCart) {
          // merge items
          for (const guestItem of guestCart.items) {
            const existingItem = userCart.items.find(
              (item) => item.productId.toString() === guestItem.productId.toString()
            );
            if (existingItem) {
              existingItem.quantity += guestItem.quantity;
            } else {
              userCart.items.push(guestItem);
            }
          }
          userCart.totalItems = userCart.items.reduce((sum, i) => sum + i.quantity, 0);
          await userCart.save();
          cartCount = userCart.totalItems;
          await Cart.deleteOne({ guestId }); // cleanup
        } else {
          // move guest cart to user
          guestCart.userId = user._id;
          guestCart.guestId = null;
          await guestCart.save();
          cartCount = guestCart.totalItems;
        }
      } else if (userCart) {
        cartCount = userCart.totalItems;
      }
    } else {
      const userCart = await Cart.findOne({ userId: user._id });
      cartCount = userCart?.totalItems || 0;
    }

    return NextResponse.json({
      success: true,
      message: isNewUser ? "Account created and logged in successfully" : "Login successful",
      isNewUser,
      token,
      user: {
        name: user.name || "",
        email: user.email || "",
        userId: user._id,
        role: user.user_type,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error("Verify Phone OTP Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
