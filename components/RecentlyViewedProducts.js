'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar } from 'react-icons/fa';
import AddToWishlistButton from '@/components/ProductCard';
import ProductAddtoCart from '@/components/AddToCart';

// ─── Header Sub-Component ──────────────────────────────────────────────────
const RecentlyViewedHeader = () => {
  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-lg sm:text-xl font-extrabold text-[#d72828] tracking-tight">
        Recently Viewed
      </h3>
    </div>
  );
};

// ─── Skeleton Sub-Component ────────────────────────────────────────────────
const RecentlyViewedSkeleton = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-[16px] overflow-hidden flex flex-col h-full shadow-2xs animate-pulse">
      <div className="relative h-[150px] sm:h-[170px] w-full bg-gray-100/70 flex items-center justify-center p-3">
        <div className="w-14 h-14 rounded-xl bg-gray-200/70"></div>
        <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-gray-200/70 rounded-full"></div>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2 bg-white">
        <div className="h-2.5 w-14 bg-gray-200/70 rounded"></div>
        <div className="space-y-1.5 my-1">
          <div className="h-3.5 bg-gray-200/80 rounded w-full"></div>
          <div className="h-3.5 bg-gray-200/80 rounded w-2/3"></div>
        </div>
        <div className="h-3 w-16 bg-gray-100 rounded"></div>
        <div className="flex items-center justify-between mt-auto pt-1.5">
          <div className="h-4 bg-gray-200/80 rounded w-20"></div>
          <div className="h-3 bg-gray-100 rounded w-10"></div>
        </div>
        <div className="mt-2 h-8 bg-gray-200/70 rounded-xl w-full"></div>
      </div>
    </div>
  );
};

import ProductCard from '@/components/product/ProductCard';
import { normalizeProduct } from '@/lib/normalizeProduct';

// ─── Product Card Sub-Component (Uses Shared Uniform ProductCard) ───────────
const RecentlyViewedCard = ({ product, brandMap = {}, onProductClick }) => {
  if (!product) return null;
  return (
    <ProductCard
      product={normalizeProduct(product, brandMap)}
      onProductClick={onProductClick}
    />
  );
};

// ─── Main RecentlyViewedProducts Component ─────────────────────────────────
const RecentlyViewedProducts = ({ products: initialProducts }) => {
  const [recentProducts, setRecentProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(true);
  const [brandMap, setBrandMap] = useState({});

  useEffect(() => {
    const fetchBrand = async () => {
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
        console.error('Error fetching brand map:', error);
      }
    };

    fetchBrand();
  }, []);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setRecentProducts(initialProducts);
      setLoading(false);
      return;
    }

    const loadRecentlyViewed = () => {
      try {
        setLoading(true);
        const storedString = localStorage.getItem('recentlyViewed');
        let stored = [];
        try {
          stored = JSON.parse(storedString) || [];
        } catch {
          stored = [];
        }

        if (!Array.isArray(stored)) {
          stored = [];
        }

        const validProducts = stored.filter(
          (product) => product && product._id
        );

        setRecentProducts(validProducts);
      } catch (error) {
        console.error('Error reading recently viewed from localStorage:', error);
        setRecentProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentlyViewed();
  }, [initialProducts]);

  const handleProductClick = (product) => {
    try {
      const storedString = localStorage.getItem('recentlyViewed');
      let stored = [];
      try {
        stored = JSON.parse(storedString) || [];
      } catch {
        stored = [];
      }
      const updated = [product, ...stored.filter((p) => p._id !== product._id)].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    } catch (e) {
      console.error('Error updating recentlyViewed localStorage:', e);
    }
  };

  if (loading) {
    return (
      <section aria-label="Recently Viewed Products" className="w-full my-8 sm:my-10 px-4 sm:px-6">
        <div className="bg-white rounded-[24px] border border-gray-100 p-4 sm:p-6 shadow-2xs">
          <RecentlyViewedHeader />
          <div
            className="flex gap-4 overflow-x-auto scrollbar-none py-1"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-[0_0_68%] sm:flex-[0_0_calc((100%-16px)/2)] md:flex-[0_0_calc((100%-32px)/3)] lg:flex-[0_0_calc((100%-48px)/4)] xl:flex-[0_0_calc((100%-64px)/5)]"
              >
                <RecentlyViewedSkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!recentProducts || recentProducts.length === 0) {
    return null;
  }

  if (recentProducts.length === 1) {
    return (
      <section aria-label="Recently Viewed Products" className="w-full my-8 sm:my-10 px-4 sm:px-6">
        <div className="bg-white rounded-[24px] border border-gray-100 p-4 sm:p-6 shadow-2xs">
          <RecentlyViewedHeader />
          <div className="w-full max-w-[240px] sm:max-w-[260px]">
            <RecentlyViewedCard
              product={recentProducts[0]}
              brandMap={brandMap}
              onProductClick={handleProductClick}
            />
          </div>
        </div>
      </section>
    );
  }

  if (recentProducts.length === 2) {
    return (
      <section aria-label="Recently Viewed Products" className="w-full my-8 sm:my-10 px-4 sm:px-6">
        <div className="bg-white rounded-[24px] border border-gray-100 p-4 sm:p-6 shadow-2xs">
          <RecentlyViewedHeader />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[500px] sm:max-w-[540px]">
            {recentProducts.map((product) => (
              <RecentlyViewedCard
                key={product._id}
                product={product}
                brandMap={brandMap}
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Recently Viewed Products" className="w-full my-8 sm:my-10 px-4 sm:px-6">
      <div className="bg-white rounded-[24px] border border-gray-100 p-4 sm:p-6 shadow-2xs">
        <RecentlyViewedHeader />
        <div className="relative w-full">
          <div
            className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth py-1 px-0.5"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {recentProducts.map((product) => (
              <div
                key={product._id}
                className="flex-[0_0_68%] sm:flex-[0_0_calc((100%-16px)/2)] md:flex-[0_0_calc((100%-32px)/3)] lg:flex-[0_0_calc((100%-48px)/4)] xl:flex-[0_0_calc((100%-64px)/5)] snap-start"
              >
                <RecentlyViewedCard
                  product={product}
                  brandMap={brandMap}
                  onProductClick={handleProductClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedProducts;
