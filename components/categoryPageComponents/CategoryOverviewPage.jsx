"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryPageRenderer from "@/components/categoryPageComponents/CategoryPageRenderer";
import { buildCategoryBasePath } from "@/lib/categoryPageComponents/categoryHref";
import {
  CATEGORY_OVERVIEW_INNER_CLASS,
  CATEGORY_OVERVIEW_OUTER_CLASS,
} from "@/lib/categoryPageComponents/layout";

/**
 * Overview page wrapper: renders page-builder components for a category.
 * If no active design exists, redirects to the listing URL.
 */
export default function CategoryOverviewPage({
  pageType,
  slug,
  listingSlugs = [],
}) {
  const router = useRouter();
  const [hasDesign, setHasDesign] = useState(null);

  const listingPath = buildCategoryBasePath(
    listingSlugs.length ? listingSlugs : slug ? [slug] : []
  );

  useEffect(() => {
    if (hasDesign !== false) return;
    router.replace(listingPath);
  }, [hasDesign, listingPath, router]);

  return (
    <div className={CATEGORY_OVERVIEW_OUTER_CLASS} style={{ backgroundColor: "#EBEBEB" }}>
      <div className={CATEGORY_OVERVIEW_INNER_CLASS}>
        {hasDesign !== true && (
          <div className="py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
          </div>
        )}
        <CategoryPageRenderer
          pageType={pageType}
          slug={slug}
          onHasDesign={setHasDesign}
        />
      </div>
    </div>
  );
}
