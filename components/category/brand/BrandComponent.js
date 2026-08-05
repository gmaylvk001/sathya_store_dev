"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { FaSortAmountDown, FaSlidersH, FaShareAlt } from 'react-icons/fa';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "react-feather";
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";
import { ToastContainer, toast } from 'react-toastify';
import { Range as ReactRange } from "react-range";

export default function CategoryBrandComponent({ categorySlug, brandSlug }) {
  const [categoryData, setCategoryData] = useState({
    category: null,
    brand: null,
    categories: [],
    filters: [],
    allCategoryIds: []
  });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    subcategories: [],
    brands: [],
    price: { min: 0, max: 100000 },
    filters: []
  });
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [filterGroups, setFilterGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('');
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [isBrandsExpanded, setIsBrandsExpanded] = useState(true);
  const [expandedFilters, setExpandedFilters] = useState({}); 
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [wishlist, setWishlist] = useState([]); 
  const [nofound, setNofound] = useState(false);
  const [brandMap, setBrandMap] = useState({});

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    totalProducts: 0
  });
  const itemsPerPage = 12;

  const toggleFilters = () => setIsFiltersExpanded(!isFiltersExpanded);
  const toggleCategories = () => setIsCategoriesExpanded(!isCategoriesExpanded);
  const toggleBrands = () => setIsBrandsExpanded(!isBrandsExpanded);
  const toggleFilterGroup = (id) => {
    setExpandedFilters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Fetch initial data
  useEffect(() => {
    //alert('ssss');
    if (categorySlug && brandSlug) {
      fetchInitialData();
      fetchBrand();
    }
  }, [categorySlug, brandSlug]);
  
  const fetchInitialData = async () => {
 
    try {
      setLoading(true);
      const res = await fetch(`/api/brand/categories/${categorySlug}/brand/${brandSlug}`);
      const data = await res.json();
      //console.log("Initial data fetched:", data);
      setCategoryData({
        ...data,
        allCategoryIds: data.allCategoryIds || []
      });

      if (data.products?.length > 0) {
        const prices = data.products.map(p => p.special_price || p.price);
        let minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if(minPrice === maxPrice) {
          minPrice = 0; // Ensure a range
        }
        // alert(`Price range: ${minPrice} - ${maxPrice}`);
        setPriceRange([minPrice, maxPrice]);
        setSelectedFilters(prev => ({
          ...prev,
          price: { min: minPrice, max: maxPrice },
          brands: [data.brand?._id] // Set the current brand as selected
        }));
      }

      const groups = {};
      data.filters.forEach(filter => {
        const groupId = filter.filter_group_id || filter.filter_group_name;
        if (groupId) {
          if (!groups[groupId]) {
            groups[groupId] = {
              _id: groupId,
              name: filter.filter_group_name,
              slug: filter.filter_group_name.toLowerCase().replace(/\s+/g, '-'),
              filters: []
            };
          }
          groups[groupId].filters.push(filter);
        }
      });
      setFilterGroups(groups);
    } catch (error) {
      toast.error("Error fetching initial data");
    } finally {
      setLoading(false);
    }
  };
   const fetchFilteredProducts = useCallback(async (pageNum = 1) => {
  try {
    setLoading(true);
    const query = new URLSearchParams();

    // ✅ Always restrict by brand
    if (categoryData.brand?._id) {
      query.set('brands', categoryData.brand._id);
    }
  

   // ✅ CATEGORY FILTER (user selected)
if (selectedFilters.categories.length > 0) {
 
  query.set('categoryIds', selectedFilters.categories.join(','));
} 

// ✅ SUBCATEGORY FILTER
if (selectedFilters.subcategories.length > 0) {
  query.set('subcategoryIds', selectedFilters.subcategories.join(','));
}
  
    // Get current URL path
    const url = window.location.pathname; 

    // Split and extract
    const parts = url.split("/").filter(Boolean); 
  

    const categorySlugName = parts[2]; // "televisions"
    const brandSlugName = parts[3];    // "samsung"

    console.log(categorySlugName, brandSlugName);

    // Assign to query or use anywhere
    query.set('categorySlug', categorySlugName);
    query.set('brandSlug', brandSlugName);

    query.set('page', pageNum);
    query.set('limit', itemsPerPage);
    query.set('minPrice', selectedFilters.price.min);
    query.set('maxPrice', selectedFilters.price.max);

    if (selectedFilters.filters.length > 0) {
      query.set('filters', selectedFilters.filters.join(','));
    }
    console.log("FINAL QUERY:", query.toString());
    const res = await fetch(`/api/product/filter/category-brand/main?${query}`);
   
    const { products, pagination: paginationData } = await res.json();
console.log("Fetched products:", products);
    setProducts(products || []);

    if ((!products || products.length === 0) && pageNum === 1) {
      setNofound(true);
    } else {
      setNofound(false);
    }

    if (paginationData) {
      setPagination({
        currentPage: paginationData.currentPage || 1,
        totalPages: paginationData.totalPages || 1,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false,
        totalProducts: paginationData.totalProducts || 0
      });
    }
  } catch (error) {
    toast.error('Error fetching products: ' + error.message);
  } finally {
    setLoading(false);
  }
}, [selectedFilters, categoryData]);

  // const fetchFilteredProducts = useCallback(async (pageNum = 1) => {
  //   try {
  //     setLoading(true);
  //     const query = new URLSearchParams();
      
  //     // Filter by the current brand
  //     if (categoryData.brand?._id) {
  //       query.set('brands', categoryData.brand._id);
  //     }
      
  //     // Add category filters
  //     if (selectedFilters.categories.length > 0) {
  //       query.set('categoryIds', selectedFilters.categories.join(','));
  //     } else if (categoryData.allCategoryIds?.length > 0) {
  //       query.set('categoryIds', categoryData.allCategoryIds.join(','));
  //     }
      
  //     // Add subcategory filters if any
  //     if (selectedFilters.subcategories.length > 0) {
  //       query.set('subcategoryIds', selectedFilters.subcategories.join(','));
  //     }
      
  //     query.set('page', pageNum);
  //     query.set('limit', itemsPerPage);
  //     query.set('minPrice', selectedFilters.price.min);
  //     query.set('maxPrice', selectedFilters.price.max);
      
  //     if (selectedFilters.filters.length > 0) {
  //       query.set('filters', selectedFilters.filters.join(','));
  //     }

  //     const res = await fetch(`/api/product/filter/category-brand/main?${query}`);
  //     const { products, pagination: paginationData } = await res.json();

  //     setProducts(products || []);
      
  //     // Update pagination state
  //     if (paginationData) {
  //       setPagination({
  //         currentPage: paginationData.currentPage || 1,
  //         totalPages: paginationData.totalPages || 1,
  //         hasNext: paginationData.hasNext || false,
  //         hasPrev: paginationData.hasPrev || false,
  //         totalProducts: paginationData.totalProducts || 0
  //       });
  //     }
      
  //     if ((!products || products.length === 0) && pageNum === 1) {
  //       setNofound(true);
  //     } else {
  //       setNofound(false);
  //     }
  //   } catch (error) {
  //     toast.error('Error fetching products: ' + error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [selectedFilters, categoryData]);
  
  const handleProductClick = (product) => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
      const alreadyViewed = stored.find((p) => p._id === product._id);
      const updated = alreadyViewed
        ? stored.filter((p) => p._id !== product._id)
        : stored;

      updated.unshift(product); // Add to beginning
      const limited = updated.slice(0, 10); // Limit to 10 recent products
      localStorage.setItem('recentlyViewed', JSON.stringify(limited));
    } catch (error) {
      console.error("Error saving to recently viewed:", error);
    }
  };

  // Sorting functionality
  /* const getSortedProducts = () => {
    const sortedProducts = [...products];
    switch(sortOption) {
      case 'price-low-high':
        return sortedProducts.sort((a, b) => (a.special_price || a.price) - (b.special_price || b.price));
      case 'price-high-low':
        return sortedProducts.sort((a, b) => (b.special_price || b.price) - (a.special_price || a.price));
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

  const fetchBrand = async () => {
    try {
      const response = await fetch("/api/brand");
      const result = await response.json();
      if (result.error) {
        console.error(result.error);
      } else {
        const data = result.data || result;
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

  const handleFilterChange = (type, value) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (type === 'brands') {
        newFilters.brands = prev.brands.includes(value)
          ? prev.brands.filter(item => item !== value)
          : [...prev.brands, value];
      } else if (type === 'price') {
        newFilters.price = value;
      } else if (type === 'categories') {
        newFilters.categories = prev.categories.includes(value)
          ? prev.categories.filter(item => item !== value)
          : [...prev.categories, value];
      } else if (type === 'subcategories') {
        newFilters.subcategories = prev.subcategories.includes(value)
          ? prev.subcategories.filter(item => item !== value)
          : [...prev.subcategories, value];
      } else {
        newFilters.filters = prev.filters.includes(value)
          ? prev.filters.filter(item => item !== value)
          : [...prev.filters, value];
      }
      return newFilters;
    });
  };

  const handlePriceChange = (values) => {
    let min = Math.max(1, values[0]);
    let max = Math.max(1, values[1]);

    // Ensure min never exceeds max
    if (min > max) {
      min = max;
    }

    // ###### B2125 ###### //
    // if (min >= max) {
    //   max = min + 1;
    // }

    setSelectedFilters((prev) => ({
      ...prev,
      price: { min, max }
    }));
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

  const STEP = 100;
  const MIN = priceRange[0] || 0;
  const MAX = priceRange[1] || 100000;

  // slider local state
  const [values, setValues] = useState([
    selectedFilters.price.min,
    selectedFilters.price.max,
  ]);

  // sync with external filters (e.g. reset button)
  useEffect(() => {
    setValues([selectedFilters.price.min, selectedFilters.price.max]);
  }, [selectedFilters.price.min, selectedFilters.price.max]);

  const CategoryTree = ({ 
    categories, 
    level = 0, 
    selectedCategories,
    selectedSubcategories,
    onFilterChange 
  }) => {
    const [expandedCategories, setExpandedCategories] = useState([]);
  
    const toggleCategory = (categoryId) => {
      setExpandedCategories(prev => 
        prev.includes(categoryId)
          ? prev.filter(id => id !== categoryId)
          : [...prev, categoryId]
      );
    };
  
    return (
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category._id}>
            <div className={`flex items-center gap-2 ${level > 0 ? `ml-${level * 4}` : ''}`}>
              
              {/* Select category (filter) */}
              <button
                onClick={() => onFilterChange(level === 0 ? 'categories' : 'subcategories', category._id)}
                className={`flex-1 p-2 rounded hover:bg-gray-100 inline-flex items-center ${
                  (level === 0 && selectedCategories.includes(category._id)) ||
                  (level > 0 && selectedSubcategories.includes(category._id))
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {category.image && (
                  <div className="w-6 h-6 mr-2 relative">
                    <Image
                      src={category.image.startsWith('http') ? category.image : `${category.image}`}
                      alt={category.category_name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                {category.category_name}
                {category.count !== undefined && ` (${category.count})`}
              </button>

              {/* Expand/Collapse chevron */}
              {category.subCategories?.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleCategory(category._id)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  {expandedCategories.includes(category._id) ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              )}
            </div>

            {/* Render subcategories */}
            {category.subCategories?.length > 0 &&
              expandedCategories.includes(category._id) && (
                <CategoryTree
                  categories={category.subCategories}
                  level={level + 1}
                  selectedCategories={selectedCategories}
                  selectedSubcategories={selectedSubcategories}
                  onFilterChange={onFilterChange}
                />
              )}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (categoryData.brand) {
      fetchFilteredProducts(1);
    }
  }, [selectedFilters, categoryData.brand, fetchFilteredProducts]);

  const clearAllFilters = () => {
    setSelectedFilters({
      categories: [],
      subcategories: [],
      brands: [categoryData.brand?._id], // Keep the current brand selected
      price: { min: priceRange[0], max: priceRange[1] },
      filters: []
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchFilteredProducts(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
              ? 'bg-blue-600 text-white'
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

  if ((loading || !categoryData.brand) && pagination.currentPage === 1) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 pb-3 max-w-7xl">
      {/* Breadcrumb */}
    

      {!nofound && products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              {categoryData.brand?.image && (
                <div className="w-32 h-12 relative mb-4">
                  <Image
                    src={categoryData.brand.image.startsWith('http') ? categoryData.brand.image : `/uploads/Brands/${categoryData.brand.image}`}
                    alt={categoryData.brand.brand_name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
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
          className="px-4 py-2 border rounded-md text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className={`py-3 cursor-pointer ${sortOption === '' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              onClick={() => {
                setSortOption('');
                setIsSortPanelOpen(false);
              }}
            >
              Featured
            </li>
            <li
              className={`py-3 cursor-pointer ${sortOption === 'price-low-high' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              onClick={() => {
                setSortOption('price-low-high');
                setIsSortPanelOpen(false);
              }}
            >
              Price: Low to High
            </li>
            <li
              className={`py-3 cursor-pointer ${sortOption === 'price-high-low' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              onClick={() => {
                setSortOption('price-high-low');
                setIsSortPanelOpen(false);
              }}
            >
              Price: High to Low
            </li>
            <li
              className={`py-3 cursor-pointer ${sortOption === 'name-a-z' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              onClick={() => {
                setSortOption('name-a-z');
                setIsSortPanelOpen(false);
              }}
            >
              Name: A-Z
            </li>
            <li
              className={`py-3 cursor-pointer ${sortOption === 'name-z-a' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
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
            {/* Filters Sidebar */}
            <div className="hidden lg:block w-full md:w-[250px] shrink-0">
              {/* Active Filters */}
              {(selectedFilters.categories.length > 0 ||
               selectedFilters.subcategories.length > 0 ||
               selectedFilters.filters.length > 0 ||
               selectedFilters.price.min !== priceRange[0] || 
               selectedFilters.price.max !== priceRange[1]) && (
                <div className="bg-white p-4 rounded shadow mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Active Filters</h3>
                    <button 
                      onClick={clearAllFilters}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFilters.categories.map(categoryId => {
                      const category = categoryData.categories?.find(c => c._id === categoryId);
                      return category ? (
                        <span 
                          key={categoryId}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                        >
                          {category.category_name}
                          <button 
                            onClick={() => handleFilterChange('categories', categoryId)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                    
                    {selectedFilters.subcategories.map(subcategoryId => {
                      // Find subcategory in the category tree
                      let subcategoryName = "";
                      const findSubcategory = (categories) => {
                        for (const cat of categories) {
                          if (cat._id === subcategoryId) {
                            subcategoryName = cat.category_name;
                            return true;
                          }
                          if (cat.subCategories && findSubcategory(cat.subCategories)) {
                            return true;
                          }
                        }
                        return false;
                      };
                      
                      if (categoryData.categories) findSubcategory(categoryData.categories);
                      
                      return subcategoryName ? (
                        <span 
                          key={subcategoryId}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                        >
                          {subcategoryName}
                          <button 
                            onClick={() => handleFilterChange('subcategories', subcategoryId)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                    
                    {selectedFilters.filters.map(filterId => {
                      const filter = Object.values(filterGroups)
                        .flatMap(g => g.filters)
                        .find(f => f._id === filterId);
                      return filter ? (
                        <span 
                          key={filterId}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                        >
                          {filter.filter_name}
                          <button 
                            onClick={() => handleFilterChange('filters', filterId)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                    
                    {(selectedFilters.price.min !== priceRange[0] || 
                     selectedFilters.price.max !== priceRange[1]) && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                        ₹{selectedFilters.price.min} - ₹{selectedFilters.price.max}
                        <button 
                          onClick={() => setSelectedFilters(prev => ({
                            ...prev,
                            price: { min: priceRange[0], max: priceRange[1] }
                          }))}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Categories Tree */}
              {categoryData.categories?.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-base font-semibold text-gray-700">Categories</h3>
                    <button onClick={toggleCategories} className="text-gray-500 hover:text-gray-700">
                      {isCategoriesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  {isCategoriesExpanded && (
                    <CategoryTree 
                      categories={categoryData.categories} 
                      selectedCategories={selectedFilters.categories}
                      selectedSubcategories={selectedFilters.subcategories}
                      onFilterChange={handleFilterChange}
                    />
                  )}
                </div>
              )}

              {/* Price Filter */}
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                <h3 className="text-base font-semibold mb-4 text-gray-700">Price Range</h3>
          
                <ReactRange
                  values={values}
                  step={STEP}
                  min={MIN}
                  max={MAX}
                  onChange={(newValues) => setValues(newValues)}
                  onFinalChange={(newValues) => handlePriceChange(newValues)}
                  renderTrack={({ props, children }) => (
                    <div
                      {...props}
                      className="w-full h-2 rounded-lg bg-gray-200 relative"
                    >
                      <div
                        className="absolute h-2 bg-gray-500 rounded-lg"
                        style={{
                          left: `${((values[0] - MIN) / (MAX - MIN)) * 100}%`,
                          width: `${((values[1] - values[0]) / (MAX - MIN)) * 100}%`,
                        }}
                      />
                      {children}
                    </div>
                  )}
                  renderThumb={({ props, index }) => {
                    const { key, ...rest } = props;
                    return (
                      <div
                        key={key}
                        {...rest}
                        className={`w-4 h-4 rounded-full border-2 border-black shadow cursor-pointer relative
                          ${index === 0 ? "bg-blue-500 z-10" : "bg-green-500 z-20"}`}
                      />
                    );
                  }}
                />
          
                <div className="flex justify-between text-sm text-gray-600 mt-6">
                  <span>₹{values[0].toLocaleString()}</span>
                  <span>₹{values[1].toLocaleString()}</span>
                </div>
              </div>

              {/* Brand Filter */}
              {categoryData.brands?.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-base font-semibold text-gray-700">Brands</h3>
                    <button onClick={toggleBrands} className="text-gray-500 hover:text-gray-700">
                      {isBrandsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  {isBrandsExpanded && (
                    <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                      {[...categoryData.brands].sort((a, b) => a.brand_name.localeCompare(b.brand_name)).map(brand => (
                        <li key={brand._id} className="flex items-center">
                          <label className="flex items-center space-x-2 w-full cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedFilters.brands.includes(brand._id)}
                              onChange={() => handleFilterChange("brands", brand._id)}
                              className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-600">{brand.brand_name} ({brand.count})</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Dynamic Filters */}
              {Object.values(filterGroups).length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-3 border-gray-100">
                  <div className="pb-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-700">Product Filters</h3>
                  </div>
                  {isFiltersExpanded && (
                    <div className="space-y-4">
                      {Object.values(filterGroups).sort((a, b) => { if (a.name.toLowerCase() === 'capacity') return -1; if (b.name.toLowerCase() === 'capacity') return 1; return a.name.localeCompare(b.name); }).map(group => (
                        <div key={group._id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                          <button onClick={() => toggleFilterGroup(group._id)} className="flex justify-between items-center w-full group">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-color flex-1 text-left uppercase">{group.name}</span>
                            <ChevronDown 
                              size={18}
                              className={`text-gray-400 transition-transform duration-200 ${
                                expandedFilters[group._id] ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {expandedFilters[group._id] && (
                            <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                              {[...group.filters].sort(sortFilterValues).map(filter => (
                                <li key={filter._id} className="flex items-center">
                                  <label className="flex items-center space-x-2 w-full cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={selectedFilters.filters.includes(filter._id)}
                                      onChange={() => handleFilterChange('filters', filter._id)}
                                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">{filter.filter_name}</span>
                                    {filter.count && (
                                      <span className="text-xs text-gray-400 ml-auto">
                                        ({filter.count})
                                      </span>
                                    )}
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

             {isFilterPanelOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="fixed left-0 top-0 w-4/5 h-full bg-white shadow-lg flex flex-col">
              
              {/* Header (fixed) */}
              <div className="flex justify-between items-center p-4 border-b flex-shrink-0 bg-white">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button 
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Active Filters */}
              {(selectedFilters.categories.length > 0 ||
               selectedFilters.subcategories.length > 0 ||
               selectedFilters.filters.length > 0 ||
               selectedFilters.price.min !== priceRange[0] || 
               selectedFilters.price.max !== priceRange[1]) && (
                <div className="bg-white p-4 rounded shadow mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Active Filters</h3>
                    <button 
                      onClick={clearAllFilters}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFilters.categories.map(categoryId => {
                      const category = categoryData.categories?.find(c => c._id === categoryId);
                      return category ? (
                        <span 
                          key={categoryId}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                        >
                          {category.category_name}
                          <button 
                            onClick={() => handleFilterChange('categories', categoryId)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                    
                    {selectedFilters.subcategories.map(subcategoryId => {
                      // Find subcategory in the category tree
                      let subcategoryName = "";
                      const findSubcategory = (categories) => {
                        for (const cat of categories) {
                          if (cat._id === subcategoryId) {
                            subcategoryName = cat.category_name;
                            return true;
                          }
                          if (cat.subCategories && findSubcategory(cat.subCategories)) {
                            return true;
                          }
                        }
                        return false;
                      };
                      
                      if (categoryData.categories) findSubcategory(categoryData.categories);
                      
                      return subcategoryName ? (
                        <span 
                          key={subcategoryId}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                        >
                          {subcategoryName}
                          <button 
                            onClick={() => handleFilterChange('subcategories', subcategoryId)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                    
                    {selectedFilters.filters.map(filterId => {
                      const filter = Object.values(filterGroups)
                        .flatMap(g => g.filters)
                        .find(f => f._id === filterId);
                      return filter ? (
                        <span 
                          key={filterId}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                        >
                          {filter.filter_name}
                          <button 
                            onClick={() => handleFilterChange('filters', filterId)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                    
                    {(selectedFilters.price.min !== priceRange[0] || 
                     selectedFilters.price.max !== priceRange[1]) && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                        ₹{selectedFilters.price.min} - ₹{selectedFilters.price.max}
                        <button 
                          onClick={() => setSelectedFilters(prev => ({
                            ...prev,
                            price: { min: priceRange[0], max: priceRange[1] }
                          }))}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Categories Tree */}
              {categoryData.categories?.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-base font-semibold text-gray-700">Categories</h3>
                    <button onClick={toggleCategories} className="text-gray-500 hover:text-gray-700">
                      {isCategoriesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  {isCategoriesExpanded && (
                    <CategoryTree 
                      categories={categoryData.categories} 
                      selectedCategories={selectedFilters.categories}
                      selectedSubcategories={selectedFilters.subcategories}
                      onFilterChange={handleFilterChange}
                    />
                  )}
                </div>
              )}

               {/* Price Filter */}
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                <h3 className="text-base font-semibold mb-4 text-gray-700">Price Range</h3>
          
                <ReactRange
                  values={values}
                  step={STEP}
                  min={MIN}
                  max={MAX}
                  onChange={(newValues) => setValues(newValues)}
                  onFinalChange={(newValues) => handlePriceChange(newValues)}
                  renderTrack={({ props, children }) => (
                    <div
                      {...props}
                      className="w-full h-2 rounded-lg bg-gray-200 relative"
                    >
                      <div
                        className="absolute h-2 bg-gray-500 rounded-lg"
                        style={{
                          left: `${((values[0] - MIN) / (MAX - MIN)) * 100}%`,
                          width: `${((values[1] - values[0]) / (MAX - MIN)) * 100}%`,
                        }}
                      />
                      {children}
                    </div>
                  )}
                  renderThumb={({ props, index }) => {
                    const { key, ...rest } = props;
                    return (
                      <div
                        key={key}
                        {...rest}
                        className={`w-4 h-4 rounded-full border-2 border-black shadow cursor-pointer relative
                          ${index === 0 ? "bg-blue-500 z-10" : "bg-green-500 z-20"}`}
                      />
                    );
                  }}
                />
          
                <div className="flex justify-between text-sm text-gray-600 mt-6">
                  <span>₹{values[0].toLocaleString()}</span>
                  <span>₹{values[1].toLocaleString()}</span>
                </div>
              </div>

                {/* Brand Filter */}
              {categoryData.brands?.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-base font-semibold text-gray-700">Brands</h3>
                    <button onClick={toggleBrands} className="text-gray-500 hover:text-gray-700">
                      {isBrandsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  {isBrandsExpanded && (
                    <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                      {[...categoryData.brands].sort((a, b) => a.brand_name.localeCompare(b.brand_name)).map(brand => (
                        <li key={brand._id} className="flex items-center">
                          <label className="flex items-center space-x-2 w-full cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedFilters.brands.includes(brand._id)}
                              onChange={() => handleFilterChange("brands", brand._id)}
                              className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-600">{brand.brand_name} ({brand.count})</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

                {/* Dynamic Filters */}
               {Object.values(filterGroups).length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-3 border-gray-100">
                  <div className="pb-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-700">Product Filters</h3>
                  </div>
                  {isFiltersExpanded && (
                    <div className="space-y-4">
                      {Object.values(filterGroups).sort((a, b) => { if (a.name.toLowerCase() === 'capacity') return -1; if (b.name.toLowerCase() === 'capacity') return 1; return a.name.localeCompare(b.name); }).map(group => (
                        <div key={group._id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                          <button onClick={() => toggleFilterGroup(group._id)} className="flex justify-between items-center w-full group">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{group.name}</span>
                            <ChevronDown 
                              size={18}
                              className={`text-gray-400 transition-transform duration-200 ${
                                expandedFilters[group._id] ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {expandedFilters[group._id] && (
                            <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                              {[...group.filters].sort(sortFilterValues).map(filter => (
                                <li key={filter._id} className="flex items-center">
                                  <label className="flex items-center space-x-2 w-full cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={selectedFilters.filters.includes(filter._id)}
                                      onChange={() => handleFilterChange('filters', filter._id)}
                                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">{filter.filter_name}</span>
                                    {filter.count && (
                                      <span className="text-xs text-gray-400 ml-auto">
                                        ({filter.count})
                                      </span>
                                    )}
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>

              {/* Footer button (fixed) */}
              <div className="p-4 border-t flex-shrink-0 bg-white">
                <button
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="w-full bg-blue-600 text-white py-2 rounded-md"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

            {/* Products Section */}
            <div className="flex-1">
             
              {products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {getSortedProducts().map(product => (
                      <div key={product._id} className="group relative bg-white rounded-lg border hover:border-blue-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full">
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
                          {(() => {
                            const discount = Math.round(
                              100-(Number(product.special_price) / Number(product.price)) * 100
                            );

                            return (
                              Number(product.special_price) > 0 &&
                              Number(product.special_price) < Number(product.price) &&
                              discount > 0 && (
                                <span className="absolute top-3 left-2 bg-orange-500 tracking-wider text-white text-xs font-bold px-2 py-0.5 rounded z-10">
                                  -{discount}%
                                </span>
                              )
                            );
                          })()}

       
                          {/* Wishlist */}
                          <div className="absolute top-2 right-2">
                            <ProductCard productId={product._id} />
                          </div>
                        </div>
       
                        {/* Product Info and Buttons */}
                        <div className="p-2 md:p-4 flex flex-col h-full">
                          <h4 className="text-xs text-gray-500 mb-2 uppercase">
                            <Link
                              href={`/brand/${brandMap[product.brand] ? brandMap[product.brand].toLowerCase().replace(/\s+/g, "-") : ""}`}
                              className="hover:text-blue-600"
                            >
                              {brandMap[product.brand] || ""}
                            </Link>
                          </h4>
      
                          {/* Title with fixed height */}
                          <Link
                          href={`/product/${product.slug}`}
                          onClick={() => handleProductClick(product)}
                          className="block mb-1"
                        >
                          <h3 className="text-xs sm:text-sm font-medium text-[#0069c6] hover:text-[#00badb] min-h-[32px] sm:min-h-[40px]">
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
                  <div className="absolute hidden group-hover:block left-3 -translate-y-full translate-y-[-1px] bg-[#0069c6] text-white text-xs rounded px-2 py-1 max-w-[200px] whitespace-normal break-words shadow-md z-50">
                    {product.name}
                  </div>
                        </Link>

       
                          {/* Price Row (same level always) */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-base font-semibold text-red-600">
                                ₹ {(
                                  product.special_price &&
                                  product.special_price > 0 &&
                                  product.special_price !== '0' &&
                                  product.special_price < product.price
                                    ? Math.round(product.special_price)
                                    : Math.round(product.price)
                                ).toLocaleString()}
                              </span>

                              {product.special_price > 0 &&
                                product.special_price !== '0' &&
                                product.special_price < product.price && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ₹ {Math.round(product.price).toLocaleString()}
                                  </span>
                              )}
                            </div>
                          </div>
                          <h4 className={`text-xs mb-3 ${product.stock_status === "In Stock" && product.quantity ? "text-green-600" : "text-red-600"}`}>
                            {product.stock_status === "In Stock" && product.quantity ? ` ${product.stock_status}` : "Out Of Stock"}
                            {product.stock_status === "In Stock" && product.quantity ? `, ${product.quantity} units` : ""}
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
                              href={`https://wa.me/919842344323?text=${encodeURIComponent(`Check Out This Product: ${window.location.origin}/product/${product.slug}`)}`} 
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
                    className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full transition-colors duration-300 flex items-center justify-center flex-shrink-0"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              )}
            </div>
          </div>
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
      <ToastContainer />
    </div>
  );
}