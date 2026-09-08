import dbConnect from "@/lib/db";
import Blogs from "@/models/Blogs";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();
    const blogs = await Blogs.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
