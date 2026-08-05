import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import HomeSection from "@/models/homeSection";

// ✅ Add new section
export async function POST(request) {
  await dbConnect();
  const { name, status } = await request.json();

  const maxSection = await HomeSection.findOne().sort({ position: -1 });
  const newSection = new HomeSection({
    name,
    status,
    position: maxSection ? maxSection.position + 1 : 0,
  });

  await newSection.save();
  return NextResponse.json({ section: newSection });
}

// ✅ Edit section
export async function PUT(request) {
  await dbConnect();
  const { _id, name, status } = await request.json();

  const updated = await HomeSection.findByIdAndUpdate(
    _id,
    { name, status },
    { new: true }
  );

  return NextResponse.json({ section: updated });
}
