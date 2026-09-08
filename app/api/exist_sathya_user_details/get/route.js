import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExistSathyaUserDetail from "@/models/ExistSathyaUserDetail";

export async function GET() {
  try {
    await dbConnect();
    const details = await ExistSathyaUserDetail.find()
      .sort({ created_at: -1, exist_id: -1 })
      .lean();
    return NextResponse.json(details, { status: 200 });
  } catch (error) {
    console.error("Error fetching exist sathya user details:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
