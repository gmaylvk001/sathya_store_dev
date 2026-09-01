import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { getUserPermissions, hasPermission } from "@/lib/permissions";

export async function GET(req) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Authorization token required" }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    const permissions = await getUserPermissions(userId);

    if (slug) {
      const allowed = await hasPermission(userId, slug);
      return NextResponse.json({
        allowed,
        slug,
        permissions,
      });
    }

    return NextResponse.json({
      permissions,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
