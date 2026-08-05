"use client";

import { useEffect, useState } from "react";
import { COMPONENT_TYPES } from "@/lib/categoryPageComponents/registry";
import CategoryTopBanner from "./categoryTopbanner";
import CategoryImageCarousel from "./categoryImageCarousel";
import CategoryProductCarousel from "./categoryProductCarousel";
import CategoryBannerSideProducts from "./categoryBannerSideProducts";
import CategoryBannerFourProducts from "./categoryBannerFourProducts";

/**
 * Renders category page components in saved admin order.
 */
export default function CategoryPageRenderer({ pageType, categoryId, slug }) {
  const [components, setComponents] = useState([]);

  useEffect(() => {
    if (!pageType || (!categoryId && !slug)) {
      setComponents([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams({ pageType });
        if (categoryId) params.set("categoryId", String(categoryId));
        else params.set("slug", String(slug));

        const res = await fetch(`/api/category-pages/render?${params}`);
        const data = await res.json();
        if (!cancelled && data.success) {
          setComponents(data.components || []);
        }
      } catch (err) {
        console.error("CategoryPageRenderer:", err);
        if (!cancelled) setComponents([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [pageType, categoryId, slug]);

  if (!components.length) return null;

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
        return null;
      })}
    </div>
  );
}
