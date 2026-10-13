"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import SharedProductCard from "@/components/product/ProductCard";
import { normalizeProduct } from "@/lib/normalizeProduct";
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiZap } from "react-icons/fi";

const ITEMS_PER_PAGE = 20;

export default function WeekendOfferPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("price_asc"); // price_asc or savings_asc
  const [currentDay, setCurrentDay] = useState("Today's");

  useEffect(() => {
    try {
      const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
      if (day) setCurrentDay(day);
    } catch {
      setCurrentDay("Special");
    }
  }, []);

  const fetchOffers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First try our enriched backend proxy endpoint which handles CORS and caching
      const res = await fetch(`/api/weekend-offers?sort=${sortBy}`);
      if (!res.ok) {
        throw new Error(`Failed to load offers (status ${res.status})`);
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        throw new Error("No offer products returned");
      }
    } catch (err) {
      console.error("Weekend offer load failed:", err);
      // Fallback: direct fetch from eprice cron API if client allows
      try {
        const directRes = await fetch(
          "https://cron.epricetrack.com/eprice/admin/cron/competitor_lsp_data_fetch_api.php?cmpid=sathya"
        );
        const directData = await directRes.json();
        if (Array.isArray(directData) && directData.length > 0) {
          const mapped = directData.map((item, idx) => {
            const price = Number(item.product_price) || 0;
            const originalPrice = Number(item.product_store_price || item.product_sap_price || price * 1.15);
            const cat = (item.product_category || "").split(">").map((s) => s.trim());
            return {
              _id: item.product_code || `offer-${idx}`,
              item_code: item.product_code,
              name: `${cat[cat.length - 1] || "Appliance"} - ${item.product_code}`,
              slug: item.product_code?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `offer-${idx}`,
              price: originalPrice,
              special_price: price,
              currentPrice: price,
              originalPrice,
              hasDiscount: true,
              discountPercent: Math.max(5, Math.round(Number(item.save_website_price_by_branch_price) || 15)),
              brandName: cat[0] || "SATHYA",
              imgSrc: "/uploads/products/placeholder.jpg",
              images: ["/uploads/products/placeholder.jpg"],
              inStock: true,
              quantity: 10,
              ratingValue: 4.5,
              reviewCount: 15,
            };
          });
          mapped.sort((a, b) => a.currentPrice - b.currentPrice);
          setProducts(mapped);
          setIsLoading(false);
          return;
        }
      } catch (fallbackErr) {
        console.error("Direct fallback also failed:", fallbackErr);
      }
      setError(err.message || "Failed to fetch offers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [sortBy]);

  // Client-side pagination (strictly 20 items per page)
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return products.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [products, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* 1. Header Banner & Dynamic Day Title */}
      <div className="bg-gradient-to-r from-red-700 via-[#d72828] to-orange-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Breadcrumb */}
          <nav className="text-xs text-red-100/90 mb-3 flex items-center gap-1.5">
            <Link href="/" className="hover:underline hover:text-white">
              Home
            </Link>
            <span>/</span>
            <span className="font-semibold text-white">Live Market Offers</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full mb-2.5 border border-white/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
                <FiZap className="text-amber-300" />
                <span>ePrice Tracker™ Verified Real-Time Benchmarks</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {currentDay} Special Offers
              </h1>
              <p className="text-sm text-red-100 mt-1 max-w-2xl">
                Exclusive live price-matched deals updated throughout the day. Best prices verified against Amazon, Flipkart, Croma and more.
              </p>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20 self-start md:self-auto">
              <span className="text-xs text-red-100 font-medium pl-2">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white text-slate-800 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer shadow-xs"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="savings_asc">Discount %: Low to High</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Results Counter Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="text-xs font-semibold text-slate-600">
            {isLoading ? (
              <span>Fetching latest deals...</span>
            ) : (
              <span>
                Showing{" "}
                <strong className="text-slate-900">
                  {totalItems > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} -{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                </strong>{" "}
                of <strong className="text-slate-900">{totalItems}</strong> live offers
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Loading Skeleton State */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col h-[360px] animate-pulse"
              >
                <div className="h-40 bg-slate-100 rounded-xl mb-3" />
                <div className="h-3 w-16 bg-slate-100 rounded mb-2" />
                <div className="h-4 w-full bg-slate-100 rounded mb-1.5" />
                <div className="h-4 w-3/4 bg-slate-100 rounded mb-4" />
                <div className="h-6 w-24 bg-slate-200 rounded mb-auto" />
                <div className="h-9 w-full bg-slate-100 rounded-xl mt-3" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-sm my-10">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              !
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Failed to load offers</h3>
            <p className="text-xs text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchOffers}
              className="inline-flex items-center gap-1.5 bg-[#d72828] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
            >
              <FiRefreshCw />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Products Grid (Responsive: grid-cols-2 md:grid-cols-4) */}
        {!isLoading && !error && currentProducts.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {currentProducts.map((product, index) => (
                <div key={product._id || index} className="h-full">
                  <SharedProductCard product={normalizeProduct(product)} />
                </div>
              ))}
            </div>

            {/* 3. Pagination Controls (Next / Previous buttons) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                Showing {currentProducts.length} items on page {currentPage} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Page number pill */}
                <div className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                >
                  <span>Next</span>
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!isLoading && !error && currentProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <img
              src="/images/no-productbox.png"
              alt="No Offers Available"
              className="mx-auto mb-4 w-32 h-32 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <h3 className="text-sm font-bold text-slate-800">No active offers found right now</h3>
            <p className="text-xs text-slate-500 mt-1">Please check back soon for our next sync slot.</p>
          </div>
        )}
      </div>
    </div>
  );
}
