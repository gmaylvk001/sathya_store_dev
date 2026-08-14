"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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

function mergeById(primary = [], secondary = []) {
  const map = new Map();
  for (const item of [...(primary || []), ...(secondary || [])]) {
    const id = item?._id?.toString?.() || item?._id;
    if (!id) continue;
    map.set(String(id), item);
  }
  return [...map.values()];
}

function mergeFilterGroups(primary = {}, secondary = {}) {
  const merged = { ...(primary || {}) };
  for (const [key, group] of Object.entries(secondary || {})) {
    if (!group) continue;
    if (!merged[key]) {
      merged[key] = group;
      continue;
    }
    const byId = new Map();
    for (const f of [
      ...(merged[key].filters || []),
      ...(group.filters || []),
    ]) {
      const id = f?._id?.toString?.() || f?._id;
      if (!id) continue;
      byId.set(String(id), f);
    }
    merged[key] = {
      ...merged[key],
      ...group,
      filters: [...byId.values()],
    };
  }
  return merged;
}

function replaceUrlQuietly(url) {
  if (typeof window === "undefined") return;
  window.history.replaceState(
    { ...(window.history.state || {}), as: url, url },
    "",
    url
  );
}

/**
 * Sync category listing selectedFilters ↔ SEO-friendly URL query params.
 * Uses window.history.replaceState (not router.replace) so filter changes
 * update the address bar without remounting the listing page.
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
  keepParams = [],
}) {
  const pathname = usePathname();
  const skipWriteRef = useRef(false);
  const writingRef = useRef(false);
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
  const keepSet = useMemo(() => new Set(keepParams), [keepParams]);

  const catalogBrands = filterCatalog?.brands ?? brands;
  const catalogGroups = filterCatalog?.filterGroups ?? filterGroups;
  const catalogCategories = filterCatalog?.categoryTree ?? categoryTree;
  const catalogSubcategories =
    filterCatalog?.subcategoryTree ?? subcategoryTree;

  const mergedBrands = useMemo(
    () => mergeById(catalogBrands, brands),
    [catalogBrands, brands]
  );
  const mergedGroups = useMemo(
    () => mergeFilterGroups(catalogGroups, filterGroups),
    [catalogGroups, filterGroups]
  );

  const maps = useMemo(
    () =>
      buildFilterLookupMaps({
        brands: mergedBrands,
        filterGroups: mergedGroups,
        categoryTree: catalogCategories,
        subcategoryTree: catalogSubcategories,
      }),
    [mergedBrands, mergedGroups, catalogCategories, catalogSubcategories]
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

    // Ignore the searchKey update that we ourselves just wrote.
    if (writingRef.current) {
      writingRef.current = false;
      return;
    }

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

    // After hydrate: only push URL → state when URL has filter params,
    // or when URL was cleared (so Clear All / back can reset).
    if (hasActiveFilterParams(params)) {
      applyParsed(parsed, true);
    } else {
      applyParsed(parsed, false);
    }
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

    const filtersForUrl = omitSet.has("brand")
      ? { ...selectedFilters, brands: [] }
      : selectedFilters;

    const key = selectionKey(selectedFilters, omitSet.has("brand"));
    const qs = selectedFiltersToQueryString(filtersForUrl, maps, [
      priceMin,
      priceMax,
    ]);
    const nextParams = new URLSearchParams(qs);
    const currentParams = new URLSearchParams(searchKey);
    for (const keepKey of keepSet) {
      const v = currentParams.get(keepKey);
      if (v != null && v !== "" && !nextParams.has(keepKey)) {
        nextParams.set(keepKey, v);
      }
    }
    const nextQs = nextParams.toString();
    const nextUrl = nextQs ? `${pathname}?${nextQs}` : pathname;
    const currentUrl = searchKey ? `${pathname}?${searchKey}` : pathname;

    // URL already matches desired state
    if (nextUrl === currentUrl) {
      lastSelectionKeyRef.current = key;
      return;
    }

    // Avoid duplicate writes for the same selection + URL
    if (
      key === lastSelectionKeyRef.current &&
      nextUrl === lastWrittenRef.current
    ) {
      return;
    }

    lastSelectionKeyRef.current = key;
    lastWrittenRef.current = nextUrl;
    writingRef.current = true;
    setSearchKey(nextQs);
    replaceUrlQuietly(nextUrl);
  }, [
    enabled,
    ready,
    selectedFilters,
    maps,
    priceMin,
    priceMax,
    pathname,
    searchKey,
    omitSet,
    keepSet,
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
