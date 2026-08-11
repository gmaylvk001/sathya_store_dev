import { PAGE_TYPES } from "@/lib/categoryPageComponents/registry";

export function pageTypeFromLevel(level = 0) {
  if (level <= 0) return PAGE_TYPES.CATEGORY;
  if (level === 1) return PAGE_TYPES.SUB_CATEGORY;
  return PAGE_TYPES.CHILD_CATEGORY;
}

export function availabilityKey(categoryId, pageType) {
  return `${String(categoryId)}:${pageType}`;
}

export function buildCategoryBasePath(slugs = []) {
  const parts = (slugs || [])
    .map((slug) => String(slug || "").trim())
    .filter(Boolean)
    .map((slug) => encodeURIComponent(slug));
  if (!parts.length) return "/category";
  return `/category/${parts.join("/")}`;
}

/**
 * Build listing or overview href for a category hierarchy path.
 * Appends /overview only when hasOverview is true.
 */
export function buildCategoryHref(slugs = [], hasOverview = false) {
  const base = buildCategoryBasePath(slugs);
  return hasOverview ? `${base}/overview` : base;
}

export function hasOverviewAvailability(map, categoryId, pageType) {
  if (!map || !categoryId || !pageType) return false;
  return Boolean(map[availabilityKey(String(categoryId), pageType)]);
}
