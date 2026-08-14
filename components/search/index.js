"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { FaSpinner, FaSlidersH } from "react-icons/fa";
import Addtocart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/filters/ProductFilters";
import { useCategoryFilterUrl } from "@/hooks/useCategoryFilterUrl";
import {
  buildFilterLookupMaps,
  searchParamsToSelectedFilters,
  hasActiveFilterParams,
  buildFilterGroupsFromList,
} from "@/lib/filterUrl";
import { CATEGORY_PAGE_SHELL_CLASS } from "@/lib/categoryPageComponents/layout";

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const searchQuery = params.get("query") || "";

  useEffect(() => {
    if (!searchQuery) router.push("/");
  }, [searchQuery, router]);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [brandMap, setBrandMap] = useState({});
  const [brands, setBrands] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [filterGroups, setFilterGroups] = useState({});
  const [filterCatalog, setFilterCatalog] = useState(null);
  const [filterUrlReady, setFilterUrlReady] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [page, setPage] = useState(1);
  const skipNextFilterFetch = useRef(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    subcategories: [],
    brands: [],
    price: { min: 0, max: 500000 },
    filters: [],
  });
  const [values, setValues] = useState([0, 500000]);

  useCategoryFilterUrl({
    selectedFilters,
    setSelectedFilters,
    filterCatalog,
    brands: filterCatalog?.brands || brands,
    filterGroups: filterCatalog?.filterGroups || filterGroups,
    categoryTree: filterCatalog?.categoryTree || categoryTree,
    subcategoryTree: filterCatalog?.subcategoryTree || categoryTree,
    priceRange,
    enabled: true,
    ready: filterUrlReady && !!filterCatalog,
    keepParams: ["query"],
  });

  useEffect(() => {
    setValues([selectedFilters.price.min, selectedFilters.price.max]);
  }, [selectedFilters.price.min, selectedFilters.price.max]);

  const findCategoryNode = (nodes, predicate) => {
    for (const node of nodes || []) {
      if (predicate(node)) return node;
      const nested = findCategoryNode(
        node.subCategories || node.subcategories,
        predicate
      );
      if (nested) return nested;
    }
    return null;
  };

  useEffect(() => {
    const catId = selectedFilters.categories?.[0];
    const subId = selectedFilters.subcategories?.[0];
    const catNode = catId
      ? findCategoryNode(categoryTree, (n) => String(n._id) === String(catId))
      : null;
    const subNode = subId
      ? findCategoryNode(categoryTree, (n) => String(n._id) === String(subId))
      : null;
    setSelectedCategory(catNode?.category_name || "");
    setSelectedSubCategory(subNode?.category_name || "");
  }, [selectedFilters.categories, selectedFilters.subcategories, categoryTree]);

  const handleSelectCategory = (name) => {
    setSelectedCategory(name || "");
    setSelectedSubCategory("");
    if (!name) {
      setSelectedFilters((prev) => ({
        ...prev,
        categories: [],
        subcategories: [],
      }));
      return;
    }
    const node = findCategoryNode(
      categoryTree,
      (n) => n.category_name === name
    );
    setSelectedFilters((prev) => ({
      ...prev,
      categories: node?._id ? [String(node._id)] : [],
      subcategories: [],
    }));
  };

  const handleSelectSubCategory = (name) => {
    setSelectedSubCategory(name || "");
    if (!name) {
      setSelectedFilters((prev) => ({ ...prev, subcategories: [] }));
      return;
    }
    const node = findCategoryNode(
      categoryTree,
      (n) => n.category_name === name
    );
    setSelectedFilters((prev) => ({
      ...prev,
      subcategories: node?._id ? [String(node._id)] : [],
    }));
  };

  const handleFilterChange = (type, value) => {
    setSelectedFilters((prev) => {
      const id = value != null ? String(value) : value;
      const hasId = (list, item) =>
        (list || []).some((x) => String(x) === String(item));
      const next = { ...prev };
      if (type === "brands") {
        next.brands = hasId(prev.brands, id)
          ? prev.brands.filter((item) => String(item) !== id)
          : [...prev.brands, id];
      } else if (type === "filters") {
        next.filters = hasId(prev.filters, id)
          ? prev.filters.filter((item) => String(item) !== id)
          : [...prev.filters, id];
      } else if (type === "categories") {
        next.categories = hasId(prev.categories, id)
          ? prev.categories.filter((item) => String(item) !== id)
          : [...prev.categories, id];
      } else if (type === "subcategories") {
        next.subcategories = hasId(prev.subcategories, id)
          ? prev.subcategories.filter((item) => String(item) !== id)
          : [...prev.subcategories, id];
      } else if (type === "price") {
        next.price = value;
      }
      return next;
    });
    setPage(1);
  };

  const handlePriceChange = (nextValues) => {
    const lo = priceRange[0] ?? 0;
    const hi = priceRange[1] ?? 500000;
    let min = Math.min(hi, Math.max(lo, nextValues[0]));
    let max = Math.min(hi, Math.max(lo, nextValues[1]));
    if (min > max) min = max;
    setSelectedFilters((prev) => ({ ...prev, price: { min, max } }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      categories: [],
      subcategories: [],
      brands: [],
      price: { min: priceRange[0], max: priceRange[1] },
      filters: [],
    });
    setSelectedCategory("");
    setSelectedSubCategory("");
    setPage(1);
  };

  const fetchResults = useCallback(
    async (pageNum = 1, bootstrap = false) => {
      if (!searchQuery) return;
      try {
        if (bootstrap) setLoading(true);
        else setIsFiltering(true);
        const qs = new URLSearchParams();
        qs.set("query", searchQuery);
        qs.set("page", String(pageNum));
        qs.set("limit", "12");
        if (!bootstrap) {
          if (selectedFilters.brands.length) {
            qs.set("brands", selectedFilters.brands.join(","));
          }
          if (selectedFilters.filters.length) {
            qs.set("filters", selectedFilters.filters.join(","));
          }
          if (selectedFilters.categories.length) {
            qs.set("categoryIds", selectedFilters.categories.join(","));
          }
          if (selectedFilters.subcategories.length) {
            qs.set("subcategoryIds", selectedFilters.subcategories.join(","));
          }
          qs.set("minPrice", String(selectedFilters.price.min));
          qs.set("maxPrice", String(selectedFilters.price.max));
        }

        const { data } = await axios.get(`/api/search?${qs}`);
        setProducts(Array.isArray(data.products) ? data.products : []);
        setPagination(data.pagination || null);

        const nextBrands = (data.brandSummary || [])
          .map((b) => {
            const id = String(b.brandId ?? b._id ?? "");
            return id
              ? { _id: id, brand_name: brandMap[id] || id }
              : null;
          })
          .filter(Boolean);
        setBrands(nextBrands);

        const groups = buildFilterGroupsFromList(data.filterDefs || []);
        setFilterGroups(groups);
        setCategoryTree(Array.isArray(data.categories) ? data.categories : []);

        setFilterCatalog((prev) => ({
          brands: (() => {
            const byId = new Map();
            for (const b of [...(prev?.brands || []), ...nextBrands]) {
              const id = b?._id?.toString?.() || b?._id;
              if (id) byId.set(String(id), b);
            }
            return [...byId.values()];
          })(),
          filterGroups: { ...(prev?.filterGroups || {}), ...groups },
          categoryTree: Array.isArray(data.categories)
            ? data.categories
            : prev?.categoryTree || [],
          subcategoryTree: Array.isArray(data.categories)
            ? data.categories
            : prev?.subcategoryTree || [],
        }));

        if (bootstrap) {
          const lookupMaps = buildFilterLookupMaps({
            brands: nextBrands,
            filterGroups: groups,
            categoryTree: data.categories || [],
            subcategoryTree: data.categories || [],
          });
          const urlSearch = new URLSearchParams(window.location.search);
          const urlFilters = searchParamsToSelectedFilters(
            urlSearch,
            lookupMaps,
            [priceRange[0], priceRange[1]]
          );
          setSelectedFilters({
            categories: urlFilters.categories,
            subcategories: urlFilters.subcategories,
            brands: urlFilters.brands,
            filters: urlFilters.filters,
            price: hasActiveFilterParams(urlSearch)
              ? urlFilters.price
              : { min: priceRange[0], max: priceRange[1] },
          });
          skipNextFilterFetch.current = !hasActiveFilterParams(urlSearch);
          setFilterUrlReady(true);
        }
      } catch (err) {
        console.error("Search API error", err);
        setProducts([]);
        setPagination(null);
      } finally {
        setLoading(false);
        setIsFiltering(false);
      }
    },
    [searchQuery, selectedFilters, brandMap, priceRange]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/brand");
        const json = await res.json();
        const arr = json?.data || [];
        const map = {};
        arr.forEach((b) => {
          if (b?._id) map[b._id] = b.brand_name;
        });
        if (mounted) setBrandMap(map);
      } catch (err) {
        console.error("Failed to load brand master", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    skipNextFilterFetch.current = true;
    setFilterUrlReady(false);
    fetchResults(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    if (!filterUrlReady) return;
    if (skipNextFilterFetch.current) {
      skipNextFilterFetch.current = false;
      return;
    }
    fetchResults(page, false);
  }, [selectedFilters, page, filterUrlReady, fetchResults]);

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    const { currentPage, totalPages, hasNext, hasPrev } = pagination;
    const pages = [];
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) pages.push("...");
    }
    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(totalPages, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="flex justify-center items-center gap-2 my-6">
        <button
          disabled={!hasPrev}
          onClick={() => handlePageChange(currentPage - 1)}
          className={`px-3 py-2 rounded ${
            hasPrev
              ? "bg-gray-100 hover:bg-gray-200"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Prev
        </button>
        {pages.map((num, idx) =>
          num === "..." ? (
            <span key={`dots-${idx}`} className="px-3 py-2">
              …
            </span>
          ) : (
            <button
              key={num}
              onClick={() => handlePageChange(num)}
              className={`px-3 py-2 rounded ${
                num === currentPage
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {num}
            </button>
          )
        )}
        <button
          disabled={!hasNext}
          onClick={() => handlePageChange(currentPage + 1)}
          className={`px-3 py-2 rounded ${
            hasNext
              ? "bg-gray-100 hover:bg-gray-200"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className={`${CATEGORY_PAGE_SHELL_CLASS} py-4`}>
      <h1 className="text-3xl font-bold mb-3 text-gray-600">
        Search Results {searchQuery && `for '${searchQuery}'`}
      </h1>

      <div className="flex border-b border-gray-300 bg-gray-100 sticky top-0 z-30 lg:hidden mb-3">
        <button
          className="flex items-center justify-center gap-2 py-4 flex-1 text-sm font-medium text-gray-800"
          onClick={() => setIsFilterPanelOpen(true)}
        >
          <FaSlidersH className="text-gray-500 text-xs" />
          FILTER
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <ProductFilters
          variant="both"
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onClearAll={clearAllFilters}
          onPriceChange={handlePriceChange}
          brands={brands}
          filterGroups={filterGroups}
          priceRange={priceRange}
          values={values}
          setValues={setValues}
          categoryTree={categoryTree}
          showCategories={categoryTree.length > 0}
          showBrands={brands.length > 0}
          selectedCategory={selectedCategory}
          setSelectedCategory={handleSelectCategory}
          selectedSubCategory={selectedSubCategory}
          setSelectedSubCategory={handleSelectSubCategory}
          isFilterPanelOpen={isFilterPanelOpen}
          setIsFilterPanelOpen={setIsFilterPanelOpen}
        />
        {isFiltering && (
          <div className="fixed top-20 right-4 z-40 bg-white shadow px-3 py-2 rounded text-sm text-gray-600 border">
            Updating results...
          </div>
        )}

        <div className="flex-1">
          <div className="flex justify-between items-center mb-3">
            <div className="text-gray-600">
              {pagination?.total ?? products.length} result
              {(pagination?.total ?? products.length) !== 1 ? "s" : ""} found
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="animate-spin text-4xl text-blue-500" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="group relative bg-white rounded-lg border hover:border-blue-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full"
                >
                  <div className="relative aspect-square bg-white">
                    <Link href={`/product/${p.slug}`} className="block mb-2">
                      {p.images?.[0] && (
                        <Image
                          src={
                            p.images[0].startsWith("http")
                              ? p.images[0]
                              : `/uploads/products/${p.images[0]}`
                          }
                          alt={p.name}
                          fill
                          className="object-contain p-2 md:p-4 transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 33vw, 25vw"
                          unoptimized
                        />
                      )}
                    </Link>
                    {Number(p.special_price) > 0 &&
                      Number(p.special_price) < Number(p.price) && (
                        <span className="absolute top-3 left-2 bg-red-500 text-white text-xs font-bold px-3 py-0.5 rounded z-10">
                          {Math.round(
                            100 -
                              (Number(p.special_price) / Number(p.price)) * 100
                          )}
                          % OFF
                        </span>
                      )}
                    {(p.movement === "EOL" || p.movement === "FOCUS") && (
                      <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-pulse tracking-wide uppercase">
                        Clearance Sale
                      </span>
                    )}
                    <div className="absolute top-2 right-2">
                      <ProductCard productId={p._id} />
                    </div>
                  </div>
                  <div className="p-3 flex flex-col h-full">
                    <h4 className="text-xs text-gray-500 mb-2 uppercase">
                      <Link
                        href={`/brand/${(brandMap[p.brand] || "")
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="hover:text-blue-600"
                      >
                        {brandMap[p.brand] || ""}
                      </Link>
                    </h4>
                    <Link href={`/product/${p.slug}`} className="block mb-1">
                      <h3 className="text-xs sm:text-sm font-medium text-[#0069c6] hover:text-[#00badb] min-h-[32px] sm:min-h-[40px]">
                        {(p.name || "").length > 60
                          ? (p.name || "").slice(0, 57) + "..."
                          : p.name}
                      </h3>
                    </Link>
                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-red-600">
                          ₹
                          {Number(p.special_price) > 0 &&
                          Number(p.special_price) < Number(p.price)
                            ? Math.round(p.special_price)
                            : Math.round(p.price)}
                        </span>
                        {Number(p.special_price) > 0 &&
                          Number(p.special_price) < Number(p.price) && (
                            <span className="text-xs text-gray-500 line-through">
                              ₹{Math.round(p.price)}
                            </span>
                          )}
                      </div>
                    </div>
                    <h4
                      className={`text-xs mb-3 ${
                        p.stock_status === "In Stock"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {p.stock_status}
                      {p.stock_status === "In Stock" && p.quantity
                        ? `, ${p.quantity} units`
                        : ""}
                    </h4>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <Addtocart
                        productId={p._id}
                        stockQuantity={p.quantity}
                        special_price={p.special_price}
                        className="w-full text-xs sm:text-sm py-1.5"
                        movement={p.movement}
                        productName={p.name}
                        productSlug={p.slug}
                      />
                      <a
                        href={`https://wa.me/919842344323?text=${encodeURIComponent(
                          `Check Out This Product:${process.env.NEXT_PUBLIC_API_URL}/product/${p.slug}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full"
                      >
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 32 32"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <img
                src="/images/no-productbox.png"
                alt="No products found"
                className="mx-auto mb-6 w-48 h-48"
              />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                No Products Found
              </h2>
              <p className="text-gray-600">
                Try different search terms or browse our categories
              </p>
            </div>
          )}
          {renderPagination()}
        </div>
      </div>
    </div>
  );
}
