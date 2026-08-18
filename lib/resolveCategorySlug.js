import ecom_category_info from "@/models/ecom_category_info";
import CategoryPage from "@/models/categoryPage";

/** Known CMS / URL typos → canonical category_slug */
const SLUG_ALIASES = {
  "air-conditoner": "air-conditioner",
};

function normalizeSlug(slug) {
  return String(slug || "").trim().toLowerCase();
}

function slugCandidates(slug) {
  const normalized = normalizeSlug(slug);
  if (!normalized) return [];
  const set = new Set([normalized]);
  const alias = SLUG_ALIASES[normalized];
  if (alias) set.add(normalizeSlug(alias));
  return [...set];
}

function isNearSlug(a, b) {
  const left = normalizeSlug(a).replace(/-/g, "");
  const right = normalizeSlug(b).replace(/-/g, "");
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 8 && right.length >= 8) {
    return left.startsWith(right.slice(0, 8)) || right.startsWith(left.slice(0, 8));
  }
  return false;
}

async function findBySlugCandidates(candidates = []) {
  if (!candidates.length) return null;
  const direct = await ecom_category_info
    .findOne({ category_slug: { $in: candidates } })
    .lean();
  if (direct) return direct;

  for (const cand of candidates) {
    const escaped = cand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const byRegex = await ecom_category_info
      .findOne({ category_slug: { $regex: new RegExp(`^${escaped}$`, "i") } })
      .lean();
    if (byRegex) return byRegex;
  }
  return null;
}

/**
 * Resolve a category document by URL slug.
 * Tries: direct/alias slugs → CategoryPage alias → child under parentSlug.
 */
export async function resolveCategoryBySlug(slug, parentSlug = null) {
  const candidates = slugCandidates(slug);
  if (!candidates.length) return null;

  const direct = await findBySlugCandidates(candidates);
  if (direct) return direct;

  for (const cand of candidates) {
    const page = await CategoryPage.findOne({ categorySlug: cand })
      .select("categoryId")
      .lean();
    if (page?.categoryId) {
      const fromPage = await ecom_category_info.findById(page.categoryId).lean();
      if (fromPage) return fromPage;
    }
  }

  const parentKey = normalizeSlug(parentSlug);
  if (parentKey) {
    const parentCandidates = slugCandidates(parentKey);
    const parent = await findBySlugCandidates(parentCandidates);
    if (parent) {
      const children = await ecom_category_info
        .find({
          $or: [
            { parentid: parent._id },
            { parentid: parent._id.toString() },
          ],
        })
        .lean();
      const wanted = normalizeSlug(slug);
      const exactChild = children.find(
        (c) => normalizeSlug(c.category_slug) === wanted
      );
      if (exactChild) return exactChild;

      const nearChild = children.find((c) => isNearSlug(c.category_slug, slug));
      if (nearChild) return nearChild;
    }
  }

  return null;
}
