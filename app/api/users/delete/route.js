import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // Adjust the path to your database connection utility
import User from "@/models/User"; // Adjust the path to your User model

export async function DELETE(req) {
  await dbConnect();

  try {
    const { userId } = await req.json(); // Extract userId from the request body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Find the user to be updated
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the user's status to "Inactive"
    await User.findByIdAndUpdate(userId, { status: "Inactive" });

    return NextResponse.json({ success: true, message: "User set to inactive" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}