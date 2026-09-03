import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExistSathyaUser, { ensureExistSathyaUserIndexes } from "@/models/ExistSathyaUser";

export async function GET() {
  try {
    await dbConnect();
    await ensureExistSathyaUserIndexes();
    const users = await ExistSathyaUser.find()
      .select("-password -remember_token -confirmation_code")
      .sort({ created_at: -1 });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching exist sathya users:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
