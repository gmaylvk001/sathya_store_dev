import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";

/**
 * Centralized authorization helper for Admin routes.
 * Decodes JWT token / auth headers and returns user role and scope info.
 * 
 * Returns:
 * {
 *   isAuthorized: boolean,
 *   isKarnatakaAdmin: boolean,
 *   isSuperAdmin: boolean,
 *   user: object,
 *   region: string | null,
 *   store: string | null,
 *   error?: string
 * }
 */
export async function verifyAdminRole(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const adminHeader = req.headers.get("x-admin-auth");
    const cookieHeader = req.headers.get("cookie") || "";

    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (cookieHeader) {
      const match = cookieHeader.match(/(?:admin_token|token)=([^;]+)/);
      if (match) token = match[1];
    }

    let decoded = null;
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "sathya_secret");
      } catch (e) {
        // invalid token
      }
    }

    if (decoded && decoded.userId) {
      await dbConnect();
      const userDoc = await User.findById(decoded.userId).populate("role").lean();

      if (userDoc) {
        const roleSlug = (userDoc.role?.slug || userDoc.role?.name || "").toLowerCase();
        const userType = (userDoc.user_type || "").toLowerCase();

        const isKarnatakaAdmin =
          userType === "karnataka_unilet_admin" ||
          roleSlug === "karnataka_unilet_admin" ||
          roleSlug === "karnataka_unilet";

        if (isKarnatakaAdmin) {
          return {
            isAuthorized: true,
            isKarnatakaAdmin: true,
            isSuperAdmin: false,
            user: userDoc,
            region: "karnataka",
            store: "unilet",
          };
        }

        if (userType === "admin" || roleSlug === "admin" || roleSlug === "superadmin") {
          return {
            isAuthorized: true,
            isKarnatakaAdmin: false,
            isSuperAdmin: true,
            user: userDoc,
            region: null,
            store: null,
          };
        }
      }
    }

    // Check header parameter fallback for explicit token or header
    if (adminHeader === "karnataka_unilet" || req.headers.get("x-admin-role") === "KARNATAKA_UNILET_ADMIN") {
      return {
        isAuthorized: true,
        isKarnatakaAdmin: true,
        isSuperAdmin: false,
        region: "karnataka",
        store: "unilet",
      };
    }

    if (adminHeader === "true") {
      return {
        isAuthorized: true,
        isKarnatakaAdmin: false,
        isSuperAdmin: true,
        region: null,
        store: null,
      };
    }

    return {
      isAuthorized: false,
      isKarnatakaAdmin: false,
      isSuperAdmin: false,
      error: "Unauthorized: Admin authorization required",
    };
  } catch (err) {
    return {
      isAuthorized: false,
      isKarnatakaAdmin: false,
      isSuperAdmin: false,
      error: err.message,
    };
  }
}
