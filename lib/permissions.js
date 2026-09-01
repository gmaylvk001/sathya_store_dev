import dbConnect from "@/lib/db";
import User from "@/models/User";
import "@/models/Role";
import "@/models/Permission";

export async function getUserPermissions(userId) {
  if (!userId) {
    return [];
  }

  await dbConnect();

  const user = await User.findById(userId).populate({
    path: "role",
    populate: {
      path: "permissions",
      select: "name slug",
    },
  });

  if (!user) {
    return [];
  }

  if (user.status !== "Active") {
    return [];
  }

  if (user.user_type !== "admin") {
    return [];
  }

  if (!user.role) {
    return [];
  }

  const permissions = user.role.permissions || [];

  return permissions
    .map((permission) => permission?.slug)
    .filter(Boolean);
}

export async function hasPermission(userId, permissionSlug) {
  if (!permissionSlug) {
    return false;
  }

  const slugs = await getUserPermissions(userId);
  return slugs.includes(permissionSlug);
}

export async function hasAnyPermission(userId, permissionSlugs = []) {
  if (!Array.isArray(permissionSlugs) || permissionSlugs.length === 0) {
    return false;
  }

  const slugs = await getUserPermissions(userId);
  return permissionSlugs.some((slug) => slugs.includes(slug));
}

export async function hasAllPermissions(userId, permissionSlugs = []) {
  if (!Array.isArray(permissionSlugs) || permissionSlugs.length === 0) {
    return false;
  }

  const slugs = await getUserPermissions(userId);
  return permissionSlugs.every((slug) => slugs.includes(slug));
}
