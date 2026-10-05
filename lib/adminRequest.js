import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "@/models/User";

// Same rule as the admin AuthProvider: a valid token whose user has user_type "admin".
export async function getAdminUserId(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.userId ? String(decoded.userId) : "";
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const user = await User.findById(userId).select("user_type").lean();
    return user?.user_type === "admin" ? userId : null;
  } catch {
    return null;
  }
}
