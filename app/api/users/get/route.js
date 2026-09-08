import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getMappedLiveUserIdSet } from "@/lib/existUserDetailsMap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({ user_type: "user" }).lean();
    const mapped = await getMappedLiveUserIdSet(users.map((user) => user._id));
    const data = users.map((user) => ({
      ...user,
      details_fetched: mapped.has(String(user._id)),
    }));
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
