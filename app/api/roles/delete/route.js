import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Role from "@/models/Role";

export async function DELETE(req) {
  await dbConnect();

  try {
    const { roleId } = await req.json();

    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    await Role.findByIdAndDelete(roleId);

    return NextResponse.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
