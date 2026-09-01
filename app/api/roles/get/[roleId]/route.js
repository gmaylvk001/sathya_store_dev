import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Role from "@/models/Role";
import "@/models/Permission";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { roleId } = await params;

    const role = await Role.findById(roleId).populate("permissions", "name slug");
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(role, { status: 200 });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
