import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function DELETE(req) {
  await dbConnect();

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.user_type !== "admin") {
      return NextResponse.json({ error: "Only admin users can be updated here" }, { status: 403 });
    }

    await User.findByIdAndUpdate(userId, { status: "Inactive" });

    return NextResponse.json({ success: true, message: "User set to inactive" });
  } catch (error) {
    console.error("Error updating system user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
