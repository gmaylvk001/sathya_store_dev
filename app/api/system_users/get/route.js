import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({ user_type: "admin" });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching system users:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
