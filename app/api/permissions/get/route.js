import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Permission from "@/models/Permission";

export async function GET() {
  try {
    await dbConnect();
    const permissions = await Permission.find().sort({ createdAt: -1 });
    return NextResponse.json(permissions, { status: 200 });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
