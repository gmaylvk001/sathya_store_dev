//C:\Users\hariharan\OneDrive\ドキュメント\Desktop\Bea_\bea_site\components\Fallbackmain.js

"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FaSortAmountDown, FaSlidersH, FaShareAlt } from 'react-icons/fa';
import { ChevronLeft, ChevronRight } from "react-feather";
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";
import { ToastContainer, toast } from 'react-toastify';
import {
  buildFilterLookupMaps,
  searchParamsToSelectedFilters,
  hasActiveFilterParams,
  normalizeFilterOption,
  slugifyFilter,
} from "@/lib/filterUrl";
import { useCategoryFilterUrl } from "@/hooks/useCategoryFilterUrl";
import ProductFilters from "@/components/filters/ProductFilters";
import { CATEGORY_PAGE_SHELL_CLASS } from "@/lib/categoryPageComponents/layout";
//import FlashCategorySlider from "../FlashCategorySlider";
//import BannerSlider from "../main-cat-banner";

export default function CategoryPage(params) {
  const [categoryData, setCategoryData] = useState({
    category: null,
    brands: [],
    filters: [],
    main_category: null
  });
const [categoryTree, setCategoryTree] = useState([]);
const [selectedCategory, setSelectedCategory] = useState("");
const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const [showEndMessage, setShowEndMessage] = useState(false);
  const [products, setProducts] = useState([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    brands: [],
    price: { min: 0, max: 100000 },
    filters: []
  });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [filterGroups, setFilterGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const { slug,sub_slug } = useParams();
  //const { slug } = useParams();
  const [sortOption, setSortOption] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  /** Stable options for URL slug↔id maps (not live facets) */
  const [filterCatalog, setFilterCatalog] = useState(null);

  // SEO filter URL sync (query params only — category path unchanged)
  useCategoryFilterUrl({
    selectedFilters,
    setSelectedFilters,
    filterCatalog,
    brands: filterCatalog?.brands || categoryData.brands || [],
    filterGroups: filterCatalog?.filterGroups || filterGroups,
    categoryTree: filterCatalog?.categoryTree || categoryTree,
    priceRange,
    enabled: true,
    ready: initialLoadComplete && !!filterCatalog,
  });








  const [nofound, setNofound] = useState(false);
  const [currentCategoryBannerIndex, setCurrentCategoryBannerIndex] = useState(0);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    totalProducts: 0
  });
  const itemsPerPage = 24;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter(); // Added router


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




  // Fetch initial data
  useEffect(() => {
    if (slug) {
      fetchInitialData();
    }
  }, [slug]);
  
  const scrollRef = useRef(null);
  
  const scroll = (direction) => {
  const container = scrollRef.current;
  if (!container) return;

  const cardWidth = 320 + 24; // card width + gap
  const visibleCards = 3;
  const scrollAmount = cardWidth * visibleCards;

  if (direction === "left") {
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }
};
  
  // In your fetchInitialData function, update the filter grouping:
const fetchInitialData = async () => {
  try {
    setLoading(true);

    const categoryRes = await fetch(`/api/categories/${slug}`);
    const categoryData = await categoryRes.json();

    setCategoryData({
      ...categoryData,
      categoryTree: categoryData.category,
      allCategoryIds: categoryData.allCategoryIds,
      banners: categoryData.main_category?.banners || []
    });

    
   
const buildTree = (categories, parentId) => {
  return categories
    .filter(c => c.parentid?.toString() === parentId?.toString())
    .map(c => ({
      _id: c._id,
      category_name: c.category_name,
      subCategories: buildTree(categories, c._id)
    }));
};

// categoryData.category  categories array
let directChildren = [];
if (categoryData.category?.length > 0) {
  // current page
directChildren = categoryData.category.map(c => ({
  _id: c._id,
  category_name: c.category_name,
  category_slug: c.category_slug,
  subCategories: (c.subCategories || []).map(sub => ({
    _id: sub._id,
    category_name: sub.category_name,
    category_slug: sub.category_slug,
    subCategories: (sub.subCategories || []).map(grand => ({
      _id: grand._id,
      category_name: grand.category_name,
      category_slug: grand.category_slug,
      subCategories: []
    }))
  }))
}));

setCategoryTree(directChildren);
}
     
    // Price range logic
    let minPrice = 0;
    let maxPrice = 100000;
    if (categoryData.products?.length > 0) {
      const prices = categoryData.products.map(p => p.special_price || p.price);
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);

      if (minPrice === maxPrice) {
        minPrice = Math.max(1, minPrice - 100);
        maxPrice = maxPrice + 100;
      }

      setPriceRange([minPrice, maxPrice]);
    }

    // IMPROVED FILTER GROUPING LOGIC
    const groups = {};
    if (categoryData.filters && categoryData.filters.length > 0) {
      categoryData.filters.forEach((filter) => {
        // Use filter_group_id as the primary key, fallback to filter_group_name
        const groupId = filter.filter_group_id || filter.filter_group_name;
        
        if (groupId) {
          if (!groups[groupId]) {
            groups[groupId] = {
              _id: groupId,
              name: filter.filter_group_name || 'Unnamed Group',
              slug: slugifyFilter(
                filter.filter_group_slug || filter.filter_group_name || 'unnamed'
              ),
              filters: []
            };
          }
          
          // Keep filter_slug for SEO URL mapping
          groups[groupId].filters.push(normalizeFilterOption(filter));
        }
      });
      
      setFilterGroups(groups);
      
    } else {
     
      setFilterGroups({});
    }

    // Apply SEO filter URL (slugs → IDs) before first product fetch
    const lookupMaps = buildFilterLookupMaps({
      brands: categoryData.brands || [],
      filterGroups: groups,
      categoryTree: categoryData.category || [],
    });
    const urlSearch = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
    const urlFilters = searchParamsToSelectedFilters(
      urlSearch,
      lookupMaps,
      [minPrice, maxPrice]
    );
    const nextSelected = {
      categories: urlFilters.categories,
      brands: urlFilters.brands,
      filters: urlFilters.filters,
      price: hasActiveFilterParams(urlSearch)
        ? urlFilters.price
        : { min: minPrice, max: maxPrice },
    };
    setSelectedFilters(nextSelected);

    setFilterCatalog({
      brands: categoryData.brands || [],
      filterGroups: groups,
      categoryTree: directChildren?.length
        ? directChildren
        : categoryData.category || [],
    });

    await fetchFilteredProducts(categoryData, 1, true, nextSelected);
    
  } catch (error) {
    console.error('💥 Error in fetchInitialData:', error);
    toast.error("Error fetching initial data");
    router.push('/noproduct');
  } finally {
    setLoading(false);
    setInitialLoadComplete(true);
  }
};
  const [brandMap, setBrandMap] = useState([]);
 
  const fetchBrand = async () => {
    try {
      const response = await fetch("/api/brand");
      const result = await response.json();
      if (result.error) {
        console.error(result.error);
      } else {
        const data = result.data;
  
        // Store as map for quick access
        const map = {};
        data.forEach((b) => {
          map[b._id] = b.brand_name;
        });
        setBrandMap(map);
      }
    } catch (error) {
      console.error(error.message);
    }
  };
 
  useEffect(() => {
    fetchBrand();
  }, []);

const fetchFilteredProducts = useCallback(async (categoryData, pageNum = 1, initialLoad = false, filtersOverride = null) => {
    try {
      if (!initialLoad){ 
        window.scrollTo({ top: 0, behavior: 'instant' });
        setIsFiltering(true);
      }
      const activeFilters = filtersOverride || selectedFilters;
      const query = new URLSearchParams();

      // Category IDs correctly based on selected category/subcategory
      let categoryIds = categoryData.allCategoryIds || [];

      // Root categories with no children (e.g. Combo Offers) must include themselves
      if (
        (!categoryIds || categoryIds.length === 0) &&
        categoryData.main_category?._id
      ) {
        categoryIds = [categoryData.main_category._id];
      }

      if (selectedSubCategory || selectedCategory) {
        const activeName = selectedSubCategory || selectedCategory;

        const findNode = (tree, name) => {
          for (const node of tree) {
            if (node.category_name === name) return node;
            if (node.subCategories?.length > 0) {
              const found = findNode(node.subCategories, name);
              if (found) return found;
            }
          }
          return null;
        };

        const node = findNode(categoryTree, activeName);

        if (node) {
          const getAllIds = (n) => {
            let ids = [n._id.toString()];
            if (n.subCategories?.length > 0) {
              n.subCategories.forEach(child => {
                ids = ids.concat(getAllIds(child));
              });
            }
            return ids;
          };
          categoryIds = getAllIds(node); 
        }
      }

  
      if (activeFilters.categories.length > 0) {
        categoryIds = activeFilters.categories;
      }

      query.set('categoryIds', categoryIds.join(','));
      query.set('page', pageNum);
      query.set('limit', itemsPerPage);

      if (activeFilters.brands.length > 0) {
        query.set('brands', activeFilters.brands.join(','));
      }
      query.set('minPrice', activeFilters.price.min);
      query.set('maxPrice', activeFilters.price.max);

      if (activeFilters.filters.length > 0) {
        query.set('filters', activeFilters.filters.join(','));
      }

      if (sortOption) {
        query.set('sort', sortOption);
      }

      const res = await fetch(`/api/product/filter/main-cat?${query}`);
      const data = await res.json();
      const { products, pagination: paginationData } = data;
      const filteredBrands = data.brands || [];
      const filteredFilters = data.filters || [];

      setProducts(products);

      //  Brands dynamic update
      if (filteredBrands.length > 0) {
        setCategoryData(prev => ({ ...prev, brands: filteredBrands }));
        setFilterCatalog((prev) =>
          prev
            ? {
                ...prev,
                brands: (() => {
                  const byId = new Map();
                  for (const b of [...(prev.brands || []), ...filteredBrands]) {
                    const id = b?._id?.toString?.() || b?._id;
                    if (id) byId.set(String(id), b);
                  }
                  return [...byId.values()];
                })(),
              }
            : prev
        );
      } else {
        setCategoryData(prev => ({ ...prev, brands: [] }));
      }

  
      if (filteredFilters.length > 0) {
        const groups = {};
        filteredFilters.forEach(filter => {
          const groupId = filter.filter_group_name;
          if (groupId) {
            if (!groups[groupId]) {
              groups[groupId] = {
                _id: groupId,
                name: filter.filter_group_name,
                slug: slugifyFilter(
                  filter.filter_group_slug || filter.filter_group_name
                ),
                filters: []
              };
            }
            const option = normalizeFilterOption(filter);
            const exists = groups[groupId].filters.some(
              (f) => String(f._id) === String(option._id)
            );
            if (!exists) groups[groupId].filters.push(option);
          }
        });
        setFilterGroups(groups);
        setFilterCatalog((prev) =>
          prev ? { ...prev, filterGroups: { ...prev.filterGroups, ...groups } } : prev
        );
      } else {
        setFilterGroups({});
      }

    
      setPagination({
        currentPage: paginationData.currentPage,
        totalPages: paginationData.totalPages,
        hasNext: paginationData.currentPage < paginationData.totalPages,
        hasPrev: paginationData.currentPage > 1,
        totalProducts: paginationData.totalProducts
      });

      if (products.length === 0 && pageNum === 1) {
        setNofound(true);
      } else {
        setNofound(false);
      }
    } catch (error) {
      toast.error('Error fetching products: ' + error);
      router.push('/noproduct');
    } finally {
      if (initialLoad) {
        setLoading(false);
      } else {
        setIsFiltering(false);
      }
    }
  }, [selectedFilters, selectedCategory, selectedSubCategory, categoryTree, sortOption]);

  const handleProductClick = (product) => {
    const stored = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

    const alreadyViewed = stored.find((p) => p._id === product._id);

    const updated = alreadyViewed
      ? stored.filter((p) => p._id !== product._id)
      : stored;

    updated.unshift(product); // Add to beginning

    const limited = updated.slice(0, 10); // Limit to 10 recent products

    localStorage.setItem('recentlyViewed', JSON.stringify(limited));
  };

  // Sorting functionality
  /* const getSortedProducts = () => {
    const sortedProducts = [...products];
    switch(sortOption) {
      case 'price-low-high':
        return sortedProducts.sort((a, b) => a.special_price - b.special_price);
      case 'price-high-low':
        return sortedProducts.sort((a, b) => b.special_price - a.special_price);
      case 'name-a-z':
        return sortedProducts.sort((a, b) => { if (a.name.toLowerCase() === 'capacity') return -1; if (b.name.toLowerCase() === 'capacity') return 1; return a.name.localeCompare(b.name); });
      case 'name-z-a':
        return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sortedProducts;
    }
  }; */

  const getSortedProducts = () => {
      const sortedProducts = [...products];

      switch (sortOption) {
        case 'price-low-high':
          return sortedProducts.sort((a, b) => a.special_price - b.special_price);

        case 'price-high-low':
          return sortedProducts.sort((a, b) => b.special_price - a.special_price);

        case 'name-a-z':
          return sortedProducts.sort((a, b) => {
            if (a.name.toLowerCase() === 'capacity') return -1;
            if (b.name.toLowerCase() === 'capacity') return 1;
            return a.name.localeCompare(b.name);
          });

        case 'name-z-a':
          return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));

        // ✅ NEW: Quantity Low → High
        case 'quantity-low-to-high':
          return sortedProducts.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));

        // ✅ NEW: Quantity High → Low
        case 'quantity-high-to-low':
          return sortedProducts.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));

        default:
          return sortedProducts;
      }
    };

  const sortFilterValues = (a, b) => {
    const extractNum = (str) => {
      const match = str.match(/[\d.]+/);
      if (!match) return null;
      let num = parseFloat(match[0]);
      if (/TB/i.test(str)) num *= 1024;
      else if (/MB/i.test(str)) num /= 1024;
      if (/^(below|up to|upto|less than|under)/i.test(str)) return num - 0.5;
      if (/^(above|more than|over)/i.test(str)) return num + 0.5;
      return num;
    };
    const numA = extractNum(a.filter_name);
    const numB = extractNum(b.filter_name);
    if (numA !== null && numB !== null) return numA - numB;
    if (numA !== null) return -1;
    if (numB !== null) return 1;
    return a.filter_name.localeCompare(b.filter_name);
  };

  const handleFilterChange = (type, value, checked = null) => {
  setSelectedFilters(prev => {
    const newFilters = { ...prev };
    const id = value != null ? String(value) : value;
    const hasId = (list, item) =>
      (list || []).some((x) => String(x) === String(item));
    
    if (type === 'brands') {
      newFilters.brands = hasId(prev.brands, id)
        ? prev.brands.filter(item => String(item) !== id)
        : [...prev.brands, id];
    } else if (type === 'price') {
      newFilters.price = value;
    } else if (type === 'categories') {
      newFilters.categories = hasId(prev.categories, id)
        ? prev.categories.filter(item => String(item) !== id)
        : [...prev.categories, id];
    } else if (type === 'filters') {
      if (checked !== null) {
        newFilters.filters = checked
          ? hasId(prev.filters, id) ? prev.filters : [...prev.filters, id]
          : prev.filters.filter(item => String(item) !== id);
      } else {
        newFilters.filters = hasId(prev.filters, id)
          ? prev.filters.filter(item => String(item) !== id)
          : [...prev.filters, id];
      }
    }
    return newFilters;
  });
};

  const handlePriceChange = (values) => {
    let min = Math.max(1, values[0]);     // clamp to >= 1
    let max = Math.max(1, values[1]);   // clamp to <= 100

    // Ensure min never exceeds max
    if (min > max) {
      min = max;
    }

    setSelectedFilters((prev) => ({
      ...prev,
      price: { min, max }
    }));
  };

  const STEP = 100;
  const MIN = priceRange[0];
  const MAX = priceRange[1];

  // slider local state
  const [values, setValues] = useState([
    selectedFilters.price.min,
    selectedFilters.price.max,
  ]);

  // sync with external filters (e.g. reset button)
  useEffect(() => {
    setValues([selectedFilters.price.min, selectedFilters.price.max]);
  }, [selectedFilters.price.min, selectedFilters.price.max]);



  const skipNextFilterFetch = useRef(true);

useEffect(() => {
    if (categoryData.main_category && categoryData.category && initialLoadComplete) {
      if (skipNextFilterFetch.current) {
        skipNextFilterFetch.current = false;
        return;
      }
      fetchFilteredProducts(categoryData, 1);
    }
  }, [selectedFilters, selectedCategory, selectedSubCategory, sortOption, categoryData.main_category, categoryData.category, initialLoadComplete]);
  
  const clearAllFilters = () => {
    setSelectedFilters({
      categories: [],
      brands: [],
      price: { min: priceRange[0], max: priceRange[1] },
      filters: []
    });
      setSelectedCategory("");     
      setSelectedSubCategory(""); 
  };

const handlePageChange = (page) => {
  if (page >= 1 && page <= pagination.totalPages) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      fetchFilteredProducts(categoryData, page);
    }, 50);
  }
};

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    const hasPrev = pagination.currentPage > 1;
    const hasNext = pagination.currentPage < pagination.totalPages;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md ${
            pagination.currentPage === i
              ? 'bg-[#d72828] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex justify-center items-center mt-8 space-x-2">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!hasPrev}
          className={`p-2 rounded-md ${!hasPrev ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
        >
          <ChevronLeft size={16} />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-1 rounded-md bg-white text-gray-700 hover:bg-gray-100"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages}
        
        {endPage < pagination.totalPages && (
          <>
            {endPage < pagination.totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              className="px-3 py-1 rounded-md bg-white text-gray-700 hover:bg-gray-100"
            >
              {pagination.totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!hasNext}
          className={`p-2 rounded-md ${!hasNext ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  // Show loader until first paint only (filter refetches use isFiltering overlay)
  if ((loading && !initialLoadComplete) || !initialLoadComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d72828]"></div>
        </div>
      </div>
    );
  }

  if (!categoryData.category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Category not found</h1>
      </div>
    );
  }

  return (


    <div className={`${CATEGORY_PAGE_SHELL_CLASS} py-2 pb-3`}>

      
  {/* Pass the current category slug to show only relevant banners */}
      {/* <BannerSlider categorySlug={slug} /> */}

      {/* ✅ Dynamic Flash Category SLIDER from Database */}
     {/*  <FlashCategorySlider slug={params.slug} /> */}  
     
     {categoryData.main_category.banners && categoryData.main_category.banners.length > 0 && (
        <div className="relative w-full mb-8 rounded-lg overflow-hidden shadow-md">
          <div className="relative w-full aspect-[16/6] sm:aspect-[16/7] lg:aspect-[16/5] cursor-pointer"
            onClick={() => {
              const redirectUrl = categoryData.main_category.banners[currentCategoryBannerIndex].redirect_url;
              if (redirectUrl) window.location.href = redirectUrl;
            }}
          >
            <Image
              src={
                categoryData.main_category.banners[currentCategoryBannerIndex].banner_image.startsWith("http")
                  ? categoryData.main_category.banners[currentCategoryBannerIndex].banner_image
                  : `${categoryData.main_category.banners[currentCategoryBannerIndex].banner_image}`
              }
              alt={categoryData.main_category.banners[currentCategoryBannerIndex].banner_name}
              fill
              className="object-cover w-full h-full"
              unoptimized
            />
      
            {/* Navigation Arrows */}
            {/* {categoryData.banners.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentCategoryBannerIndex(
                      (prev) =>
                        prev === 0 ? categoryData.banners.length - 1 : prev - 1
                    );
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentCategoryBannerIndex(
                      (prev) =>
                        prev === categoryData.banners.length - 1 ? 0 : prev + 1
                    );
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )} */}
      
            {/* Radio Button Indicators */}
            {categoryData.main_category.banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {categoryData.main_category.banners.map((_, index) => (
                  <label
                    key={index}
                    className="flex items-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentCategoryBannerIndex(index);
                    }}
                  >
                    <input
                      type="radio"
                      name="category-banner-indicator"
                      checked={index === currentCategoryBannerIndex}
                      onChange={() => setCurrentCategoryBannerIndex(index)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        index === currentCategoryBannerIndex
                          ? "bg-white border-white"
                          : "bg-transparent border-white/70"
                      }`}
                    >
                      {index === currentCategoryBannerIndex && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d72828]"></span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
      
          {/* Banner Title */}
          {/* {categoryData.banners[currentCategoryBannerIndex].banner_name && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
              <h2 className="text-xl font-semibold">
                {categoryData.banners[currentCategoryBannerIndex].banner_name}
              </h2>
              {categoryData.banners[currentCategoryBannerIndex].redirect_url && (
                <p className="text-sm mt-1 opacity-80">Click to explore</p>
              )}
            </div>
          )} */}
        </div>
      )}
{/* Categories Circle Section - Dynamic based on subcategories */}

<div className="relative my-12 px-6">
  {/* Left arrow */}
  <button
    onClick={() => scroll("left")}
    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 p-3 rounded-full shadow-md hidden md:flex items-center justify-center"
  >
    <span className="text-2xl font-bold text-gray-700">{`‹`}</span>
  </button>

  {/* Right arrow */}
  <button
    onClick={() => scroll("right")}
    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 p-3 rounded-full shadow-md hidden md:flex items-center justify-center"
  >
    <span className="text-2xl font-bold text-gray-700">{`›`}</span>
  </button>

  {/* Scroll container */}
  <div
    ref={scrollRef}
    className={`flex ${
      categoryData?.categoryTree?.length > 3
        ? "overflow-x-auto scroll-smooth hide-scrollbar"
        : "justify-center flex-wrap gap-6"
    } py-4`}
    style={{
      scrollSnapType: "x mandatory",
      scrollPadding: "0 24px",
      gap: "24px", // spacing between cards
      maxWidth: "calc((320px * 3) + (24px * 2))", // 3 cards + 2 gaps
      margin: "0 auto", // center container
    }}
  >

    
    {categoryData?.categoryTree?.length > 0 ? (
         categoryData.categoryTree.map((subcategory) => (
           <Link
             key={subcategory._id}
             href={`/category/${slug}/${sub_slug}/${subcategory.category_slug}`}
             className="flex flex-row items-center flex-shrink-0 w-[320px] h-[264px] border border-gray-200 rounded-xl bg-white hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:bg-gray-50"
             style={{ scrollSnapAlign: "start" }}
           >
             {/* Image section */}
             <div className="flex justify-center items-center w-[150px] h-full ml-4 flex-shrink-0">
               {subcategory.image ? (
                 <div className="relative w-[170px] h-[220px] flex items-center justify-center">
                   <Image
                     src={
                       subcategory.image.startsWith("http")
                         ? subcategory.image
                         : `${subcategory.image}`
                     }
                     alt={subcategory.category_name}
                     fill
                     className="object-contain object-center"
                     unoptimized
                     onError={(e) => {
                       e.target.style.display = "none";
                       const fallback = e.target.nextSibling;
                       if (fallback) fallback.style.display = "block";
                     }}
                   />
                   <div className="relative w-full h-full hidden">
                     <Image
                       src="/no-catimg.png"
                       alt="Fallback image"
                       fill
                       className="object-contain object-center"
                       unoptimized
                     />
                   </div>
                 </div>
               ) : (
                 <div className="relative w-[170px] h-[220px] flex items-center justify-center">
                   <Image
                     src="/no-catimg.png"
                     alt="Fallback image"
                     fill
                     className="object-contain object-center"
                     unoptimized
                   />
                 </div>
               )}
             </div>
   
             {/* Content section */}
            <div className="flex flex-col text-left px-3 py-10 w-[150px] h-full">
            <h3
     className={`font-bold text-gray-900 mb-3  ${
       subcategory.category_name.length > 13 ? "text-sm text-wrap" : "text-md"
     }`}
   >
     {subcategory.category_name}
   </h3>
   
   
             <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2 min-h-[40px]">
               {subcategory.content || ""}
             </p>
   
             <button className="bg-[#2b8ef6] text-white rounded-md px-4 py-2 font-semibold w-fit hover:bg-[#1f77db] transition-colors">
               Explore
             </button>
           </div>
   
           </Link>
         ))
       )  : (
      <div className="text-center w-full py-8">
        <p className="text-gray-500">No subcategories available</p>
      </div>
    )}
  </div>
</div>

      


     <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-8">
  <div className="lg:col-span-1 space-y-6">
    <h1 className="text-3xl font-bold mb-3 text-gray-600 pl-1">{categoryData.main_category.category_name}</h1>
  </div>
  <div className="lg:col-span-3">
    {/* Mobile: Products count at top */}
    <div className="sm:hidden mb-4">
      <p className="text-sm text-gray-600">{pagination.totalProducts} products found</p>
    </div>
    
    {/* Desktop: Products count and sort together */}
    <div className="hidden sm:flex justify-between items-center mb-3">
      <p className="text-sm text-gray-600">{pagination.totalProducts} products found</p>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Sort by:</span>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="px-4 py-2 border rounded-md text-sm bg-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-[#d72828]"
        >
          <option value="">Featured</option>
          <option value="price-low-high">Price: Low to High</option>
          <option value="price-high-low">Price: High to Low</option>
          <option value="name-a-z">Name: A-Z</option>
          <option value="name-z-a">Name: Z-A</option>
          <option value="quantity-low-to-high">Quantity: Low to High</option>
          <option value="quantity-high-to-low">Quantity: High to Low</option>
        </select>
      </div>
    </div>
  </div>
</div>
    {/* Mobile Sort + Filter Buttons */}
     
    <div className="flex border-b border-gray-300 bg-gray-100 sticky top-0 z-30 lg:hidden mb-3">
      <button
        className="flex items-center justify-center gap-2 py-4 flex-1 text-sm font-medium text-gray-800 border-r border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        onClick={() => setIsSortPanelOpen(true)}
      >
        <FaSortAmountDown className="text-gray-500 text-xs" />
        SORT
      </button>
      
      <button
        className="flex items-center justify-center gap-2 py-4 flex-1 text-sm font-medium text-gray-800 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        onClick={() => setIsFilterPanelOpen(true)}
      >
        <FaSlidersH className="text-gray-500 text-xs" />
        FILTER
      </button>
    </div>
          {/* Mobile Sort Modal */}
          {isSortPanelOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:hidden">
              <div className="bg-white w-full rounded-t-2xl p-5">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h2 className="text-lg font-semibold">Sort By</h2>
                  <button onClick={() => setIsSortPanelOpen(false)}>✕</button>
                </div>

                <div className="space-y-4">
                  {/* <label className="block text-gray-600 text-sm font-medium mb-2">Sort by</label> */}
                <ul className="divide-y divide-gray-200 text-sm">
            <li
              className={`py-3 cursor-pointer ${sortOption === '' ? 'text-[#d72828] font-semibold' : 'text-gray-700'}`}
              onClick={() => {
                setSortOption('');
                setIsSortPanelOpen(false);
              }}
            >
              Featured
            </li>
            <li
              className={`py-3 cursor-pointer ${sortOption === 'price-low-high' ? 'text-[#d72828] font-semibold' : 'text-gray-700'}`}
              onClick={() => {
                setSortOption('price-low-high');
                setIsSortPanelOpen(false);
              }}
            >
              Price: Low to High
            </li>
            <li
              className={`py-3 cursor-pointer ${sortOption === 'price-high-low' ? 'text-[#d72828] font-semibold' : 'text-gray-700'}`}
              onClick={() => {
                setSortOption('price-high-low');
                setIsSortPanelOpen(false);
              }}
            >
              Price: High to Low
            </li>
            <li
              className={`py-3 cursor-pointer ${sortOption === 'name-a-z' ? 'text-[#d72828] font-semibold' : 'text-gray-700'}`}
              onClick={() => {
                setSortOption('name-a-z');
                setIsSortPanelOpen(false);
              }}
            >
              Name: A-Z
            </li>
            <li
              className={`py-3 cursor-pointer ${sortOption === 'name-z-a' ? 'text-[#d72828] font-semibold' : 'text-gray-700'}`}
              onClick={() => {
                setSortOption('name-z-a');
                setIsSortPanelOpen(false);
              }}
            >
              Name: Z-A
            </li>
          </ul>

                </div>
              </div>
            </div>
          )}


          
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <ProductFilters
              variant="both"
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearAll={clearAllFilters}
              onPriceChange={handlePriceChange}
              brands={categoryData.brands || []}
              filterGroups={filterGroups}
              priceRange={priceRange}
              values={values}
              setValues={setValues}
              categoryTree={categoryTree}
              showCategories={categoryTree.length > 0}
              showBrands={true}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedSubCategory={selectedSubCategory}
              setSelectedSubCategory={setSelectedSubCategory}
              isFilterPanelOpen={isFilterPanelOpen}
              setIsFilterPanelOpen={setIsFilterPanelOpen}
            />
            {isFiltering && (
              <div className="fixed top-20 right-4 z-40 bg-white shadow px-3 py-2 rounded text-sm text-gray-600 border">
                Updating results...
              </div>
            )}

      {!nofound && products?.length > 0 ? (
        <>
          

            {/* Products Section */}
            <div className="flex-1">
  {products.length > 0 ? (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {getSortedProducts().map((product, index) => (
          <div key={`${product._id}-${index}`} className="group relative bg-white rounded-lg border hover:border-red-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full">
            {/* Product Image */}
            <div className="relative aspect-square bg-white">
              <Link
                href={`/product/${product.slug}`}
                className="block mb-2"
                onClick={() => handleProductClick(product)}
              >
                {product.images?.[0] && (
                  <Image
                    src={
                      product.images[0].startsWith("http")
                        ? product.images[0]
                        : `/uploads/products/${product.images[0]}`
                    }
                    alt={product.name}
                    fill
                    className="object-contain p-2 md:p-4 transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 33vw, 25vw"
                    unoptimized
                  />
                )}
              </Link>

              {/* Discount Badge */}
              {Number(product.special_price) > 0 &&
                Number(product.special_price) < Number(product.price) && (
                  <span className="absolute top-3 left-2 bg-orange-500 text-white tracking-wider text-xs font-bold px-2 py-0.5 rounded z-10">
                    -{Math.round(100 - (Number(product.special_price) / Number(product.price)) * 100)}%
                  </span>
              )}

              {/* Wishlist */}
              <div className="absolute top-2 right-2">
                <ProductCard productId={product._id} isOutOfStock={product.quantity === 0} />
              </div>
            </div>

            {/* Product Info and Buttons */}
            <div className="p-2 md:p-4 flex flex-col h-full">
              <h4 className="text-xs text-gray-500 mb-2 uppercase">
                <Link
                  href={`/brand/${brandMap[product.brand] ? brandMap[product.brand].toLowerCase().replace(/\s+/g, "-") : ""}`}
                  className="hover:text-[#d72828]"
                >
                  {brandMap[product.brand] || ""}
                </Link>
              </h4>

              {/* Title with improved responsive height */}
              {/* <Link
                href={`/product/${product.slug}`}
                className="block mb-2 flex-1"
                onClick={() => handleProductClick(product)}
              >
                <h3 className="text-xs sm:text-sm font-medium text-[#d72828] hover:text-[#c02020]  line-clamp-2 min-h-[3rem] sm:min-h-[2.5rem] leading-tight">
                  {window.innerWidth < 540 && product.name.length > 140 ? product.name.slice(0, 100) + "..." : product.name}
                </h3>
              </Link> */}
              <Link href={`/product/${product.slug}`} className="block mb-2 flex-1" onClick={() => handleProductClick(product)}>
                <h3 className="text-xs sm:text-sm font-medium text-[#d72828] hover:text-[#c02020] min-h-[32px] sm:min-h-[40px]">
                  {(() => {
                    const model = product.model_number ? `(${product.model_number.trim()})` : "";
                    const name = product.name ? product.name.trim() : "";
                    const maxLen = 40;

                    if (model) {
                      const remaining = maxLen - model.length - 1; // 1 for space before model
                      const truncatedName =
                        name.length > remaining ? name.slice(0, remaining - 3) + `${model}...` : name;
                      return `${truncatedName} `;
                    } else {
                      return name.length > maxLen ? name.slice(0, maxLen - 3) + "..." : name;
                    }
                  })()}
                </h3>
                {/* Tooltip */}
                  <div className="absolute hidden group-hover:block left-3 -translate-y-full translate-y-[-1px] bg-[#d72828] text-white text-xs rounded px-2 py-1 max-w-[200px] whitespace-normal break-words shadow-md z-50">
                    {product.name}
                  </div>
              </Link>


              {/* Price Row */}
              <div className="mb-3">
                {/* {product.model_number && (
                  <div className="bg-gray-100 rounded-md inline-block mb-2">
                    <span className="text-sm font-semibold text-gray-700 tracking-wide">
                      Model: <span className="text-[#d72828]">({product.model_number})</span>
                    </span>
                  </div>
                )} */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-semibold text-red-600">
                    ₹ {(
                      product.special_price &&
                      product.special_price > 0 &&
                      product.special_price !== '0' &&
                      product.special_price < product.price
                        ? Math.round(product.special_price)
                        : Math.round(product.price)
                    ).toLocaleString('en-IN')}
                  </span>

                  {product.special_price > 0 &&
                    product.special_price !== '0' &&
                    product.special_price < product.price && (
                      <span className="text-xs text-gray-500 line-through">
                        ₹ {Math.round(product.price).toLocaleString('en-IN')}
                      </span>
                  )}
                </div>
              </div>

              <h4 className={`text-xs mb-3 ${product.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                {product.quantity > 0
                  ? `In Stock, ${product.quantity} units`
                  : "Out Of Stock"}
              </h4>

              {/* Bottom Buttons */}
              <div className="mt-auto flex items-center justify-between gap-2">
                <Addtocart
                  productId={product._id} 
                  stockQuantity={product.quantity}  
                  special_price={product.special_price}
                  className="w-full text-xs sm:text-sm py-1.5"
                    movement={product.movement}
                   productName={product.name}
                    productSlug={product.slug}
                />
                <a
                  href={`https://wa.me/919842344323?text=${encodeURIComponent(`Check Out This Product: ${apiUrl}/product/${product.slug}`)}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full transition-colors duration-300 flex items-center justify-center"
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
                 {/* <button
                    type="button"
                    onClick={() => handleShare(product)}
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

      {/* Pagination Controls */}
      {renderPagination()}
    </>
  ) : (
    <div className="text-center py-10">
      <img 
        src="/images/no-productbox.png" 
        alt="No Products" 
        className="mx-auto mb-4 w-32 h-32 md:w-40 md:h-40 object-contain" 
      />
    </div>
  )}

  {loading && (
    <div className="text-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d72828] mx-auto"></div>
    </div>
  )}
</div>
          
        </>
      ) : (
        <div className="text-center justify-center py-10 mx-auto">
          <img 
            src="/images/no-productbox.png" 
            alt="No Products" 
            className="mx-auto mb-4 w-32 h-32 md:w-40 md:h-40 object-contain" 
          />
        </div>
      )}
      </div>
      
    </div>
  );
}