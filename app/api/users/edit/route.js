import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function PUT(req) {
  await dbConnect();

  try {
    const { userId, name, mobile, email, status } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
  // ✅ Validate mobile (10 digits only)
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: "Mobile number must be exactly 10 digits" }, { status: 400 });
    }

    // ✅ Validate email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    // Check if email or mobile already exists for another user
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
      _id: { $ne: userId }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or mobile already exists" },
        { status: 400 }
      );
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, mobile, email, status },
      { new: true , runValidators: true}
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    // console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}