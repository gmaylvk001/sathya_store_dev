"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  buildFilterLookupMaps,
  selectedFiltersToQueryString,
  searchParamsToSelectedFilters,
  selectedFiltersEqual,
  hasActiveFilterParams,
} from "@/lib/filterUrl";

function selectionKey(filters, omitBrand = false) {
  if (!filters) return "";
  const sortJoin = (arr) => [...(arr || [])].map(String).sort().join(",");
  return [
    omitBrand ? "" : sortJoin(filters.brands),
    sortJoin(filters.filters),
    sortJoin(filters.categories),
    sortJoin(filters.subcategories),
    filters.price?.min,
    filters.price?.max,
  ].join("|");
}

function readSearchKey() {
  if (typeof window === "undefined") return "";
  return window.location.search.replace(/^\?/, "");
}

/**
 * Sync category listing selectedFilters ↔ SEO-friendly URL query params.
 * Uses window.location (not useSearchParams) to avoid Suspense hangs.
 * Uses a stable filterCatalog so facet refreshes cannot cause fetch loops.
 */
export function useCategoryFilterUrl({
  selectedFilters,
  setSelectedFilters,
  filterCatalog = null,
  brands = [],
  filterGroups = {},
  categoryTree = [],
  subcategoryTree = [],
  priceRange = [0, 100000],
  enabled = true,
  ready = false,
  omitUrlKeys = [],
}) {
  const router = useRouter();
  const pathname = usePathname();
  const skipWriteRef = useRef(false);
  const lastWrittenRef = useRef("");
  const lastSelectionKeyRef = useRef("");
  const hydratedRef = useRef(false);
  const selectedRef = useRef(selectedFilters);
  selectedRef.current = selectedFilters;

  const [searchKey, setSearchKey] = useState("");

  useEffect(() => {
    setSearchKey(readSearchKey());
    const onPopState = () => setSearchKey(readSearchKey());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const omitSet = useMemo(() => new Set(omitUrlKeys), [omitUrlKeys]);

  const catalogBrands = filterCatalog?.brands ?? brands;
  const catalogGroups = filterCatalog?.filterGroups ?? filterGroups;
  const catalogCategories = filterCatalog?.categoryTree ?? categoryTree;
  const catalogSubcategories =
    filterCatalog?.subcategoryTree ?? subcategoryTree;

  const maps = useMemo(
    () =>
      buildFilterLookupMaps({
        brands: catalogBrands,
        filterGroups: catalogGroups,
        categoryTree: catalogCategories,
        subcategoryTree: catalogSubcategories,
      }),
    [catalogBrands, catalogGroups, catalogCategories, catalogSubcategories]
  );

  const priceMin = priceRange?.[0] ?? 0;
  const priceMax = priceRange?.[1] ?? 100000;

  const applyParsed = useCallback(
    (parsed, useParsedPrice) => {
      const next = {
        ...selectedRef.current,
        ...(omitSet.has("brand") ? {} : { brands: parsed.brands }),
        filters: parsed.filters,
        ...(Object.prototype.hasOwnProperty.call(selectedRef.current, "categories")
          ? { categories: parsed.categories }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(
          selectedRef.current,
          "subcategories"
        )
          ? { subcategories: parsed.subcategories }
          : {}),
        price: useParsedPrice
          ? parsed.price
          : { min: priceMin, max: priceMax },
      };

      if (selectedFiltersEqual(next, selectedRef.current)) return false;

      skipWriteRef.current = true;
      setSelectedFilters(next);
      return true;
    },
    [setSelectedFilters, priceMin, priceMax, omitSet]
  );

  /** Apply URL → state (initial load + back/forward) */
  useEffect(() => {
    if (!enabled || !ready) return;

    const params = new URLSearchParams(searchKey);
    const parsed = searchParamsToSelectedFilters(params, maps, [
      priceMin,
      priceMax,
    ]);

    if (!hydratedRef.current) {
      hydratedRef.current = true;
      if (hasActiveFilterParams(params)) {
        applyParsed(parsed, true);
      }
      lastSelectionKeyRef.current = selectionKey(
        selectedRef.current,
        omitSet.has("brand")
      );
      return;
    }

    applyParsed(parsed, hasActiveFilterParams(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ready, searchKey, priceMin, priceMax]);

  /** Write state → URL */
  useEffect(() => {
    if (!enabled || !ready || !hydratedRef.current) return;

    if (skipWriteRef.current) {
      skipWriteRef.current = false;
      lastSelectionKeyRef.current = selectionKey(
        selectedFilters,
        omitSet.has("brand")
      );
      return;
    }

    const key = selectionKey(selectedFilters, omitSet.has("brand"));
    if (key === lastSelectionKeyRef.current) return;
    lastSelectionKeyRef.current = key;

    const filtersForUrl = omitSet.has("brand")
      ? { ...selectedFilters, brands: [] }
      : selectedFilters;

    const qs = selectedFiltersToQueryString(filtersForUrl, maps, [
      priceMin,
      priceMax,
    ]);
    const nextUrl = qs ? `${pathname}?${qs}` : pathname;
    const currentUrl = searchKey ? `${pathname}?${searchKey}` : pathname;

    if (nextUrl === currentUrl || nextUrl === lastWrittenRef.current) return;

    lastWrittenRef.current = nextUrl;
    setSearchKey(qs);
    router.replace(nextUrl, { scroll: false });
  }, [
    enabled,
    ready,
    selectedFilters,
    maps,
    priceMin,
    priceMax,
    pathname,
    router,
    searchKey,
    omitSet,
  ]);

  const parseCurrentUrl = useCallback(
    (overridePriceRange = [priceMin, priceMax]) => {
      return searchParamsToSelectedFilters(
        new URLSearchParams(readSearchKey()),
        maps,
        overridePriceRange
      );
    },
    [maps, priceMin, priceMax]
  );

  return {
    maps,
    parseCurrentUrl,
    searchKey,
  };
}
