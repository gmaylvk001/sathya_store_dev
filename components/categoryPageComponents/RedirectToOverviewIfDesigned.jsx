"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildCategoryBasePath } from "@/lib/categoryPageComponents/categoryHref";
import { hasActiveFilterParams } from "@/lib/filterUrl";

/**
 * If this category has a designed overview page, send listing traffic
 * to /overview so header clicks open the builder page.
 */
export default function RedirectToOverviewIfDesigned({ pageType }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pageType || !pathname || pathname.endsWith("/overview")) return;
    if (hasActiveFilterParams(searchParams)) return;

    const slug = params.sub_slug_one || params.sub_slug || params.slug;
    if (!slug || slug === "overview") return;

    const parentSlug = params.sub_slug_one
      ? params.sub_slug
      : params.sub_slug
        ? params.slug
        : "";
    const listingSlugs = [params.slug, params.sub_slug, params.sub_slug_one].filter(
      Boolean
    );

    let cancelled = false;
    const run = async () => {
      try {
        const query = new URLSearchParams({
          pageType,
          slug: String(slug),
        });
        if (parentSlug) query.set("parent", String(parentSlug));
        const res = await fetch(`/api/category-pages/render?${query}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled || !data?.success) return;
        if (data.hasPage || (Array.isArray(data.components) && data.components.length > 0)) {
          router.replace(`${buildCategoryBasePath(listingSlugs)}/overview`);
        }
      } catch (err) {
        console.error("Overview redirect check failed:", err);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [pageType, params, pathname, router, searchParams]);

  return null;
}
