import mongoose from "mongoose";
import { verifyToken } from "@/lib/verifyToken";
import User from "@/models/User";
import "@/models/Role";

export const STORE_VIEW_COOKIE = "session_store";

export async function isUniletRoleAdmin(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return false;
  try {
    const decoded = verifyToken(token);
    if (!decoded?.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) return false;
    const admin = await User.findById(decoded.userId).populate("role", "name slug").lean();
    const roleText = `${admin?.role?.name || ""} ${admin?.role?.slug || ""}`.toLowerCase();
    return roleText.includes("unilet");
  } catch {
    return false;
  }
}

// Unilet View switch on, or a Unilet role admin -> unilet records; otherwise sathya records.
export async function isUniletView(req) {
  if (req.cookies?.get(STORE_VIEW_COOKIE)?.value === "unilet") return true;
  return isUniletRoleAdmin(req);
}

export function ownerFieldFilter(field, uniletView) {
  return uniletView
    ? { [field]: { $regex: /^unilet$/i } }
    : { [field]: { $not: /^unilet$/i } };
}

export function orderOwnerFilter(uniletView) {
  return ownerFieldFilter("order_owner", uniletView);
}
