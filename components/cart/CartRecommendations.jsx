'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import ErrorBoundary from '@/components/common/ErrorBoundary';

/**
 * Inner recommendations carousel component
 */
function CartRecommendationsInner({
  cartItems = [],
  cartItemIds = [],
  categoryIds = [],
  onItemAdded = null,
  className = '',
  timeoutMs = 4000,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);

  const { updateCartCount } = useCart();

  // Extract memoized ID string and categories for stable dependency tracking
  const resolvedCartItemIds = useMemo(() => {
    if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
      return cartItemIds.filter(Boolean).map(String).join(',');
    }
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      return cartItems
        .map((item) => item?.productId || item?._id || '')
        .filter(Boolean)
        .map(String)
        .join(',');
    }
    return '';
  }, [cartItems, cartItemIds]);

  const resolvedCategoryIds = useMemo(() => {
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      return categoryIds.filter(Boolean).map(String).join(',');
    }
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      return [
        ...new Set(
          cartItems
            .map((item) => (typeof item?.category === 'object' ? item?.category?._id : item?.category))
            .filter(Boolean)
            .map(String)
        ),
      ].join(',');
    }
    return '';
  }, [cartItems, categoryIds]);

  // Fetch cross-sell recommendations with strict failsafe & timeout handling
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    const timerId = setTimeout(() => {
      try {
        controller.abort();
      } catch {}
    }, timeoutMs);

    const fetchRecommendations = async () => {
      // If cart is empty, do not show recommendations
      if (!resolvedCartItemIds && !resolvedCategoryIds) {
        if (!isCancelled) {
          setProducts([]);
          setLoading(false);
        }
        clearTimeout(timerId);
        return;
      }

      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (resolvedCartItemIds) {
          params.set('cartItemIds', resolvedCartItemIds);
        }
        if (resolvedCategoryIds) {
          params.set('category', resolvedCategoryIds);
        }
        params.set('limit', '10');

        const response = await fetch(`/api/product/related?${params.toString()}`, {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!response.ok) {
          throw new Error(`API error ${response.status}`);
        }

        const data = await response.json();

        if (!isCancelled) {
          if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
            // Exclude any item that is already in the cart
            const cartIdsArray = resolvedCartItemIds.split(',').filter(Boolean);
            const filtered = data.products.filter(
              (p) => !cartIdsArray.includes(String(p._id || p.id))
            );
            setProducts(filtered);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        // Strict graceful degradation: render null without throwing or breaking layout
        if (!isCancelled) {
          setProducts([]);
        }
      } finally {
        clearTimeout(timerId);
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      isCancelled = true;
      clearTimeout(timerId);
      try {
        controller.abort();
      } catch {}
    };
  }, [resolvedCartItemIds, resolvedCategoryIds, timeoutMs]);

  // Carousel scroll calculation
  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [products, updateScrollState]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const step = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: direction * step, behavior: 'smooth' });
      setTimeout(updateScrollState, 350);
    }
  };

  // Independent Add-To-Cart without full-page reloads or checkout disruption
  const handleAddToCart = async (product) => {
    const prodId = product._id || product.id;
    if (!prodId || addingId) return;

    try {
      setAddingId(prodId);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      let guestCartId = null;
      if (!token && typeof window !== 'undefined') {
        guestCartId = localStorage.getItem('guestCartId') || uuidv4();
        localStorage.setItem('guestCartId', guestCartId);
      }

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(guestCartId && { guestCartId }),
        },
        body: JSON.stringify({
          productId: prodId,
          quantity: 1,
          guestCartId: guestCartId || undefined,
        }),
      });

      if (res.status === 409) {
        toast.error('Stock limit reached for this item');
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to add item to cart');
      }

      const data = await res.json();

      // Update central cart count state
      if (typeof updateCartCount === 'function') {
        const newTotal = data?.cart?.totalItems != null ? data.cart.totalItems : undefined;
        if (newTotal !== undefined) {
          updateCartCount(newTotal);
        }
      }

      // Dispatch global event for non-react or decentralized listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('cartUpdated', {
            detail: { productId: prodId, product, cart: data?.cart },
          })
        );
      }

      // Trigger parent callback (e.g., silent background cart refetch)
      if (typeof onItemAdded === 'function') {
        onItemAdded(product);
      }

      toast.success(`${product.name || 'Product'} added to cart!`);
    } catch (err) {
      console.warn('[CartRecommendations] Add to cart error:', err);
      toast.error(err.message || 'Could not add to cart');
    } finally {
      setAddingId(null);
    }
  };

  // Zero CLS requirement: do NOT show premature skeletons if availability is uncertain
  // If loading or empty, render strictly null (zero visual footprint)
  if (loading || !products || products.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Related Products"
      className={`bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs transition-all duration-300 ${className}`}
    >
      {/* Header & Controls */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Related Products
            </h2>
            <span className="hidden sm:inline-block text-[11px] font-semibold text-[#d72828] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
              You may also like
            </span>
          </div>
          <p className="text-xs text-gray-400 font-normal mt-0.5">
            Similar and complementary items recommended for your cart
          </p>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => handleScroll(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleScroll(1)}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 px-0.5"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {products.map((product) => {
          const prodId = product._id || product.id;
          const originalPrice = product.price || product.mrp || 0;
          const specialPrice =
            product.special_price > 0 && product.special_price < originalPrice
              ? product.special_price
              : originalPrice;
          const hasDiscount = originalPrice > specialPrice && specialPrice > 0;
          const discountPercent = hasDiscount
            ? Math.round(((originalPrice - specialPrice) / originalPrice) * 100)
            : 0;

          const imageSrc = product.images?.[0]
            ? product.images[0].startsWith('http')
              ? product.images[0]
              : `/uploads/products/${product.images[0]}`
            : '/uploads/sathyalogo.webp';

          const productLink = `/product/${product.slug || prodId}`;
          const isAdding = addingId === prodId;

          return (
            <div
              key={prodId}
              className="flex-[0_0_calc((100%-12px)/2)] sm:flex-[0_0_calc((100%-16px)/2)] md:flex-[0_0_calc((100%-32px)/3)] xl:flex-[0_0_calc((100%-48px)/4)] snap-start min-w-0 bg-white border border-gray-200/70 hover:border-red-200 hover:shadow-xs rounded-xl p-3 flex flex-col gap-2.5 transition-all duration-200 group"
            >
              {/* Product Image */}
              <Link
                href={productLink}
                className="w-full h-32 sm:h-36 bg-gray-50/50 rounded-lg p-2 flex items-center justify-center relative overflow-hidden group/img"
              >
                <img
                  src={imageSrc}
                  alt={product.name || 'Product'}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover/img:scale-105"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/uploads/sathyalogo.webp';
                  }}
                  loading="lazy"
                />
                {hasDiscount && (
                  <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </Link>

              {/* Product Info */}
              <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
                <Link href={productLink} className="block group/title">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover/title:text-[#d72828] transition-colors min-h-[34px]">
                    {product.name}
                  </h3>
                </Link>

                {/* In Stock Badge */}
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-medium text-emerald-600">In Stock</span>
                </div>

                {/* Price Row */}
                <div className="flex items-baseline gap-1.5 flex-wrap pt-0.5">
                  <span className="text-sm sm:text-base font-extrabold text-gray-900">
                    ₹{Number(specialPrice).toLocaleString('en-IN')}
                  </span>
                  {hasDiscount && (
                    <s className="text-xs text-gray-400 line-through">
                      ₹{Number(originalPrice).toLocaleString('en-IN')}
                    </s>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={() => handleAddToCart(product)}
                disabled={isAdding}
                aria-label={`Add ${product.name} to cart`}
                className="w-full mt-auto py-2 px-3 bg-red-50 hover:bg-[#d72828] text-[#d72828] hover:text-white border border-red-200 hover:border-[#d72828] rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-2xs"
              >
                {isAdding ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

CartRecommendationsInner.propTypes = {
  cartItems: PropTypes.array,
  cartItemIds: PropTypes.array,
  categoryIds: PropTypes.array,
  onItemAdded: PropTypes.func,
  className: PropTypes.string,
  timeoutMs: PropTypes.number,
};

/**
 * Public CartRecommendations Component wrapped in ErrorBoundary
 */
export default function CartRecommendations(props) {
  return (
    <ErrorBoundary fallback={null}>
      <CartRecommendationsInner {...props} />
    </ErrorBoundary>
  );
}
