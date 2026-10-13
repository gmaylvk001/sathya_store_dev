import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// Same rule as the admin AuthProvider: a valid token whose user has user_type "admin".
export async function getAdminUserId(req) {
  if (!req?.headers) return null;
  let token = "";
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)(?:admin_token|token)=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1].trim());
    }
  }
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || "sathya_secret";
    const decoded = jwt.verify(token, secret);
    const userId = decoded?.userId ? String(decoded.userId) : "";
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    await dbConnect();
    const user = await User.findById(userId).select("user_type").lean();
    return user?.user_type === "admin" ? userId : null;
  } catch {
    return null;
  }
}

