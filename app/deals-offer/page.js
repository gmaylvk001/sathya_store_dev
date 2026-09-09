"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Addtocart from "@/components/AddToCart";
import AddToWishlistButton from "@/components/ProductCard";

// Map subcategory slug / ID to broad section grouping if needed
const SECTION_ORDER = [
  {
    title: "TV & ACCESSORIES",
    slugs: ["television", "soundbar", "speakers", "qled", "full-hd"],
    viewAllHref: "/category/televisions",
  },
  {
    title: "APPLIANCES",
    slugs: [
      "air-cooler",
      "washing-machine",
      "refrigerator",
      "air-conditioner",
      "air-conditioner-large",
      "refrigerators",
      "single-door",
      "double-door",
      "triple-door",
      "side-by-side",
      "deep-freezer",
      "mini-fridge",
      "dishwasher",
    ],
    viewAllHref: "/category/large-appliances",
  },
  {
    title: "MOBILES & WEARABLES",
    slugs: ["mobile-phones", "mobiles-accessories", "wearables", "smart-watches", "gadgets"],
    viewAllHref: "/category/mobiles-accessories",
  },
  {
    title: "KITCHEN APPLIANCES",
    slugs: [
      "kitchen-appliances",
      "mixer-grinder",
      "induction-stove",
      "gas-stove",
      "wet-grinder",
      "water-purifier",
      "air-fryer",
      "microwave-oven",
      "electric-cooker",
      "cooktop",
      "kettle",
    ],
    viewAllHref: "/category/kitchen-appliances",
  },
  {
    title: "UTILITY APPLIANCES",
    slugs: ["fan", "tower-fan", "water-heater", "iron", "vacuum-cleaner", "stabilizer", "inverter", "air-purifier"],
    viewAllHref: "/category/small-appliances",
  },
];

function DealProductCard({ product, brandMap }) {
  const price = Number(product.price) || 0;
  const specialPrice = Number(product.special_price) || 0;
  const hasDiscount = specialPrice > 0 && specialPrice < price;
  const discountPct = hasDiscount
    ? Math.round(100 - (specialPrice / price) * 100)
    : 0;
  const displayPrice = hasDiscount ? specialPrice : price;

  const initialImg = product.images?.[0]
    ? product.images[0].startsWith("http")
      ? product.images[0]
      : `/uploads/products/${product.images[0]}`
    : "/uploads/sathya-header-logo.webp";

  const [imgSrc, setImgSrc] = useState(initialImg);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-xl hover:border-red-200 transition-all duration-300 flex flex-col p-3 sm:p-4 w-[240px] sm:w-[260px] md:w-[270px] flex-none relative group">
      {/* Discount Badge */}
      {hasDiscount && discountPct > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-[#d72828] text-white text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded shadow-sm">
          {discountPct}% OFF
        </div>
      )}

      {/* Wishlist Button */}
      <div className="absolute top-3 right-3 z-10">
        <AddToWishlistButton productId={product._id} />
      </div>

      {/* Product Image */}
      <Link
        href={`/product/${product.slug}`}
        className="block relative w-full h-44 sm:h-48 overflow-hidden rounded-lg my-2 flex items-center justify-center bg-white"
      >
        <Image
          src={imgSrc}
          alt={product.name || "Deal Product"}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 240px, 270px"
          onError={() => setImgSrc("/uploads/sathya-header-logo.webp")}
          unoptimized
        />
      </Link>

      {/* Brand Label */}
      {brandMap[product.brand] && (
        <div className="text-[10px] sm:text-xs uppercase font-semibold text-gray-400 mb-1 tracking-wider">
          {brandMap[product.brand]}
        </div>
      )}

      {/* Product Title */}
      <Link
        href={`/product/${product.slug}`}
        className="block mb-2 group-hover:text-[#d72828] transition-colors"
      >
        <h3
          className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 min-h-[36px] leading-tight"
          title={product.name}
        >
          {product.name}
        </h3>
      </Link>

      {/* Pricing */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-base sm:text-lg font-extrabold text-gray-900">
          ₹{Math.round(displayPrice).toLocaleString("en-IN")}
        </span>
        {hasDiscount && (
          <span className="text-xs text-gray-400 line-through">
            ₹{Math.round(price).toLocaleString("en-IN")}
          </span>
        )}
      </div>

      {/* Stock Status */}
      <div className="text-[11px] font-medium mb-3">
        {product.stock_status === "In Stock" ||
        (product.quantity && product.quantity > 0) ? (
          <span className="text-green-600 font-semibold">In Stock</span>
        ) : (
          <span className="text-red-500 font-semibold">Out of Stock</span>
        )}
      </div>

      {/* Add to Cart Button */}
      <div className="mt-auto pt-2 border-t border-gray-100 flex items-center">
        <Addtocart
          productId={product._id}
          stockQuantity={product.quantity || 1}
          special_price={product.special_price}
          movement={product.movement}
          productName={product.name}
          productSlug={product.slug}
          className="w-full text-xs sm:text-sm py-2 rounded-lg"
        />
      </div>
    </div>
  );
}

export default function DealsOfferPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brandMap, setBrandMap] = useState({});
  const scrollRefs = useRef({});

  useEffect(() => {
    document.title = "Deals & Offers | Sathya Store";
  }, []);

  // Fetch deals and category products
  useEffect(() => {
    let isMounted = true;

    async function loadDealsData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch category product settings and brands in parallel
        const [settingsRes, brandRes] = await Promise.allSettled([
          fetch("/api/categoryproduct/settings"),
          fetch("/api/brand"),
        ]);

        let bMap = {};
        if (brandRes.status === "fulfilled" && brandRes.value.ok) {
          const bData = await brandRes.value.json();
          if (bData?.data && Array.isArray(bData.data)) {
            bData.data.forEach((b) => {
              if (b?._id) bMap[b._id] = b.brand_name;
            });
          }
        }
        if (isMounted) setBrandMap(bMap);

        if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
          const result = await settingsRes.value.json();
          if (result?.ok && Array.isArray(result?.data)) {
            const rawSections = result.data.filter(
              (item) => item?.products && item.products.length > 0
            );

            // Group into organized sections according to SECTION_ORDER
            const organized = [];
            const processedItemIds = new Set();

            SECTION_ORDER.forEach((rule) => {
              const matchingItems = rawSections.filter((item) => {
                const sSlug = item.subcategoryId?.category_slug?.toLowerCase() || "";
                return rule.slugs.includes(sSlug);
              });

              if (matchingItems.length > 0) {
                // Combine products from matching items
                const combinedProducts = [];
                const seenProductIds = new Set();

                matchingItems.forEach((item) => {
                  processedItemIds.add(item._id);
                  (item.products || []).forEach((prod) => {
                    if (prod?._id && !seenProductIds.has(prod._id)) {
                      seenProductIds.add(prod._id);
                      combinedProducts.push(prod);
                    }
                  });
                });

                if (combinedProducts.length > 0) {
                  organized.push({
                    id: rule.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    title: rule.title,
                    viewAllHref: rule.viewAllHref,
                    products: combinedProducts,
                  });
                }
              }
            });

            // Add any remaining categories not covered by SECTION_ORDER
            rawSections.forEach((item) => {
              if (!processedItemIds.has(item._id) && item.products?.length > 0) {
                const catName = item.subcategoryId?.category_name || "SPECIAL DEALS";
                const catSlug = item.subcategoryId?.category_slug || "";
                organized.push({
                  id: item._id || catSlug,
                  title: catName.toUpperCase(),
                  viewAllHref: catSlug ? `/category/${catSlug}` : "/category/appliances",
                  products: item.products,
                });
              }
            });

            if (isMounted) {
              setSections(organized);
            }
          }
        }
      } catch (err) {
        console.error("Error loading deals offer page:", err);
        if (isMounted) setError("Failed to load deals. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDealsData();
    return () => {
      isMounted = false;
    };
  }, []);

  const scrollContainer = (id, direction) => {
    const el = scrollRefs.current[id];
    if (el) {
      const scrollAmount = Math.max(el.clientWidth * 0.75, 280);
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-800 pb-16">
      {/* Top Breadcrumb Header Bar */}
      <div className="bg-[#fdfdfd] border-b border-gray-200/90 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-gray-900 uppercase">
            GREAT DEALS - SHOP NOW
          </h1>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
            <Link href="/" className="hover:text-[#d72828] transition-colors">
              HOME
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-800">DEALS</span>
          </nav>
        </div>
      </div>

      {/* Main Deals Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-12">
        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-10 py-6">
            {[1, 2].map((n) => (
              <div key={n} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white animate-pulse"
                    >
                      <div className="h-40 bg-gray-100 rounded-lg" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-8 bg-gray-200 rounded mt-4" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-red-500 font-semibold mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#d72828] text-white font-bold rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sections.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg font-semibold">No active deals found at the moment.</p>
            <p className="text-sm mt-1">Please check back soon for great discounts!</p>
            <Link
              href="/"
              className="mt-6 inline-block bg-[#d72828] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-700 transition"
            >
              Return Home
            </Link>
          </div>
        )}

        {/* Deals Sections */}
        {!loading &&
          !error &&
          sections.map((section) => (
            <section key={section.id} className="relative group/section">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-2 mb-4 border-b border-gray-300">
                <h2 className="text-lg sm:text-xl font-bold tracking-wide text-[#d72828] uppercase">
                  {section.title}
                </h2>
                <Link
                  href={section.viewAllHref}
                  className="bg-[#d72828] hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs sm:text-sm px-5 py-2 uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow"
                >
                  VIEW ALL
                </Link>
              </div>

              {/* Slider Container with Red Round Navigation Buttons */}
              <div className="relative">
                {/* Left Arrow Button */}
                <button
                  type="button"
                  aria-label={`Previous ${section.title}`}
                  onClick={() => scrollContainer(section.id, "left")}
                  className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#d72828] text-white flex items-center justify-center shadow-lg hover:bg-red-700 active:scale-95 transition-all z-20 cursor-pointer border-2 border-white"
                >
                  <FiChevronLeft size={22} strokeWidth={2.5} />
                </button>

                {/* Right Arrow Button */}
                <button
                  type="button"
                  aria-label={`Next ${section.title}`}
                  onClick={() => scrollContainer(section.id, "right")}
                  className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#d72828] text-white flex items-center justify-center shadow-lg hover:bg-red-700 active:scale-95 transition-all z-20 cursor-pointer border-2 border-white"
                >
                  <FiChevronRight size={22} strokeWidth={2.5} />
                </button>

                {/* Scrollable Products Carousel */}
                <div
                  ref={(el) => (scrollRefs.current[section.id] = el)}
                  className="flex overflow-x-auto scrollbar-hide scroll-smooth gap-4 sm:gap-5 py-3 px-1"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {section.products.map((product) => (
                    <DealProductCard
                      key={product._id}
                      product={product}
                      brandMap={brandMap}
                    />
                  ))}
                </div>
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}

