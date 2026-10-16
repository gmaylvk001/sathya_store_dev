'use client';

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES, isValidCatalogReferrer } from '@/constants/routes';

/**
 * CartHeader Component
 *
 * Isolated cart header with safe, responsive navigation for the "Add more items" link.
 * Implements a semantic Next.js Link with deterministic fallback to ROUTES.HOME,
 * while safely routing back if referrer is within the verified catalog.
 */
export default function CartHeader({
  totalItems = 0,
  onAddMore = null,
  className = '',
}) {
  const router = useRouter();

  const handleAddMoreItems = useCallback(
    (e) => {
      // Allow standard modifier keys (Ctrl+click, Cmd+click, Shift+click) to open in new tab natively
      if (e?.metaKey || e?.ctrlKey || e?.shiftKey || e?.altKey) {
        return;
      }

      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }

      // If custom navigation handler is provided, delegate strictly without mutating cart state
      if (typeof onAddMore === 'function') {
        try {
          onAddMore(e);
          return;
        } catch (customErr) {
          console.warn('[CartHeader] Custom onAddMore error, falling back:', customErr);
        }
      }

      // Check if router history contains a valid referrer within the same domain catalog
      try {
        if (typeof window !== 'undefined') {
          const referrer = document.referrer;
          const currentOrigin = window.location.origin;

          if (
            referrer &&
            isValidCatalogReferrer(referrer, currentOrigin) &&
            !referrer.includes('/cart')
          ) {
            if (window.history.length > 1) {
              router.back();
              // Safety fallback: if router.back() didn't leave /cart within 150ms, force push to referrer or home
              setTimeout(() => {
                if (typeof window !== 'undefined' && window.location.pathname.includes('/cart')) {
                  try {
                    const parsedUrl = new URL(referrer, currentOrigin);
                    router.push(parsedUrl.pathname + parsedUrl.search);
                  } catch {
                    router.push(ROUTES.HOME);
                  }
                }
              }, 150);
              return;
            }
            try {
              const parsedUrl = new URL(referrer, currentOrigin);
              router.push(parsedUrl.pathname + parsedUrl.search);
              return;
            } catch {
              // fallback to ROUTES.HOME
            }
          }
        }
      } catch (routingErr) {
        console.warn('[CartHeader] Referrer check error, fallback engaged:', routingErr);
      }

      // Reliable deterministic navigation to ROUTES.HOME
      try {
        if (router && typeof router.push === 'function') {
          router.push(ROUTES.HOME);
          return;
        }
      } catch (pushErr) {
        console.warn('[CartHeader] router.push failed, using location.href fallback:', pushErr);
      }

      if (typeof window !== 'undefined') {
        window.location.href = ROUTES.HOME;
      }
    },
    [router, onAddMore]
  );

  const itemCount = typeof totalItems === 'number' && totalItems >= 0 ? totalItems : 0;
  const itemLabel = itemCount === 1 ? 'item' : 'items';

  return (
    <div
      className={`flex items-center justify-between bg-white px-5 py-4 rounded-xl border border-gray-200/80 shadow-2xs ${className}`}
    >
      <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
        <span>Shopping Cart</span>
        <span
          data-testid="cart-header-count"
          className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full"
        >
          {itemCount} {itemLabel}
        </span>
      </h1>

      <Link
        href={ROUTES.HOME}
        onClick={handleAddMoreItems}
        aria-label="Add more items to cart"
        className="text-xs sm:text-sm font-semibold text-[#d72828] hover:text-[#b91c1c] active:text-[#991b1b] transition-colors flex items-center gap-1 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
      >
        <span>Add more items</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  );
}

CartHeader.propTypes = {
  totalItems: PropTypes.number,
  onAddMore: PropTypes.func,
  className: PropTypes.string,
};
