"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "react-feather";
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";
import { ToastContainer, toast } from 'react-toastify';
import { Range as ReactRange } from "react-range";
import { FaShareAlt } from "react-icons/fa";

export default function BrandPage() {
  const [brandData, setBrandData] = useState({
    brand: null,
    categories: [],
    filters: []
  });
  const [products, setProducts] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    subcategories: [],
    brands: [],
    price: { min: 0, max: 100000 },
    filters: []
  });
    const CUSTOM_FILTER_ORDER = [
  "Stock Status",
  "STAR RATING",
  "TYPE",
  "CAPACITY",
  "FEATURES",
  "NUMBER OF RACKS",
  "material",
  "TYPE OF LID",
  "NO OF JARS",
  "Power Consumption",
  "CONTROL TYPE",
  "IGNITION SYSTEM",
  "NUMBER OF BURNERS",
  "FILTER TYPE",
  "NO OF SLICES",
  "FUNCTION TYPE",
  "AUTO CLEAN",
  "DUCTLESS",
  "CHIMNEY SIZE",
  "COMPATIBLE DEVICES",
  "SPEED CONTROLS",
  "TECHNOLOGY",
  "CONDENSER COIL",
  "WiFi Connectivity",
  "COLOR"
];
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [filterGroups, setFilterGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const { slug } = useParams();
  const router = useRouter();
  const [sortOption, setSortOption] = useState('');
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [isBrandsExpanded, setIsBrandsExpanded] = useState(true);
  const [expandedFilters, setExpandedFilters] = useState({}); 
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [wishlist, setWishlist] = useState([]); 
  const toggleFilters = () => setIsFiltersExpanded(!isFiltersExpanded);
  const toggleCategories = () => {
    setIsCategoriesExpanded(!isCategoriesExpanded);
  };
  const toggleBrands = () => setIsBrandsExpanded(!isBrandsExpanded);
  const toggleFilterGroup = (id) => {
    setExpandedFilters(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [nofound, setNofound] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    totalProducts: 0
  });
  const itemsPerPage = 20;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Fetch initial data
  useEffect(() => {
    if (slug) {
      fetchInitialData();
    }
  }, [slug]);
  
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const brandRes = await fetch(`/api/brand/${slug}`);
      const brandData = await brandRes.json();
      
      setBrandData({
        ...brandData,
        categoryTree: brandData.categories,
        allCategoryIds: brandData.allCategoryIds || []
      });

      if (brandData.products?.length > 0) {
        const prices = brandData.products.map(p => p.special_price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setPriceRange([minPrice, maxPrice]);
        setSelectedFilters(prev => ({
          ...prev,
          price: { min: minPrice, max: maxPrice }
        }));
      }

      const groups = {};
      brandData.filters.forEach(filter => {
        const groupId = filter.filter_group_name;
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
  // Banner navigation functions
  const nextBanner = () => {
    if (brandData.brand?.banners?.length > 0) {
      setCurrentBannerIndex((prevIndex) => 
        prevIndex === brandData.brand.banners.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevBanner = () => {
    if (brandData.brand?.banners?.length > 0) {
      setCurrentBannerIndex((prevIndex) => 
        prevIndex === 0 ? brandData.brand.banners.length - 1 : prevIndex - 1
      );
    }
  };

  // Handle banner click with redirect
  const handleBannerClick = () => {
    const currentBanner = brandData.brand?.banners[currentBannerIndex];
    if (currentBanner?.redirect_url) {
      if (currentBanner.redirect_url.startsWith('http')) {
        window.open(currentBanner.redirect_url, '_blank');
      } else {
        router.push(currentBanner.redirect_url);
      }
    }
  };

  // Auto-rotate banners
  useEffect(() => {
    if (brandData.brand?.banners?.length > 1) {
      const interval = setInterval(() => {
        nextBanner();
      }, 5000); // Change banner every 5 seconds

      return () => clearInterval(interval);
    }
  }, [brandData.brand?.banners]);

  const fetchFilteredProducts = useCallback(async (brandData, pageNum = 1, initialLoad = false) => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      
      // Always filter by the current brand
      query.set('brands', brandData.brand._id);
      
      // Add category filters if any
      if (selectedFilters.categories.length > 0) {
        query.set('categoryIds', selectedFilters.categories.join(','));
      }
      
      // Add subcategory filters if any
      if (selectedFilters.subcategories.length > 0) {
        query.set('subcategoryIds', selectedFilters.subcategories.join(','));
      }
      
      query.set('page', pageNum);
      query.set('limit', itemsPerPage);

      query.set('minPrice', selectedFilters.price.min);
      query.set('maxPrice', selectedFilters.price.max);
      
      if (selectedFilters.filters.length > 0) {
        query.set('filters', selectedFilters.filters.join(','));
      }

      const res = await fetch(`/api/product/filter/brand/main?${query}`);
      const { products, pagination: paginationData } = await res.json();

      setProducts(products);
      
      // Update pagination state
      setPagination({
        currentPage: paginationData.currentPage,
        totalPages: paginationData.totalPages,
        hasNext: paginationData.hasNext,
        hasPrev: paginationData.hasPrev,
        totalProducts: paginationData.totalProducts
      });
      
      if (products.length === 0 && pageNum === 1) {
        setNofound(true);
      } else {
        setNofound(false);
      }
    } catch (error) {
      toast.error('Error fetching products'+error);
    } finally {
      setLoading(false);
    }
  }, [selectedFilters]);
  
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

  // Sorting functionality
  /* const getSortedProducts = () => {
    const sortedProducts = [...products];
    switch(sortOption) {
      case 'price-low-high':
        return sortedProducts.sort((a, b) => a.special_price - b.special_price);
      case 'price-high-low':
        return sortedProducts.sort((a, b) => b.special_price - a.special_price);
      case 'name-a-z':
        return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
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
  
  const handleFilterChange = (type, value) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (type === 'brands') {
        newFilters.brands = prev.brands.includes(value)
          ? prev.brands.filter(item => item !== value)
          : [...prev.brands, value];
      } else if (type === 'price') {
        newFilters.price = value;
      } else  if (type === 'categories') {
        newFilters.categories = prev.categories.includes(value)
          ? prev.categories.filter(item => item !== value)
          : [...prev.categories, value];
      } else if (type === 'subcategories') {
        newFilters.subcategories = prev.subcategories.includes(value)
          ? prev.subcategories.filter(item => item !== value)
          : [...prev.subcategories, value];
      }
       else {
        newFilters.filters = prev.filters.includes(value)
          ? prev.filters.filter(item => item !== value)
          : [...prev.filters, value];
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
                    ? 'bg-red-50 text-[#d72828] font-medium'
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
    if (brandData.brand) {
      fetchFilteredProducts(brandData, 1);
    }
  }, [selectedFilters, brandData.brand]);

  const clearAllFilters = () => {
    setSelectedFilters({
      categories: [],
      subcategories: [],
      brands: [brandData.brand?._id], // Keep the current brand selected
      price: { min: priceRange[0], max: priceRange[1] },
      filters: []
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchFilteredProducts(brandData, page);
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

  if ((loading || !brandData.brand) && pagination.currentPage === 1) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d72828]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 pb-3 max-w-7xl">
      {!nofound && products.length > 0 ? (
        <>
          {/* Banner Section */}
          {brandData.brand?.banners && brandData.brand.banners.length > 0 && (
            <div className="relative w-full mb-8 rounded-lg overflow-hidden shadow-md">
              <div className="relative w-full aspect-[16/6] sm:aspect-[16/7] lg:aspect-[16/5] cursor-pointer"
                onClick={handleBannerClick}
              >
                <Image
                  src={
                    brandData.brand.banners[currentBannerIndex].banner_image.startsWith("http")
                      ? brandData.brand.banners[currentBannerIndex].banner_image
                      : `${brandData.brand.banners[currentBannerIndex].banner_image}`
                  }
                  alt={brandData.brand.banners[currentBannerIndex].banner_name}
                  fill
                  className="object-cover w-full h-full"
                  unoptimized
                />
                
                {/* {brandData.brand.banners.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevBanner();
                      }}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextBanner();
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )} */}
                
                {/* Radio Button Indicators */}
                {brandData.brand.banners.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {brandData.brand.banners.map((_, index) => (
                      <label
                        key={index}
                        className="flex items-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentBannerIndex(index);
                        }}
                      >
                        <input
                          type="radio"
                          name="banner-indicator"
                          checked={index === currentBannerIndex}
                          onChange={() => setCurrentBannerIndex(index)}
                          className="sr-only"
                        />
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            index === currentBannerIndex
                              ? 'bg-white border-white'
                              : 'bg-transparent border-white/70'
                          }`}
                        >
                          {index === currentBannerIndex && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d72828]"></span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Banner Title (Optional) */}
              {/* {brandData.brand.banners[currentBannerIndex].banner_name && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
                  <h2 className="text-xl font-semibold">
                    {brandData.brand.banners[currentBannerIndex].banner_name}
                  </h2>
                  {brandData.brand.banners[currentBannerIndex].redirect_url && (
                    <p className="text-sm mt-1 opacity-80">Click to explore</p>
                  )}
                </div>
              )} */}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              {brandData.brand?.image && (
                <div className="w-32 h-12 relative mb-4">
                  <Image
                    src={brandData.brand.image.startsWith('http') ? brandData.brand.image : `/uploads/Brands/${brandData.brand.image}`}
                    alt={brandData.brand.brand_name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
            <div className="lg:col-span-3">
              {/* Sorting and Count */}
              <div className="mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
          
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Filters Sidebar */}
            <div className="w-full md:w-[250px] shrink-0">
              {/* Active Filters */}
              {(selectedFilters.brands.length > 0 || 
                selectedFilters.categories.length > 0 ||
                selectedFilters.filters.length > 0 ||
                selectedFilters.price.min !== priceRange[0] || 
                selectedFilters.price.max !== priceRange[1]) && (
                <div className="bg-white p-4 rounded shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Active Filters</h3>
                    <button 
                      onClick={clearAllFilters}
                      className="text-[#d72828] text-sm hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFilters.categories.map(categoryId => {
                      const category = brandData.categories?.find(c => c._id === categoryId);
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
                    {selectedFilters.brands.map(brandId => {
                      const brand = brandData.brand?._id === brandId ? brandData.brand : null;
                      return brand ? (
                        <span 
                          key={brandId}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                        >
                          {brand.brand_name}
                          <button 
                            onClick={() => handleFilterChange('brands', brandId)}
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
              {brandData.categoryTree?.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-3 text-sm text-gray-600">
                  <h3 className="text-base font-semibold mb-3 text-gray-700">Categories</h3>
                  <CategoryTree 
                    categories={brandData.categoryTree} 
                    selectedCategories={selectedFilters.categories}
                    selectedSubcategories={selectedFilters.subcategories}
                    onFilterChange={handleFilterChange} 
                  />
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
                  onChange={(newValues) => setValues(newValues)} // move thumbs
                  onFinalChange={(newValues) => handlePriceChange(newValues)} // apply on release
                  renderTrack={({ props, children }) => (
                    <div
                      {...props}
                      className="w-full h-2 rounded-lg bg-gray-200 relative"
                    >
                      {/* active green bar */}
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
                    const { key, ...rest } = props; // remove key from spread
  
                    return (
                      <div
                        key={key} // assign key directly
                        {...rest} // spread remaining props
                        className={`w-4 h-4 rounded-full border-2 border-black shadow cursor-pointer relative
                          ${index === 0 ? "bg-[#d72828] z-10" : "bg-green-500 z-20"}`}
                      >
                        {/*
                        <span className="absolute -top-6 text-xs bg-gray-700 text-white px-2 py-1 rounded">
                          {index === 0 ? "Min" : "Max"}
                        </span>
                        */}
                      </div>
                    );
                  }}
                />
          
                <div className="flex justify-between text-sm text-gray-600 mt-6">
                  <span>₹{values[0].toLocaleString()}</span>
                  <span>₹{values[1].toLocaleString()}</span>
                </div>
              </div>
  
              {/* Brand Filter */}
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-base font-semibold text-gray-700">Brands</h3>
                  <button onClick={toggleBrands} className="text-gray-500 hover:text-gray-700">
                    {isBrandsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                {isBrandsExpanded && (
                  <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                    {brandData.brand && (
                      <li key={brandData.brand._id} className="flex items-center">
                        <label className="flex items-center space-x-2 w-full cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedFilters.brands.includes(brandData.brand._id)}
                            onChange={() => handleFilterChange("brands", brandData.brand._id)}
                            className="mr-2 h-4 w-4 text-[#d72828] border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-600">{brandData.brand.brand_name}</span>
                        </label>
                      </li>
                    )}
                  </ul>
                )}
              </div>
  
              {/* Dynamic Filters */}
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-3 border-gray-100">
                <div className="pb-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-700">Product Filters</h3>
                </div>
               {isFiltersExpanded && Object.values(filterGroups).length > 0 && (
                                      <div className="bg-white p-4 rounded-lg shadow-sm border mb-3 border-gray-100">
                                        <div className="pb-2 mb-2">
                                          <h3 className="text-base font-semibold text-gray-700">Product Filters</h3>
                                        </div>
                                    
                                        <div className="space-y-4">
                                          {Object.values(filterGroups)
                                            .sort((a, b) => {
                                      const order = CUSTOM_FILTER_ORDER.map(i => i.toLowerCase());
                                      const indexA = order.indexOf(a.name.toLowerCase());
                                      const indexB = order.indexOf(b.name.toLowerCase());
                                    
                                      return indexA - indexB;
                                    })
                                    
                                            .map(group => (
                                              <div key={group._id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                                <button onClick={() => toggleFilterGroup(group._id)} className="flex justify-between items-center w-full group">
                                                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#d72828] transition-color flex-1 text-left ">
                                                    {group.name}
                                                  </span>
                                                  <ChevronDown 
                                                    size={18}
                                                    className={`text-gray-400 transition-transform duration-200 ${
                                                      expandedFilters[group._id] ? 'rotate-180' : ''
                                                    }`}
                                                  />
                                                </button>
                                    
                                                {expandedFilters[group._id] && (
                                                  <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                                                    {group.filters.map(filter => (
                                                      <li key={filter._id} className="flex items-center">
                                                        <label className="flex items-center space-x-2 w-full cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                                                          <input
                                                            type="checkbox"
                                                            checked={selectedFilters.filters.includes(filter._id)}
                                                            onChange={() => handleFilterChange('filters', filter._id)}
                                                            className="h-4 w-4 text-[#d72828] border-gray-300 rounded focus:ring-red-500"
                                                          />
                                                          <span className="text-sm text-gray-600">{filter.filter_name}</span>
                                                          {/* {filter.count && (
                                                            <span className="text-xs text-gray-400 ml-auto">
                                                              ({filter.count})
                                                            </span>
                                                          )} */}
                                                        </label>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                )}
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    )}
              </div>
            </div>

            {/* Products Section */}
            <div className="flex-1">
              {products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {getSortedProducts().map(product => (
                      <div key={product._id} className="group relative bg-white rounded-lg border hover:border-red-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full">
                        {/* Product Image */}
                        <div className="relative aspect-square bg-white">
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
       
                          {/* Discount Badge */}
                          {Number(product.special_price) > 0 &&
                            Number(product.special_price) < Number(product.price) && (
                              <span className="absolute top-3 left-2 bg-orange-500 tracking-wider text-white text-xs font-bold px-4 py-0.5 rounded z-10">
                                -{Math.round(100 - (Number(product.special_price) / Number(product.price)) * 100)}%
                              </span>
                          )}
       
       
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
                              className="hover:text-[#d72828]"
                            >
                              {brandMap[product.brand] || ""}
                            </Link>
                          </h4>
      
                          {/* Title with fixed height */}
                          <Link
                            href={`/product/${product.slug}`}
                            className="block mb-2"
                            onClick={() => handleProductClick(product)}
                          >
                            <h3 className="text-xs sm:text-sm font-medium text-[#d72828] hover:text-[#c02020] line-clamp-2 min-h-[40px]">
                              {product.name}
                            </h3>
                          </Link>
       
                          {/* Price Row (same level always) */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-base font-semibold text-red-600">
                              ₹ {(
                                product.special_price &&
                                product.special_price > 0 &&
                                product.special_price != '0' &&
                                product.special_price != 0 &&
                                product.special_price < product.price
                                  ? Math.round(product.special_price)
                                  : Math.round(product.price)
                              ).toLocaleString()}
                            </span>
      
                            {product.special_price > 0 &&
                              product.special_price != '0' &&
                              product.special_price != 0 &&
                              product.special_price &&
                              product.special_price < product.price && (
                                <span className="text-xs text-gray-500 line-through">
                                  ₹ {Math.round(product.price).toLocaleString()}
                                </span>
                            )}
                          </div>
      
                          <h4 className={`text-xs mb-3 ${product.stock_status === "In Stock" && product.quantity ? "text-green-600" : "text-red-600"}`}>
                            {product.stock_status === "In Stock" && product.quantity ? ` ${product.stock_status}` : "Out Of Stock"}
                            {product.stock_status === "In Stock" && product.quantity ? `, ${product.quantity} units` : ""}
                          </h4>
       
                          {/* Bottom Buttons */}
                          <div className="mt-auto flex items-center justify-between gap-2">
                            <Addtocart
                              productId={product._id} stockQuantity={product.quantity}  special_price={product.special_price}
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
      
    </div>
  );
}