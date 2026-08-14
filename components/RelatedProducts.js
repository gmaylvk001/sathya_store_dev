'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaWhatsapp, FaStar } from 'react-icons/fa';
import AddToWishlistButton from '@/components/ProductCard';
import ProductAddtoCart from '@/components/AddToCart';

// ─── Carousel Controls Sub-Component ──────────────────────────────────────
const CarouselControls = ({ onViewAll }) => {
  return (
    <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
      <div>
        <div className="flex items-baseline gap-2.5">
          <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
            Related Products
          </h3>
          <span className="text-xs sm:text-sm font-medium text-gray-500 hidden xs:inline-block">
            You may also like
          </span>
        </div>
        <p className="text-xs font-medium text-gray-500 xs:hidden mt-0.5">
          You may also like
        </p>
      </div>

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#d72828] hover:text-red-700 transition-colors inline-flex items-center gap-1"
        >
          View All
          <span className="text-[10px] font-bold">›</span>
        </button>
      )}
    </div>
  );
};

// ─── Product Card Skeleton Sub-Component ──────────────────────────────────
const ProductCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-[16px] overflow-hidden flex flex-col h-full shadow-xs animate-pulse">
      <div className="relative h-[190px] sm:h-[210px] w-full bg-gray-100 flex items-center justify-center p-4">
        <div className="w-16 h-16 rounded-xl bg-gray-200/70"></div>
        <div className="absolute top-2.5 left-2.5 w-10 h-4 bg-gray-200/70 rounded-full"></div>
        <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-gray-200/70 rounded-full"></div>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2 bg-white">
        <div className="h-2.5 w-16 bg-gray-200/70 rounded"></div>
        <div className="space-y-1.5 my-1">
          <div className="h-3.5 bg-gray-200/80 rounded w-full"></div>
          <div className="h-3.5 bg-gray-200/80 rounded w-3/4"></div>
        </div>
        <div className="h-3 w-20 bg-gray-100 rounded"></div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="h-5 bg-gray-200/80 rounded w-24"></div>
          <div className="h-3 bg-gray-100 rounded w-12"></div>
        </div>
        <div className="mt-2 h-9 bg-gray-200/70 rounded-xl w-full"></div>
      </div>
    </div>
  );
};

// ─── Related Product Card Sub-Component ────────────────────────────────────
const RelatedProductCard = ({ product, brandMap = {} }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!product) return null;

  const hasDiscount =
    Number(product.special_price) > 0 &&
    Number(product.special_price) < Number(product.price);

  const discountPercent = hasDiscount
    ? Math.round(100 - (Number(product.special_price) / Number(product.price)) * 100)
    : 0;

  const currentPrice = hasDiscount ? product.special_price : product.price || 0;
  const originalPrice = product.price || 0;

  const brandName = brandMap[product.brand] || product.brand_name || '';

  const inStock = product.stock_status === 'In Stock' && Number(product.quantity) > 0;

  const ratingValue = Number(product.avgRating || product.rating || product.average_rating || 0);
  const reviewCount = Number(product.reviewCount || product.reviews_count || product.numReviews || 0);

  const imgSrc =
    product.images?.[0]
      ? product.images[0].startsWith('http')
        ? product.images[0]
        : `/uploads/products/${product.images[0]}`
      : '/uploads/products/placeholder.jpg';

  const productUrl = `/product/${product.slug || product._id}`;

  return (
    <div className="group relative bg-white rounded-[16px] border border-gray-200/70 hover:border-gray-300 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden w-full select-none">
      <div className="relative h-[180px] sm:h-[200px] w-full bg-gray-50/50 flex items-center justify-center p-3 overflow-hidden">
        {hasDiscount && (
          <span className="absolute top-2.5 left-2.5 z-10 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs tracking-wide">
            -{discountPercent}%
          </span>
        )}

        <div className="absolute top-2.5 right-2.5 z-10">
          <AddToWishlistButton
            productId={product._id}
            iconSize={15}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-xs border border-gray-100 flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all text-gray-600 hover:text-rose-600"
          />
        </div>

        <Link href={productUrl} className="relative w-full h-full flex items-center justify-center">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gray-100/60 animate-pulse rounded-lg" />
          )}
          <Image
            src={imgSrc}
            alt={product.name || 'Product Image'}
            fill
            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 20vw"
            className={`object-contain p-2 group-hover:scale-105 transition-transform duration-300 ease-out ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              setImgLoaded(true);
              if (e?.currentTarget) {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/uploads/products/placeholder.jpg";
              }
            }}
            unoptimized
          />
        </Link>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1 bg-white">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate mb-1 block">
          {brandName || 'SATHYA'}
        </span>

        <Link href={productUrl} className="block mb-2">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#d72828] transition-colors leading-snug line-clamp-2 h-[2.5rem]">
            {product.name}
          </h4>
        </Link>

        <div className="flex items-center gap-1.5 mb-2 h-4">
          {ratingValue > 0 ? (
            <>
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                <FaStar className="text-amber-500 text-[10px]" />
                <span>{ratingValue.toFixed(1)}</span>
              </div>
              {reviewCount > 0 && (
                <span className="text-[11px] text-gray-400 font-medium">({reviewCount})</span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
              <FaStar className="text-gray-300 text-[10px]" />
              <span>4.5</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline flex-wrap gap-1.5 mb-1.5">
          <span className="text-sm sm:text-base font-extrabold text-[#d72828] tracking-tight">
            ₹{Number(currentPrice).toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through font-normal">
              ₹{Number(originalPrice).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="mb-3">
          {inStock ? (
            <span className="text-[11px] font-semibold text-emerald-600 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              In Stock
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-rose-500 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Out of Stock
            </span>
          )}
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <ProductAddtoCart
            productId={product._id}
            stockQuantity={product.quantity}
            special_price={product.special_price}
            className="w-full text-xs font-bold py-2 rounded-xl transition-all shadow-2xs"
            movement={product.movement}
            productName={product.name}
            productSlug={product.slug}
          />

          <a
            href={`https://wa.me/919842344323?text=${encodeURIComponent(
              `Hi Sathya Stores, I'm interested in: ${product.name}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-200 flex items-center justify-center flex-shrink-0 border border-emerald-200/60 shadow-2xs"
            title="Enquire on WhatsApp"
            aria-label="Enquire on WhatsApp"
          >
            <FaWhatsapp size={17} />
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Main RelatedProducts Component ─────────────────────────────────────────
const RelatedProducts = ({ relatedProducts = [], currentProductId, categoryId, onViewAll }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brandMap, setBrandMap] = useState({});

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brand');
      const result = await response.json();
      if (!result.error && Array.isArray(result.data)) {
        const map = {};
        result.data.forEach((b) => {
          map[b._id] = b.brand_name;
        });
        setBrandMap(map);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);

      if (Array.isArray(relatedProducts) && relatedProducts.length > 0) {
        const isFullObjects = typeof relatedProducts[0] === 'object' && relatedProducts[0]?.name;

        if (isFullObjects) {
          setProducts(relatedProducts);
          setLoading(false);
          return;
        }

        const ids = relatedProducts
          .map((item) => (typeof item === 'object' ? item._id : item))
          .filter(Boolean)
          .join(',');

        if (ids) {
          const res = await fetch(`/api/product/related?ids=${ids}`);
          const data = await res.json();
          if (res.ok && data.success) {
            setProducts(data.products || []);
          } else {
            setProducts([]);
          }
          setLoading(false);
          return;
        }
      }

      if (categoryId) {
        const res = await fetch(
          `/api/product/related?category=${categoryId}&exclude=${currentProductId || ''}&limit=10`
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setProducts(data.products || []);
        } else {
          setProducts([]);
        }
        setLoading(false);
        return;
      }

      setProducts([]);
    } catch (error) {
      console.error('Error fetching related products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatedProducts();
  }, [relatedProducts, currentProductId, categoryId]);

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section aria-label="Related Products" className="w-full my-8 sm:my-10 px-4 max-w-[1440px] mx-auto">
      <div className="bg-white rounded-[24px] border border-gray-100 p-4 sm:p-6 shadow-xs">
        <CarouselControls onViewAll={onViewAll} />

        <div className="relative w-full">
          <div
            className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth py-1 px-0.5"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-[0_0_68%] sm:flex-[0_0_calc((100%-16px)/2)] md:flex-[0_0_calc((100%-32px)/3)] lg:flex-[0_0_calc((100%-48px)/4)] xl:flex-[0_0_calc((100%-64px)/5)] snap-start"
                >
                  <ProductCardSkeleton />
                </div>
              ))
            ) : (
              products.map((product) => (
                <div
                  key={product._id}
                  className="flex-[0_0_68%] sm:flex-[0_0_calc((100%-16px)/2)] md:flex-[0_0_calc((100%-32px)/3)] lg:flex-[0_0_calc((100%-48px)/4)] xl:flex-[0_0_calc((100%-64px)/5)] snap-start"
                >
                  <RelatedProductCard product={product} brandMap={brandMap} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;
