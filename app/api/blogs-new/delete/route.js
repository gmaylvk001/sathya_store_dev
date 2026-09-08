import dbConnect from "@/lib/db";
import Blogs from "@/models/Blogs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body._id) {
      return NextResponse.json({ success: false, error: "Blog ID is required" }, { status: 400 });
    }

    const deletedBlog = await Blogs.findByIdAndDelete(body._id);
    if (!deletedBlog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
