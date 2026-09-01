import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Role from "@/models/Role";
import "@/models/Permission";

export async function GET() {
  try {
    await dbConnect();
    const roles = await Role.find()
      .populate("permissions", "name slug")
      .sort({ createdAt: -1 });
    return NextResponse.json(roles, { status: 200 });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
