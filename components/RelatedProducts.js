'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar } from 'react-icons/fa';
import SharedProductCard from '@/components/product/ProductCard';
import { normalizeProduct } from '@/lib/normalizeProduct';

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
                  <SharedProductCard product={normalizeProduct(product, brandMap)} />
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
