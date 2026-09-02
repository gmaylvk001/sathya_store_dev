import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyAdminRole } from "@/lib/adminAuth";

export async function GET(req) {
  try {
    await dbConnect();
    const roleCheck = await verifyAdminRole(req);

    let query = { user_type: "user" };
    if (roleCheck.isKarnatakaAdmin) {
      query = {
        user_type: "user",
        $or: [
          { region: "karnataka" },
          { store: "unilet" },
          { address: /karnataka/i },
          { email: /unilet/i }
        ]
      };
    }

    const users = await User.find(query);
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
