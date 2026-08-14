import HomePage from "@/models/homePage";
import HomeTopBanner from "@/models/homeTopBanner";
import HomeImageCarousel from "@/models/homeImageCarousel";
import HomeProductCarousel from "@/models/homeProductCarousel";
import HomeBannerSideProducts from "@/models/homeBannerSideProducts";
import HomeBannerFourProducts from "@/models/homeBannerFourProducts";
import HomeBannerGrid from "@/models/homeBannerGrid";
import HomeImageColumns from "@/models/homeImageColumns";
import HomeSingleBannerProducts from "@/models/homeSingleBannerProducts";
import HomeBrandCarousel from "@/models/homeBrandCarousel";
import HomeImageHotspotBanner from "@/models/homeImageHotspotBanner";
import HomeContent from "@/models/homeContent";
import HomeSplitBanner from "@/models/homeSplitBanner";
import Product from "@/models/product";
import { COMPONENT_TYPES, PAGE_TYPES } from "@/lib/categoryPageComponents/registry";
import {
  buildBrandHref,
  hasOverviewAvailability,
} from "@/lib/categoryPageComponents/categoryHref";
import { getCategoryPagesAvailability } from "@/lib/categoryPageComponents/resolvePageComponents";
import {
  brandsToCarouselItems,
  resolveAllBrands,
} from "@/lib/categoryPageComponents/resolveCategoryBrands";

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
  return sorted.map((r) => byId[String(r.productId)]).filter(Boolean);
}

/**
 * Resolve storefront-ready components for the Home page builder.
 * Same component shape as category render so shared UI components work.
 */
export async function resolveHomePageComponents() {
  const page = await HomePage.findOne({ status: "active" }).lean();

  if (!page) {
    return { success: true, hasDesign: false, components: [], page: null };
  }

  const pageId = page._id;
  const sorted = [...(page.components || [])]
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Legacy fallback: top banner only, no layout rows yet
  if (!sorted.length) {
    const top = await HomeTopBanner.findOne({
      pageId,
      status: "active",
    }).lean();
    if (!top) {
      return { success: true, hasDesign: false, components: [], page };
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
      page,
    };
  }

  const components = [];

  for (const item of sorted) {
    if (item.type === COMPONENT_TYPES.TOP_BANNER) {
      const top = await HomeTopBanner.findOne({
        pageId,
        status: "active",
      }).lean();
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
        carousel = await HomeImageCarousel.findById(item.configId).lean();
      }
      if (!carousel) {
        carousel = await HomeImageCarousel.findOne({
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
        carousel = await HomeProductCarousel.findById(item.configId).lean();
      }
      if (!carousel) {
        carousel = await HomeProductCarousel.findOne({
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
        block = await HomeBannerSideProducts.findById(item.configId).lean();
      }
      if (!block) {
        block = await HomeBannerSideProducts.findOne({
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
        block = await HomeBannerFourProducts.findById(item.configId).lean();
      }
      if (!block) {
        block = await HomeBannerFourProducts.findOne({
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
        block = await HomeBannerGrid.findById(item.configId).lean();
      }
      if (!block) {
        block = await HomeBannerGrid.findOne({
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
        block = await HomeImageColumns.findById(item.configId).lean();
      }
      if (!block) {
        block = await HomeImageColumns.findOne({
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
        block = await HomeSingleBannerProducts.findById(item.configId).lean();
      }
      if (!block) {
        block = await HomeSingleBannerProducts.findOne({
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
        carousel = await HomeBrandCarousel.findById(item.configId).lean();
      }
      if (!carousel) {
        carousel = await HomeBrandCarousel.findOne({
          instanceId: item.instanceId,
        }).lean();
      }
      if (!carousel || carousel.status !== "active") continue;

      let items = [];
      if (carousel.autoBrandsFromCategory) {
        const brands = await resolveAllBrands();
        const availability = await getCategoryPagesAvailability(
          brands
            .filter((b) => b._id)
            .map((b) => ({
              categoryId: String(b._id),
              pageType: PAGE_TYPES.BRAND,
            }))
        );
        items = brandsToCarouselItems(
          brands.map((brand) => ({
            ...brand,
            url: buildBrandHref(
              brand.brand_slug,
              hasOverviewAvailability(
                availability,
                brand._id,
                PAGE_TYPES.BRAND
              )
            ),
          }))
        );
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
        block = await HomeImageHotspotBanner.findById(item.configId).lean();
      }
      if (!block) {
        block = await HomeImageHotspotBanner.findOne({
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
        block = await HomeContent.findById(item.configId).lean();
      }
      if (!block) {
        block = await HomeContent.findOne({
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
        block = await HomeSplitBanner.findById(item.configId).lean();
      }
      if (!block) {
        block = await HomeSplitBanner.findOne({
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
    page,
  };
}
