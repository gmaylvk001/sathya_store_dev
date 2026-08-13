// search-page.js (client)
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa";
import { ChevronDown, ChevronUp } from "react-feather";
import Addtocart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";
import { FaShareAlt } from "react-icons/fa";


const safeArray = (v) => (Array.isArray(v) ? v : []);

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();

  // URL-driven inputs
  const searchQuery = params.get("query") || "";

  const category = params.get("category") || "";
  const urlPage = Number(params.get("page") || 1);

    useEffect(() => {
    if (!searchQuery) {
      router.push("/");
    }
  }, [searchQuery]);

  // local state
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const [brandMap, setBrandMap] = useState({}); // id -> name
  const [brandSummaryRaw, setBrandSummaryRaw] = useState([]); // raw from API
  const [searchBrands, setSearchBrands] = useState([]); // mapped: { id, name, count }

  const [filterSummaryRaw, setFilterSummaryRaw] = useState([]); // raw from API
  const [filterDefs, setFilterDefs] = useState([]); // definitions from /api/categories/:slug
  const [filterGroups, setFilterGroups] = useState({}); // grouped filter defs
  const [filterDefMap, setFilterDefMap] = useState({}); // id -> { name, group }

  // selected (kept in state and synced to URL)
  const [selectedBrands, setSelectedBrands] = useState(() => (params.get("brands") || "").split(",").filter(Boolean));
  const [selectedFilters, setSelectedFilters] = useState(() => (params.get("filters") || "").split(",").filter(Boolean));
  const [values, setValues] = useState([0, 500000]); // current slider values
  const [priceRange, setPriceRange] = useState([0, 500000]); // available min/max
 const [allFiltersFromResults, setAllFiltersFromResults] = useState([]);
  const [brandsExpanded, setBrandsExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [categoryData, setCategoryData] = useState({ categories: [] });
const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
const [selectedCategories, setSelectedCategories] = useState([]);
const [selectedSubcategories, setSelectedSubcategories] = useState([]);

  const [page, setPage] = useState(urlPage);

  // if URL changes (outside this component), keep local state in sync
  useEffect(() => {
    const b = (params.get("brands") || "").split(",").filter(Boolean);
    const f = (params.get("filters") || "").split(",").filter(Boolean);
    const p = Number(params.get("page") || 1);
    const min = params.get("minPrice") ? Number(params.get("minPrice")) : null;
    const max = params.get("maxPrice") ? Number(params.get("maxPrice")) : null;

    

    setSelectedBrands(b);
    setSelectedFilters(f);
    setPage(p);

    if (min !== null && max !== null) {
      setValues([min, max]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  // load brand master
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/brand");
        const json = await res.json();
        const arr = json?.data || [];
        const map = {};
        arr.forEach((b) => {
          if (b && b._id) map[b._id] = b.brand_name;
        });
        if (mounted) setBrandMap(map);
      } catch (err) {
        console.error("Failed to load brand master", err);
      }
    })();
    return () => (mounted = false);
  }, []);

  // load category filter definitions
useEffect(() => {
  const defs = allFiltersFromResults;
  if (defs.length === 0) {
    setFilterGroups({});
    setFilterDefMap({});
    return;
  }

  const groups = {};
  const map = {};
  defs.forEach((f) => {
    const group = f.filter_group_name || "Other";
    if (!groups[group]) groups[group] = { _id: group, name: group, filters: [] };
    groups[group].filters.push(f);
    map[String(f._id)] = { name: f.filter_name, group };
  });
  setFilterGroups(groups);
  setFilterDefMap(map);
}, [allFiltersFromResults]);

  // build querystring from state
  const buildQueryParams = (overrides = {}) => {
    const qp = new URLSearchParams();
    if (searchQuery) qp.set("query", searchQuery);
    if (category) qp.set("category", category);
    const brands = overrides.brands ?? selectedBrands;
    const filters = overrides.filters ?? selectedFilters;
    const p = overrides.page ?? page;
    const includePrice =
      overrides.includePrice ?? (params.has("minPrice") || params.has("maxPrice"));
    if (brands.length) qp.set("brands", brands.join(","));
    if (filters.length) qp.set("filters", filters.join(","));
    if (includePrice) {
      const min = overrides.min ?? values[0];
      const max = overrides.max ?? values[1];
      qp.set("minPrice", min);
      qp.set("maxPrice", max);
    }
    qp.set("page", p);
    qp.set("limit", 12);
    const categoryIds = overrides.categoryIds ?? selectedCategories.join(',');
const subcategoryIds = overrides.subcategoryIds ?? selectedSubcategories.join(',');
if (categoryIds) qp.set("categoryIds", categoryIds);
if (subcategoryIds) qp.set("subcategoryIds", subcategoryIds);
    return qp.toString();
  };

  // fetch search results (main)
  useEffect(() => {
    let mounted = true;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const qs = buildQueryParams();
        const { data } = await axios.get(`/api/search?${qs}`);
        if (!mounted) return;
        setProducts(Array.isArray(data.products) ? data.products : []);
        setPagination(data.pagination || null);
        setBrandSummaryRaw(Array.isArray(data.brandSummary) ? data.brandSummary : []);
        setFilterSummaryRaw(Array.isArray(data.filterSummary) ? data.filterSummary : []);
      setAllFiltersFromResults(Array.isArray(data.filterDefs) ? data.filterDefs : []);
      const cats = Array.isArray(data.categories) ? data.categories : [];
      setCategoryData({ categories: cats });
      } catch (err) {
        console.error("Search API error", err);
        setProducts([]);
        setPagination(null);
        setBrandSummaryRaw([]);
        setFilterSummaryRaw([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchResults();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    category,
    page,
    selectedBrands.join(","),
    selectedFilters.join(","),
    values[0],
    values[1],
    Object.keys(brandMap).length,
    selectedCategories.join(","),   
  selectedSubcategories.join(","),
  ]);

  // map brandSummary (raw) -> searchBrands with names
  useEffect(() => {
    const mapped = (brandSummaryRaw || [])
      .map((b) => {
        // brand summary could be { brandId, count } or { _id, count }
        const id = String(b.brandId ?? b._id ?? "");
        const count = b.count ?? 0;
        return { id, name: brandMap[id] || id, count };
      })
      .filter((x) => x && x.id);
    setSearchBrands(mapped);
  }, [brandSummaryRaw, brandMap]);

  // get filter name helper
  const getFilterName = (id) => filterDefMap[String(id)]?.name || id;

  // mapped filter summary with names (for counts)
  const mappedFiltersWithNames = useMemo(() => {
    return (filterSummaryRaw || []).map((f) => {
      const id = String(f.filterId ?? f._id ?? "");
      return {
        filterId: id,
        count: f.count || 0,
        name: getFilterName(id),
        group: filterDefMap[id]?.group || "Other",
      };
    });
  }, [filterSummaryRaw, filterDefMap]);

  // toggle brand -> update URL
  const toggleBrand = (id) => {
    const next = selectedBrands.includes(id) ? selectedBrands.filter((b) => b !== id) : [...selectedBrands, id];
    setSelectedBrands(next);
    setPage(1);
    const qs = buildQueryParams({ brands: next, page: 1 });
    router.push(`/search?${qs}`);
  };

  // toggle product filter -> update URL
  const toggleProductFilter = (id) => {
    const next = selectedFilters.includes(id) ? selectedFilters.filter((f) => f !== id) : [...selectedFilters, id];
    setSelectedFilters(next);
    setPage(1);
    const qs = buildQueryParams({ filters: next, page: 1 });
    router.push(`/search?${qs}`);
  };

  const handleShare = async (product) => {
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          url: productUrl,
        });
      } else {
        await navigator.clipboard.writeText(productUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };
  // apply price slider
  const applyPrice = (min, max) => {
    setValues([min, max]);
    setPage(1);
    const qs = buildQueryParams({ min, max, page: 1, includePrice: true });
    router.push(`/search?${qs}`);
  };

  // applied chips helpers
  const removeBrandChip = (id) => {
    const next = selectedBrands.filter((b) => b !== id);
    setSelectedBrands(next);
    const qs = buildQueryParams({ brands: next, page: 1 });
    router.push(`/search?${qs}`);
  };
  const removeFilterChip = (id) => {
    const next = selectedFilters.filter((f) => f !== id);
    setSelectedFilters(next);
    const qs = buildQueryParams({ filters: next, page: 1 });
    router.push(`/search?${qs}`);
  };
  const clearPriceChip = () => {
    setValues(priceRange);
    const qs = buildQueryParams({ page: 1, includePrice: false });
    router.push(`/search?${qs}`);
  };

  const hasActivePriceFilter = params.has("minPrice") || params.has("maxPrice");

  useEffect(() => {
  if (Object.keys(filterGroups).length > 0) {
    const expandedByDefault = {};

    Object.values(filterGroups).forEach((g) => {
      expandedByDefault[g._id] = true; // ✅ ALL OPEN BY DEFAULT
    });

    setExpandedGroups(expandedByDefault);
  }
}, [filterGroups]);

 const [expandedCategoriesState, setExpandedCategoriesState] = useState({});

// Auto-expand all parent categories when categories load
useEffect(() => {
  if (categoryData.categories && categoryData.categories.length > 0) {
    const expandAll = (categories) => {
      const expanded = {};
      const traverse = (cats) => {
        cats.forEach(cat => {
          if (cat.subCategories && cat.subCategories.length > 0) {
            expanded[cat._id] = true;
            traverse(cat.subCategories);
          }
        });
      };
      traverse(categories);
      setExpandedCategoriesState(expanded);
    };
    expandAll(categoryData.categories);
  }
}, [categoryData.categories]);

const handleCategoryFilterChange = (type, value, parentId = null) => {
  if (type === "reset") {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setPage(1);
    router.push(`/search?${buildQueryParams({ categoryIds: "", subcategoryIds: "", page: 1 })}`);

  } else if (type === "parent") {
    setSelectedCategories([value]);
    setSelectedSubcategories([]);
    setPage(1);
    router.push(`/search?${buildQueryParams({ categoryIds: value, subcategoryIds: "", page: 1 })}`);

  } else if (type === "allChildren") {
    setSelectedSubcategories([]);
    setPage(1);
    router.push(`/search?${buildQueryParams({ categoryIds: value, subcategoryIds: "", page: 1 })}`);

  } else if (type === "child") {
    setSelectedSubcategories([value]);
    setPage(1);
    router.push(`/search?${buildQueryParams({ categoryIds: parentId, subcategoryIds: value, page: 1 })}`);
  }
};

const CategoryTree = ({ categories, selectedCategories, selectedSubcategories, onFilterChange }) => {
  const selectedParent = categories.find(
    (c) => c._id?.toString() === selectedCategories[0]?.toString()
  ) || null;
  const subCategories = selectedParent?.subCategories || [];

  return (
    <div>
      {/* Parent Categories */}
      <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
        <li>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="radio"
              name="searchCategory"
              checked={selectedCategories.length === 0}
              onChange={() => onFilterChange("reset")}
              className="h-4 w-4 text-[#d72828]"
            />
            <span className="text-sm font-medium text-gray-700">All Categories</span>
          </label>
        </li>
        {categories.map((cat) => {
          const catId = cat._id?.toString();
          const isSelected = selectedCategories[0]?.toString() === catId;
          return (
            <li key={catId}>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="searchCategory"
                  checked={isSelected}
                  onChange={() => onFilterChange("parent", catId)}
                  className="h-4 w-4 text-[#d72828]"
                />
                <span className={`text-sm ${isSelected ? "text-[#d72828] font-medium" : "text-gray-600"}`}>
                  {cat.category_name}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {/* Child Categories — selected parent இருந்தா மட்டும் காட்டு */}
      {selectedParent && subCategories.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <div className="bg-gray-100 px-3 py-1 mb-2 rounded">
            <span className="text-xs font-semibold text-gray-600">{selectedParent.category_name}</span>
          </div>
          <ul className="max-h-48 overflow-y-auto pr-2">
            <li>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="searchSubCategory"
                  checked={selectedSubcategories.length === 0}
                  onChange={() => onFilterChange("allChildren", selectedCategories[0])}
                  className="h-4 w-4 text-[#d72828]"
                />
                <span className="text-sm font-medium text-gray-700">
                  All {selectedParent.category_name}
                </span>
              </label>
            </li>
            {subCategories.map((child) => {
              const childId = child._id?.toString();
              const isChildSelected = selectedSubcategories[0]?.toString() === childId;
              return (
                <li key={childId}>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="radio"
                      name="searchSubCategory"
                      checked={isChildSelected}
                      onChange={() => onFilterChange("child", childId, selectedCategories[0])}
                      className="h-4 w-4 text-[#d72828]"
                    />
                    <span className={`text-sm ${isChildSelected ? "text-[#d72828] font-medium" : "text-gray-600"}`}>
                      {child.category_name}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

useEffect(() => {
  if (products.length > 0 && categoryData.categories.length === 0) {
    // Extract unique categories from products
    const productCategories = {};
    products.forEach(p => {
      if (p.category) {
        const catId = p.category._id || p.category;
        const catName = p.category.category_name || p.category;
        if (!productCategories[catId]) {
          productCategories[catId] = { _id: catId, category_name: catName };
        }
      }
    });
    
    const flatCategories = Object.values(productCategories);
    if (flatCategories.length > 0) {
      setCategoryData(prev => ({ 
        ...prev, 
        categories: flatCategories 
      }));
      console.log("Created flat categories from products:", flatCategories);
    }
  }
}, [products]);


  // pagination UI generator (limited)
  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    const { currentPage, totalPages, hasNext, hasPrev } = pagination;
    const pages = [];
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) pages.push("...");
    }
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="flex justify-center items-center gap-2 my-6">
       
        <button disabled={!hasPrev} onClick={() => router.push(`/search?${buildQueryParams({ page: currentPage - 1 })}`)} className={`px-3 py-2 rounded ${hasPrev ? "bg-gray-100 hover:bg-gray-200" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Prev</button>
        {pages.map((num, idx) => num === "..." ? <span key={`dots-${idx}`} className="px-3 py-2">…</span> : (
          <button key={num} onClick={() => router.push(`/search?${buildQueryParams({ page: num })}`)} className={`px-3 py-2 rounded ${num === currentPage ? "bg-red-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{num}</button>
        ))}
        <button disabled={!hasNext} onClick={() => router.push(`/search?${buildQueryParams({ page: currentPage + 1 })}`)} className={`px-3 py-2 rounded ${hasNext ? "bg-gray-100 hover:bg-gray-200" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Next</button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-7xl mx-auto">
     
        <h1 className="text-3xl font-bold mb-3 text-gray-600">Search Results {category && `in ${category}`} {searchQuery && `for '${searchQuery}'`}</h1>

        {/* Applied Filter Chips */}
        {(selectedBrands.length > 0 || selectedFilters.length > 0 || hasActivePriceFilter) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedBrands.map((id) => (
              <span key={`chip-brand-${id}`} className="flex items-center gap-2 bg-red-100 text-[#d72828] px-3 py-1 rounded-full text-xs">
                {brandMap[id] || id}
                <button onClick={() => removeBrandChip(id)} className="ml-1 font-bold">×</button>
              </span>
            ))}

            {selectedFilters.map((id) => (
              <span key={`chip-filter-${id}`} className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
                {getFilterName(id)}
                <button onClick={() => removeFilterChip(id)} className="ml-1 font-bold">×</button>
              </span>
            ))}

            {hasActivePriceFilter && (
              <span key="chip-price" className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs">
                ₹{values[0]} - ₹{values[1]}
                <button onClick={clearPriceChip} className="ml-1 font-bold">×</button>
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          {/* Sidebar */}
          <div className="w-full md:w-[260px] shrink-0 space-y-4">
            {/* Categories */}
            {console.log("Category check:", { 
  categoriesLength: categoryData.categories?.length, 
  categories: categoryData.categories 
})}
{/* Categories Section with Hierarchy */}
{categoryData.categories && categoryData.categories.length > 0 && (
  <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
    <div className="flex items-center justify-between pb-2">
      <h3 className="text-base font-semibold text-gray-700">Categories</h3>
      <button 
        onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)} 
        className="text-gray-500 hover:text-gray-700"
      >
        <ChevronDown className={`transform transition-transform ${isCategoriesExpanded ? 'rotate-180' : ''}`} size={18} />
      </button>
    </div>
    
    {isCategoriesExpanded && (
      <CategoryTree
        categories={categoryData.categories}
        selectedCategories={selectedCategories}
        selectedSubcategories={selectedSubcategories}
        onFilterChange={handleCategoryFilterChange}
      />
    )}
  </div>
)}
            {/* Price */}
            <div className="bg-white p-4 rounded shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-700">Price</h3>
                <button onClick={clearPriceChip} className="text-sm text-gray-500">Reset</button>
              </div>

              <div className="mt-2">
                <input type="range" min={priceRange[0]} max={priceRange[1]} value={values[1]} onChange={(e) => setValues([priceRange[0], Number(e.target.value)])} className="w-full" />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>₹{values[0]}</span>
                  <span>₹{values[1]}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => applyPrice(values[0], values[1])} className="px-3 py-1 bg-[#d72828] text-white rounded text-sm">Apply</button>
                </div>
              </div>
            </div>

            {/* Brands */}
            <div className="bg-white p-4 rounded shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-700">Brands</h3>
                <button onClick={() => setBrandsExpanded((s) => !s)} className="text-gray-500">{brandsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
              </div>

              {brandsExpanded && (
                <ul className="max-h-48 overflow-y-auto pr-2">
                  {searchBrands.map((b) => (
                    <li key={b.id} className="flex items-center py-1">
                      <label className="flex items-center gap-2 w-full cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input type="checkbox" checked={selectedBrands.includes(b.id)} onChange={() => toggleBrand(b.id)} />
                        <span className="text-sm text-gray-700">{b.name} <span className="text-xs text-gray-400">({b.count})</span></span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Product Filters */}
            {Object.keys(filterGroups).length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                <h3 className="text-base font-semibold text-gray-700 mb-2">Product Filters</h3>
                <div className="space-y-4">
                  {Object.values(filterGroups).map((g) => (
                    <div key={g._id} className="border-b last:border-0 pb-2">
                      <button onClick={() => setExpandedGroups((prev) => ({ ...prev, [g._id]: !prev[g._id] }))} className="flex justify-between w-full items-center text-sm font-medium text-gray-700">
                        <span>{g.name}</span>
                        <ChevronDown className={expandedGroups[g._id] ? "transform rotate-180" : ""} />
                      </button>

                      {expandedGroups[g._id] && (
                        <ul className="mt-2 max-h-48 overflow-y-auto">
                          {g.filters.map((f) => {
                            const cnt = (filterSummaryRaw.find((x) => String(x.filterId) === String(f._id)) || {}).count || 0;
                            return (
                              <li key={f._id} className="py-1">
                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={selectedFilters.includes(String(f._id))} onChange={() => toggleProductFilter(String(f._id))} />
                                  <span className="text-sm text-gray-700">{f.filter_name} {cnt ? <span className="text-xs text-gray-400">({cnt})</span> : null}</span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-3">
              <div className="text-gray-600">{(pagination?.total ?? products.length)} result{(pagination?.total ?? products.length) !== 1 ? "s" : ""} found</div>
            </div>

            {loading ? (
          <div className="flex justify-center items-center h-64"><FaSpinner className="animate-spin text-4xl text-[#d72828]" /></div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((p) => (
                  <div key={p._id} className="group relative bg-white rounded-lg border hover:border-red-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full">
                    <div className="relative aspect-square bg-white">
                      <Link href={`/product/${p.slug}`} className="block mb-2">
                        {p.images?.[0] && (
                          <Image src={p.images[0].startsWith("http") ? p.images[0] : `/uploads/products/${p.images[0]}`} alt={p.name} fill className="object-contain p-2 md:p-4 transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 33vw, 25vw" unoptimized />
                        )}
                      </Link>
                     
                      {Number(p.special_price) > 0 && Number(p.special_price) < Number(p.price) && (
                        <span className="absolute top-3 left-2 bg-red-500 text-white text-xs font-bold px-3 py-0.5 rounded z-10">
                          {Math.round(100 - (Number(p.special_price) / Number(p.price)) * 100)}% OFF
                        </span>
                      )}
                      {/* ✅ Clearance Sale Badge  */}
                             {(p.movement === "EOL" || p.movement === "FOCUS") && (
                    <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-pulse tracking-wide uppercase">
                          🏷️ Clearance Sale
                           </span>
                            )}

                      <div className="absolute top-2 right-2"><ProductCard productId={p._id} /></div>
                    </div>

                    <div className="p-3 flex flex-col h-full">
                      <h4 className="text-xs text-gray-500 mb-2 uppercase">
                        <Link href={`/brand/${(brandMap[p.brand] || "").toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-[#d72828]">{brandMap[p.brand] || ""}</Link>
                      </h4>

                      <Link href={`/product/${p.slug}`} className="block mb-1">
                        <h3 className="text-xs sm:text-sm font-medium text-[#d72828] hover:text-[#c02020] min-h-[32px] sm:min-h-[40px]">
                          {(p.name || "").length > 60 ? (p.name || "").slice(0, 57) + "..." : p.name}
                        </h3>
                      </Link>

                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-red-600">₹{Number(p.special_price) > 0 && Number(p.special_price) < Number(p.price) ? Math.round(p.special_price) : Math.round(p.price)}</span>
                          {Number(p.special_price) > 0 && Number(p.special_price) < Number(p.price) && (
                            <span className="text-xs text-gray-500 line-through">₹{Math.round(p.price)}</span>
                          )}
                        </div>
                      </div>

                      <h4 className={`text-xs mb-3 ${p.stock_status === "In Stock" ? "text-green-600" : "text-red-600"}`}>{p.stock_status}{p.stock_status === "In Stock" && p.quantity ? `, ${p.quantity} units` : ""}</h4>

                      <div className="mt-auto flex items-center justify-between gap-2">
                        <Addtocart productId={p._id} stockQuantity={p.quantity} special_price={p.special_price} className="w-full text-xs sm:text-sm py-1.5"  movement={p.movement}
                      productName={p.name}
                     productSlug={p.slug}/>
                        <a href={`https://wa.me/919842344323?text=${encodeURIComponent(`Check Out This Product:${process.env.NEXT_PUBLIC_API_URL}/product/${p.slug}`)}`} target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full">
                          <svg className="w-5 h-5" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z"/></svg>
                        </a>
                         {/* <button
                    type="button"
                    onClick={() => handleShare(p)}
                    className="bg-[#d72828] hover:bg-[#d72828] text-white p-1.5 rounded-full transition-colors duration-300 flex items-center justify-center flex-shrink-0"
                    title="Share this product"
                  >
                    <FaShareAlt className="w-5 h-5" />
                  </button> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <img src="/images/no-productbox.png" alt="No products found" className="mx-auto mb-6 w-48 h-48" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">No Products Found</h2>
                <p className="text-gray-600">Try different search terms or browse our categories</p>
              </div>
            )}

            {/* Pagination */}
            {renderPagination()}
       </div>
        </div>
      </div>
    </div>
  );
}
