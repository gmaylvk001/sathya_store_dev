import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExistSathyaUser from "@/models/ExistSathyaUser";

export async function DELETE(req) {
  await dbConnect();

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await ExistSathyaUser.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await ExistSathyaUser.findByIdAndDelete(userId);

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting exist sathya user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
