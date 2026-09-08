import dbConnect from "@/lib/db";
import Blogs from "@/models/Blogs";
import { NextResponse } from "next/server";

export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body._id) {
      return NextResponse.json({ success: false, error: "Blog ID is required" }, { status: 400 });
    }

    if (body.slug) {
      const existing = await Blogs.findOne({ slug: body.slug, _id: { $ne: body._id } });
      if (existing) {
        return NextResponse.json({ success: false, error: "Slug already exists" }, { status: 400 });
      }
    }

    const updatedBlog = await Blogs.findByIdAndUpdate(body._id, body, { new: true });
    if (!updatedBlog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedBlog });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
