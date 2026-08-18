import mongoose from "mongoose";
import CategoryPage from "@/models/categoryPage";
import CategoryTopBanner from "@/models/categoryTopbanner";
import CategoryImageCarousel from "@/models/categoryImageCarousel";
import CategoryProductCarousel from "@/models/categoryProductCarousel";
import CategoryBannerSideProducts from "@/models/categoryBannerSideProducts";
import CategoryBannerFourProducts from "@/models/categoryBannerFourProducts";
import CategoryBannerGrid from "@/models/categoryBannerGrid";
import CategoryImageColumns from "@/models/categoryImageColumns";
import CategorySingleBannerProducts from "@/models/categorySingleBannerProducts";
import CategoryBrandCarousel from "@/models/categoryBrandCarousel";
import CategoryImageHotspotBanner from "@/models/categoryImageHotspotBanner";
import CategoryContent from "@/models/categoryContent";
import CategorySplitBanner from "@/models/categorySplitBanner";
import ecom_category_info from "@/models/ecom_category_info";
import { resolveCategoryBySlug } from "@/lib/resolveCategorySlug";
import ecom_brand_info from "@/models/ecom_brand_info";
import Product from "@/models/product";
import {
  COMPONENT_TYPES,
  PAGE_TYPES,
} from "@/lib/categoryPageComponents/registry";
import {
  availabilityKey,
  buildCategoryBrandHref,
  hasOverviewAvailability,
} from "@/lib/categoryPageComponents/categoryHref";
import {
  brandsToCarouselItems,
  resolveBrandsForCategory,
} from "@/lib/categoryPageComponents/resolveCategoryBrands";

function toObjectIds(ids = []) {
  return [...new Set((ids || []).map((id) => String(id || "").trim()).filter(Boolean))]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

function resolveHref(raw) {
  const link = String(raw || "").trim();
  if (!link) return "";
  if (/^https?:\/\//i.test(link) || link.startsWith("/")) return link;
  return `/category/${link.replace(/^\/+/, "")}`;
}

const PRODUCT_SELECT =
  "name slug images price special_price model_number item_code stock_status quantity brand";

async function resolveActiveProducts(refs) {
  const sorted = [...(refs || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const ids = sorted.map((r) => r.productId).filter(Boolean);
  if (!ids.length) return [];

  const found = await Product.find({
    _id: { $in: ids },
    status: "Active",
  })
    .select(PRODUCT_SELECT)
    .lean();

  const byId = Object.fromEntries(found.map((p) => [String(p._id), p]));
  const seen = new Set();
  return sorted
    .map((r) => byId[String(r.productId)])
    .filter((p) => {
      if (!p?._id) return false;
      const id = String(p._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

/**
 * Resolve storefront-ready components for a category page.
 * Same semantics as GET /api/category-pages/render.
 */
export async function resolveCategoryPageComponents({
  categoryId: rawCategoryId,
  slug,
  parentSlug = null,
  brandSlug,
  brandId: rawBrandId,
  pageType,
} = {}) {
  if (!pageType || !Object.values(PAGE_TYPES).includes(pageType)) {
    throw new Error("Valid pageType required");
  }

  let categoryId = rawCategoryId;
  let brandId = rawBrandId;

  if (pageType === PAGE_TYPES.CATEGORY_BRAND) {
    if (!categoryId && slug) {
      const cat = await ecom_category_info
        .findOne({ category_slug: slug })
        .select("_id")
        .lean();
      if (!cat) {
        return { success: true, hasDesign: false, components: [] };
      }
      categoryId = cat._id;
    }
    if (!brandId && brandSlug) {
      const brand = await ecom_brand_info
        .findOne({ brand_slug: brandSlug })
        .select("_id")
        .lean();
      if (!brand) {
        return { success: true, hasDesign: false, components: [] };
      }
      brandId = brand._id;
    }
    if (slug) {
      const catBySlug = await ecom_category_info
        .findOne({ category_slug: slug })
        .select("_id")
        .lean();
      if (catBySlug) categoryId = catBySlug._id;
    }
    if (brandSlug) {
      const brandBySlug = await ecom_brand_info
        .findOne({ brand_slug: brandSlug })
        .select("_id")
        .lean();
      if (brandBySlug) brandId = brandBySlug._id;
    }
    if (!categoryId || !brandId) {
      throw new Error("categoryId/slug and brandId/brandSlug required");
    }
  } else {
    if (!categoryId && slug) {
      if (pageType === PAGE_TYPES.BRAND) {
        const brand = await ecom_brand_info
          .findOne({ brand_slug: slug })
          .select("_id")
          .lean();
        if (!brand) {
          return { success: true, hasDesign: false, components: [] };
        }
        categoryId = brand._id;
      } else {
        const cat = await resolveCategoryBySlug(slug, parentSlug);
        if (!cat) {
          return { success: true, hasDesign: false, components: [] };
        }
        categoryId = cat._id;
      }
    }

    if (slug) {
      if (pageType === PAGE_TYPES.BRAND) {
        const brandBySlug = await ecom_brand_info
          .findOne({ brand_slug: slug })
          .select("_id")
          .lean();
        if (brandBySlug) {
          categoryId = brandBySlug._id;
        }
      } else {
        const catBySlug = await resolveCategoryBySlug(slug, parentSlug);
        if (catBySlug) {
          categoryId = catBySlug._id;
        }
      }
    }

    if (!categoryId) {
      throw new Error("categoryId or slug required");
    }
  }

  const pageFilter = {
    pageType,
    categoryId,
    status: "active",
  };
  if (pageType === PAGE_TYPES.CATEGORY_BRAND) {
    pageFilter.brandId = brandId;
  }

  let page = await CategoryPage.findOne(pageFilter).lean();

  if (!page && slug) {
    const resolvedCat = categoryId
      ? await ecom_category_info.findById(categoryId).select("category_slug").lean()
      : null;
    const slugVariants = [
      ...new Set(
        [slug, resolvedCat?.category_slug]
          .map((s) => String(s || "").trim())
          .filter(Boolean)
      ),
    ];
    const slugFilter = {
      pageType,
      categorySlug: slugVariants.length > 1 ? { $in: slugVariants } : slugVariants[0] || slug,
      status: "active",
    };
    if (pageType === PAGE_TYPES.CATEGORY_BRAND && brandSlug) {
      slugFilter.brandSlug = brandSlug;
    }
    page = await CategoryPage.findOne(slugFilter).lean();
  }

  if (!page) {
    if (pageType === PAGE_TYPES.CATEGORY_BRAND) {
      return { success: true, hasDesign: false, components: [] };
    }
    const top = await CategoryTopBanner.findOne({
      categoryId,
      status: "active",
      pageId: { $exists: false },
    }).lean();
    if (!top) {
      return { success: true, hasDesign: false, components: [] };
    }
    const banners = (top.banners || [])
      .filter((b) => b.isActive !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const components = banners.length
      ? [
          {
            type: COMPONENT_TYPES.TOP_BANNER,
            order: 0,
            config: { banners },
          },
        ]
      : [];
    return {
      success: true,
      hasDesign: components.length > 0,
      components,
    };
  }

  const sorted = [...(page.components || [])]
    .filter((c) => c.isActive !== false)
    .sort((a, b) => a.order - b.order);

  const components = [];
  for (const item of sorted) {
    if (item.type === COMPONENT_TYPES.TOP_BANNER) {
      const topFilter =
        page.pageType === PAGE_TYPES.CATEGORY_BRAND
          ? { pageId: page._id, status: "active" }
          : {
              categoryId: page.categoryId,
              status: "active",
              pageId: { $exists: false },
            };
      const top = await CategoryTopBanner.findOne(topFilter).lean();
      if (!top) continue;
      const banners = (top.banners || [])
        .filter((b) => b.isActive !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (!banners.length) continue;
      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: { banners },
      });
    } else if (item.type === COMPONENT_TYPES.IMAGE_CAROUSEL) {
      let carousel = null;
      if (item.configId) {
        carousel = await CategoryImageCarousel.findById(item.configId).lean();
      }
      if (!carousel) {
        carousel = await CategoryImageCarousel.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!carousel || carousel.status !== "active") continue;
      const items = (carousel.items || [])
        .filter((i) => i.isActive !== false && i.image)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (!items.length) continue;
      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          name: carousel.name,
          showGap: Boolean(carousel.showGap),
          items,
        },
      });
    } else if (item.type === COMPONENT_TYPES.PRODUCT_CAROUSEL) {
      let carousel = null;
      if (item.configId) {
        carousel = await CategoryProductCarousel.findById(item.configId).lean();
      }
      if (!carousel) {
        carousel = await CategoryProductCarousel.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!carousel || carousel.status !== "active") continue;
      const products = await resolveActiveProducts(carousel.products);
      if (!products.length) continue;

      const rawLink = String(carousel.seeAllLink || "").trim();
      let seeAllHref = "";
      if (rawLink) {
        if (/^https?:\/\//i.test(rawLink) || rawLink.startsWith("/")) {
          seeAllHref = rawLink;
        } else {
          seeAllHref = `/category/${rawLink.replace(/^\/+/, "")}`;
        }
      }

      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          name: carousel.name,
          products,
          seeAllHref,
        },
      });
    } else if (item.type === COMPONENT_TYPES.BANNER_SIDE_PRODUCTS) {
      let block = null;
      if (item.configId) {
        block = await CategoryBannerSideProducts.findById(item.configId).lean();
      }
      if (!block) {
        block = await CategoryBannerSideProducts.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!block || block.status !== "active") continue;
      if (!block.mainBannerDesktop || !block.sideBannerImage) continue;

      const products = await resolveActiveProducts(block.products);

      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          name: block.name,
          mainBannerDesktop: block.mainBannerDesktop,
          mainBannerMobile: block.mainBannerMobile || block.mainBannerDesktop,
          mainBannerHref: resolveHref(block.mainBannerUrl),
          sideBannerImage: block.sideBannerImage,
          sideBannerHref: resolveHref(block.sideBannerUrl),
          sideBannerPosition:
            block.sideBannerPosition === "right" ? "right" : "left",
          products,
        },
      });
    } else if (item.type === COMPONENT_TYPES.BANNER_FOUR_PRODUCTS) {
      let block = null;
      if (item.configId) {
        block = await CategoryBannerFourProducts.findById(item.configId).lean();
      }
      if (!block) {
        block = await CategoryBannerFourProducts.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!block || block.status !== "active") continue;
      if (!block.bannerDesktop) continue;

      const tiles = [...(block.tiles || [])]
        .filter((t) => t.image)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .slice(0, 4);
      if (tiles.length < 3) continue;

      const products = await resolveActiveProducts(block.products);

      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          name: block.name,
          bannerDesktop: block.bannerDesktop,
          bannerMobile: block.bannerMobile || block.bannerDesktop,
          bannerHref: resolveHref(block.bannerUrl),
          tilesBgColor: block.tilesBgColor || "#0d9488",
          tiles: tiles.map((t) => ({
            image: t.image,
            url: t.url || "",
          })),
          products,
        },
      });
    } else if (item.type === COMPONENT_TYPES.BANNER_GRID) {
      let block = null;
      if (item.configId) {
        block = await CategoryBannerGrid.findById(item.configId).lean();
      }
      if (!block) {
        block = await CategoryBannerGrid.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!block || block.status !== "active") continue;

      const count = [2, 3, 4].includes(block.imageCount)
        ? block.imageCount
        : 4;
      const banners = [...(block.banners || [])]
        .filter((b) => b.image)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .slice(0, count);
      if (banners.length < 2) continue;

      const refs = [...(block.products || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      let products = [];
      if (refs.length >= 6 && block.productName) {
        products = await resolveActiveProducts(refs);
        if (products.length < 6) products = [];
      }

      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          name: block.name,
          productName: block.productName,
          products,
          showGap: Boolean(block.showGap),
          banners: banners.map((b) => ({
            image: b.image,
            url: b.url || "",
          })),
        },
      });
    } else if (item.type === COMPONENT_TYPES.IMAGE_COLUMNS) {
      let block = null;
      if (item.configId) {
        block = await CategoryImageColumns.findById(item.configId).lean();
      }
      if (!block) {
        block = await CategoryImageColumns.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!block || block.status !== "active") continue;

      const layout = ["center_big", "left_big", "right_big"].includes(
        block.layout
      )
        ? block.layout
        : "center_big";
      const images = [...(block.images || [])]
        .filter((img) => img?.image && img?.slot)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (images.length < 5) continue;

      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          name: block.name,
          layout,
          showGap: Boolean(block.showGap),
          images: images.map((img) => ({
            image: img.image,
            url: img.url || "",
            slot: img.slot,
          })),
        },
      });
    } else if (item.type === COMPONENT_TYPES.SINGLE_BANNER_PRODUCTS) {
      let block = null;
      if (item.configId) {
        block = await CategorySingleBannerProducts.findById(
          item.configId
        ).lean();
      }
      if (!block) {
        block = await CategorySingleBannerProducts.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!block || block.status !== "active") continue;
      if (!block.bannerDesktop) continue;

      const refs = [...(block.products || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      if (refs.length < 6) continue;

      const products = await resolveActiveProducts(refs);
      if (products.length < 6) continue;

      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          name: block.name,
          bannerDesktop: block.bannerDesktop,
          bannerMobile: block.bannerMobile || block.bannerDesktop,
          bannerHref: resolveHref(block.bannerUrl),
          products,
        },
      });
    } else if (item.type === COMPONENT_TYPES.BRAND_CAROUSEL) {
      let carousel = null;
      if (item.configId) {
        carousel = await CategoryBrandCarousel.findById(item.configId).lean();
      }
      if (!carousel) {
        carousel = await CategoryBrandCarousel.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!carousel || carousel.status !== "active") continue;

      let items = [];
      if (carousel.autoBrandsFromCategory) {
        const categoryIdForBrands = carousel.categoryId || categoryId;
        const brands = await resolveBrandsForCategory(categoryIdForBrands);
        const availability = await getCategoryPagesAvailability(
          brands
            .filter((b) => b._id)
            .map((b) => ({
              categoryId: String(categoryIdForBrands),
              pageType: PAGE_TYPES.CATEGORY_BRAND,
              brandId: String(b._id),
            }))
        );
        const withUrls = brands.map((brand) => ({
          ...brand,
          url: buildCategoryBrandHref(
            page.categorySlug,
            brand.brand_slug,
            hasOverviewAvailability(
              availability,
              categoryIdForBrands,
              PAGE_TYPES.CATEGORY_BRAND,
              brand._id
            )
          ),
        }));
        items = brandsToCarouselItems(withUrls);
      } else {
        items = (carousel.items || [])
          .filter((i) => i.isActive !== false && i.image)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
      if (!items.length) continue;
      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          name: carousel.name,
          showGap: Boolean(carousel.showGap),
          autoBrandsFromCategory: Boolean(carousel.autoBrandsFromCategory),
          items,
        },
      });
    } else if (item.type === COMPONENT_TYPES.IMAGE_HOTSPOT_BANNER) {
      let block = null;
      if (item.configId) {
        block = await CategoryImageHotspotBanner.findById(
          item.configId
        ).lean();
      }
      if (!block) {
        block = await CategoryImageHotspotBanner.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!block || block.status !== "active") continue;
      if (!block.bannerImage) continue;

      const hotspots = [...(block.hotspots || [])]
        .filter((h) => h && h.isActive !== false && h.link)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          name: block.name,
          bannerImage: block.bannerImage,
          hotspots,
        },
      });
    } else if (item.type === COMPONENT_TYPES.CATEGORY_CONTENT) {
      let block = null;
      if (item.configId) {
        block = await CategoryContent.findById(item.configId).lean();
      }
      if (!block) {
        block = await CategoryContent.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!block || block.status !== "active") continue;
      const text = String(block.content || "").trim();
      if (!text) continue;

      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          name: block.name || "",
          content: text,
        },
      });
    } else if (item.type === COMPONENT_TYPES.SPLIT_BANNER) {
      let block = null;
      if (item.configId) {
        block = await CategorySplitBanner.findById(item.configId).lean();
      }
      if (!block) {
        block = await CategorySplitBanner.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!block || block.status !== "active") continue;

      const bannerCount = Number(block.bannerCount) === 2 ? 2 : 1;
      const banners = [...(block.banners || [])]
        .filter((b) => b?.image)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .slice(0, bannerCount);
      if (banners.length < bannerCount) continue;

      components.push({
        instanceId: item.instanceId,
        type: item.type,
        order: item.order,
        config: {
          bannerCount,
          banners: banners.map((b) => ({
            image: b.image,
            url: b.url || "",
            order: b.order ?? 0,
          })),
        },
      });
    }
  }

  return {
    success: true,
    hasDesign: components.length > 0,
    components,
  };
}

/**
 * Fast batched availability check used by header navigation.
 * Matches render semantics for "active page with at least one active layout
 * component", plus legacy Top Banner fallback when no CategoryPage exists.
 */
export async function getCategoryPagesAvailability(pages = []) {
  const availability = {};
  const normalized = [];

  for (const entry of pages) {
    const pageType = entry?.pageType;
    if (!pageType || !Object.values(PAGE_TYPES).includes(pageType)) continue;

    let categoryId = entry?.categoryId ? String(entry.categoryId) : "";
    let brandId = entry?.brandId ? String(entry.brandId) : "";

    if (!categoryId && entry?.slug) {
      if (pageType === PAGE_TYPES.BRAND) {
        const brand = await ecom_brand_info
          .findOne({ brand_slug: entry.slug })
          .select("_id")
          .lean();
        if (brand) categoryId = String(brand._id);
      } else {
        const cat = await resolveCategoryBySlug(entry.slug, entry.parentSlug);
        if (cat) categoryId = String(cat._id);
      }
    }

    if (pageType === PAGE_TYPES.CATEGORY_BRAND && !brandId && entry?.brandSlug) {
      const brand = await ecom_brand_info
        .findOne({ brand_slug: entry.brandSlug })
        .select("_id")
        .lean();
      if (brand) brandId = String(brand._id);
    }

    if (!categoryId) continue;
    if (pageType === PAGE_TYPES.CATEGORY_BRAND && !brandId) continue;

    const key = availabilityKey(categoryId, pageType, brandId);
    availability[key] = false;
    normalized.push({ categoryId, pageType, brandId, key });
  }

  if (!normalized.length) return availability;

  const uniqueIds = [...new Set(normalized.map((n) => n.categoryId))];
  const objectIds = toObjectIds(uniqueIds);
  const pageTypes = [...new Set(normalized.map((n) => n.pageType))];

  if (!objectIds.length) return availability;

  const foundPages = await CategoryPage.find({
    status: "active",
    pageType: { $in: pageTypes },
    categoryId: { $in: objectIds },
  })
    .select("_id categoryId pageType brandId components")
    .lean();

  const pageMap = new Map(
    foundPages.map((p) => [
      availabilityKey(
        String(p.categoryId),
        p.pageType,
        p.brandId ? String(p.brandId) : ""
      ),
      p,
    ])
  );

  const missingCategoryIds = new Set();
  const missingPageIds = [];

  for (const item of normalized) {
    const page = pageMap.get(item.key);
    if (page) {
      const activeComponents = (page.components || []).filter(
        (c) => c.isActive !== false
      );
      availability[item.key] = activeComponents.length > 0;
      if (!availability[item.key] && item.pageType === PAGE_TYPES.CATEGORY_BRAND) {
        missingPageIds.push(page._id);
      }
    } else if (item.pageType !== PAGE_TYPES.CATEGORY_BRAND) {
      missingCategoryIds.add(item.categoryId);
    }
  }

  for (const item of normalized) {
    if (availability[item.key]) continue;
    if (item.pageType === PAGE_TYPES.CATEGORY_BRAND) continue;
    missingCategoryIds.add(item.categoryId);
  }

  if (missingPageIds.length > 0) {
    const topsByPage = await CategoryTopBanner.find({
      pageId: { $in: missingPageIds },
      status: "active",
    })
      .select("pageId banners")
      .lean();
    const topByPageId = new Map(
      topsByPage.map((t) => [String(t.pageId), t])
    );
    for (const item of normalized) {
      if (availability[item.key] || item.pageType !== PAGE_TYPES.CATEGORY_BRAND) {
        continue;
      }
      const page = pageMap.get(item.key);
      if (!page) continue;
      const top = topByPageId.get(String(page._id));
      if (!top) continue;
      const banners = (top.banners || []).filter((b) => b.isActive !== false);
      if (banners.length > 0) availability[item.key] = true;
    }
  }

  if (missingCategoryIds.size > 0) {
    const missingObjectIds = toObjectIds([...missingCategoryIds]);
    const tops = missingObjectIds.length
      ? await CategoryTopBanner.find({
          categoryId: { $in: missingObjectIds },
          status: "active",
          pageId: { $exists: false },
        })
          .select("categoryId banners")
          .lean()
      : [];

    const topByCategory = new Map(
      tops.map((t) => [String(t.categoryId), t])
    );

    for (const item of normalized) {
      if (availability[item.key]) continue;
      if (item.pageType === PAGE_TYPES.CATEGORY_BRAND) continue;
      if (!missingCategoryIds.has(item.categoryId)) continue;
      const top = topByCategory.get(item.categoryId);
      if (!top) continue;
      const banners = (top.banners || []).filter((b) => b.isActive !== false);
      if (banners.length > 0) {
        availability[item.key] = true;
      }
    }
  }

  return availability;
}

