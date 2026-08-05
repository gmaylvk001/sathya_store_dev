import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CategoryPage from "@/models/categoryPage";
import CategoryTopBanner from "@/models/categoryTopbanner";
import CategoryImageCarousel from "@/models/categoryImageCarousel";
import CategoryProductCarousel from "@/models/categoryProductCarousel";
import CategoryBannerSideProducts from "@/models/categoryBannerSideProducts";
import CategoryBannerFourProducts from "@/models/categoryBannerFourProducts";
import ecom_category_info from "@/models/ecom_category_info";
import Product from "@/models/product";
import {
  COMPONENT_TYPES,
  PAGE_TYPES,
} from "@/lib/categoryPageComponents/registry";

function resolveHref(raw) {
  const link = String(raw || "").trim();
  if (!link) return "";
  if (/^https?:\/\//i.test(link) || link.startsWith("/")) return link;
  return `/category/${link.replace(/^\/+/, "")}`;
}

/**
 * GET /api/category-pages/render?categoryId=&pageType= OR ?slug=&pageType=
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    let categoryId = searchParams.get("categoryId");
    const slug = searchParams.get("slug");
    const pageType = searchParams.get("pageType");

    if (!pageType || !Object.values(PAGE_TYPES).includes(pageType)) {
      return NextResponse.json(
        { success: false, message: "Valid pageType required" },
        { status: 400 }
      );
    }

    if (!categoryId && slug) {
      const cat = await ecom_category_info
        .findOne({ category_slug: slug })
        .select("_id")
        .lean();
      if (!cat) {
        return NextResponse.json({ success: true, components: [] });
      }
      categoryId = cat._id;
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "categoryId or slug required" },
        { status: 400 }
      );
    }

    const page = await CategoryPage.findOne({
      pageType,
      categoryId,
      status: "active",
    }).lean();

    if (!page) {
      const top = await CategoryTopBanner.findOne({
        categoryId,
        status: "active",
      }).lean();
      if (!top) {
        return NextResponse.json({ success: true, components: [] });
      }
      const banners = (top.banners || [])
        .filter((b) => b.isActive !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return NextResponse.json({
        success: true,
        components: banners.length
          ? [
              {
                type: COMPONENT_TYPES.TOP_BANNER,
                order: 0,
                config: { banners },
              },
            ]
          : [],
      });
    }

    const sorted = [...(page.components || [])]
      .filter((c) => c.isActive !== false)
      .sort((a, b) => a.order - b.order);

    const components = [];
    for (const item of sorted) {
      if (item.type === COMPONENT_TYPES.TOP_BANNER) {
        const top = await CategoryTopBanner.findOne({
          categoryId: page.categoryId,
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
            items,
          },
        });
      } else if (item.type === COMPONENT_TYPES.PRODUCT_CAROUSEL) {
        let carousel = null;
        if (item.configId) {
          carousel = await CategoryProductCarousel.findById(
            item.configId
          ).lean();
        }
        if (!carousel) {
          carousel = await CategoryProductCarousel.findOne({
            instanceId: item.instanceId,
          }).lean();
        }
        if (!carousel || carousel.status !== "active") continue;
        const refs = [...(carousel.products || [])].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
        const ids = refs.map((r) => r.productId).filter(Boolean);
        if (!ids.length) continue;
        const found = await Product.find({
          _id: { $in: ids },
          status: "Active",
        })
          .select(
            "name slug images price special_price model_number item_code stock_status quantity brand"
          )
          .lean();
        const byId = Object.fromEntries(
          found.map((p) => [String(p._id), p])
        );
        const products = refs
          .map((r) => byId[String(r.productId)])
          .filter(Boolean);
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

        const refs = [...(block.products || [])].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
        const ids = refs.map((r) => r.productId).filter(Boolean);
        let products = [];
        if (ids.length) {
          const found = await Product.find({
            _id: { $in: ids },
            status: "Active",
          })
            .select(
              "name slug images price special_price model_number item_code stock_status quantity brand"
            )
            .lean();
          const byId = Object.fromEntries(
            found.map((p) => [String(p._id), p])
          );
          products = refs
            .map((r) => byId[String(r.productId)])
            .filter(Boolean);
        }

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
        if (tiles.length < 4) continue;

        const refs = [...(block.products || [])].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
        const ids = refs.map((r) => r.productId).filter(Boolean);
        let products = [];
        if (ids.length) {
          const found = await Product.find({
            _id: { $in: ids },
            status: "Active",
          })
            .select(
              "name slug images price special_price model_number item_code stock_status quantity brand"
            )
            .lean();
          const byId = Object.fromEntries(
            found.map((p) => [String(p._id), p])
          );
          products = refs
            .map((r) => byId[String(r.productId)])
            .filter(Boolean);
        }

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
      }
    }

    return NextResponse.json({ success: true, components });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
