"use client";

import { useEffect, useRef, useState } from "react";
import { COMPONENT_TYPES } from "@/lib/categoryPageComponents/registry";
import CategoryTopBanner from "./categoryTopbanner";
import CategoryImageCarousel from "./categoryImageCarousel";
import CategoryProductCarousel from "./categoryProductCarousel";
import CategoryBannerSideProducts from "./categoryBannerSideProducts";
import CategoryBannerFourProducts from "./categoryBannerFourProducts";
import CategoryBannerGrid from "./categoryBannerGrid";
import CategorySingleBannerProducts from "./categorySingleBannerProducts";
import CategoryBrandCarousel from "./categoryBrandCarousel";
import CategoryImageHotspotBanner from "./categoryImageHotspotBanner";
import CategoryContentBlock from "./categoryContent";

/**
 * Renders category page builder components in saved admin order.
 * Calls onHasDesign(true|false) after load so parents can fall back
 * to the classic filters + products listing when there is no design.
 */
export default function CategoryPageRenderer({
  pageType,
  categoryId,
  slug,
  onHasDesign,
}) {
  const [components, setComponents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const onHasDesignRef = useRef(onHasDesign);
  onHasDesignRef.current = onHasDesign;

  useEffect(() => {
    if (!pageType || (!categoryId && !slug)) {
      setComponents([]);
      setLoaded(true);
      onHasDesignRef.current?.(false);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    const load = async () => {
      try {
        const params = new URLSearchParams({ pageType });
        if (slug) params.set("slug", String(slug));
        if (categoryId) params.set("categoryId", String(categoryId));

        const res = await fetch(`/api/category-pages/render?${params}`);
        const data = await res.json();
        if (cancelled) return;

        const list = data.success ? data.components || [] : [];
        setComponents(list);
        onHasDesignRef.current?.(list.length > 0);
      } catch (err) {
        console.error("CategoryPageRenderer:", err);
        if (!cancelled) {
          setComponents([]);
          onHasDesignRef.current?.(false);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [pageType, categoryId, slug]);

  if (!loaded || !components.length) return null;

  return (
    <div className="category-page-builder w-full bg-white">
      {components.map((item, idx) => {
        if (item.type === COMPONENT_TYPES.TOP_BANNER) {
          return (
            <div key={item.instanceId || idx} className="w-full bg-white">
              <CategoryTopBanner
                banners={item.config?.banners}
                categoryId={categoryId}
                slug={slug}
              />
            </div>
          );
        }
        if (item.type === COMPONENT_TYPES.IMAGE_CAROUSEL) {
          return (
            <CategoryImageCarousel
              key={item.instanceId || idx}
              config={item.config}
            />
          );
        }
        if (item.type === COMPONENT_TYPES.PRODUCT_CAROUSEL) {
          return (
            <CategoryProductCarousel
              key={item.instanceId || idx}
              config={item.config}
            />
          );
        }
        if (item.type === COMPONENT_TYPES.BANNER_SIDE_PRODUCTS) {
          return (
            <CategoryBannerSideProducts
              key={item.instanceId || idx}
              config={item.config}
            />
          );
        }
        if (item.type === COMPONENT_TYPES.BANNER_FOUR_PRODUCTS) {
          return (
            <CategoryBannerFourProducts
              key={item.instanceId || idx}
              config={item.config}
            />
          );
        }
        if (item.type === COMPONENT_TYPES.BANNER_GRID) {
          return (
            <CategoryBannerGrid
              key={item.instanceId || idx}
              config={item.config}
            />
          );
        }
        if (item.type === COMPONENT_TYPES.SINGLE_BANNER_PRODUCTS) {
          return (
            <CategorySingleBannerProducts
              key={item.instanceId || idx}
              config={item.config}
            />
          );
        }
        if (item.type === COMPONENT_TYPES.BRAND_CAROUSEL) {
          return (
            <CategoryBrandCarousel
              key={item.instanceId || idx}
              config={item.config}
            />
          );
        }
        if (item.type === COMPONENT_TYPES.IMAGE_HOTSPOT_BANNER) {
          return (
            <CategoryImageHotspotBanner
              key={item.instanceId || idx}
              config={item.config}
            />
          );
        }
        if (item.type === COMPONENT_TYPES.CATEGORY_CONTENT) {
          return (
            <CategoryContentBlock
              key={item.instanceId || idx}
              config={item.config}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
