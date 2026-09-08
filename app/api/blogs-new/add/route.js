import dbConnect from "@/lib/db";
import Blogs from "@/models/Blogs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.blogTitle || !body.slug) {
      return NextResponse.json({ success: false, error: "Blog Title and Slug are required" }, { status: 400 });
    }

    // Check if slug exists
    const existing = await Blogs.findOne({ slug: body.slug });
    if (existing) {
      return NextResponse.json({ success: false, error: "Slug already exists" }, { status: 400 });
    }

    const newBlog = await Blogs.create(body);
    return NextResponse.json({ success: true, data: newBlog });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
