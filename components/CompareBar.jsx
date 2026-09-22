// components/CompareBar.jsx
//
// Fixed floating bar at the bottom of the viewport showing the current
// compare list. Red Sathya theme. Hidden when list is empty.

'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompare, ArrowRight, Layers } from 'lucide-react';
import { useCompare } from '@/context/CompareContext';
import { trackCompareView } from '@/utils/compareHelpers';

const PRODUCT_IMG_BASE = 'https://www.sathya.store/img/product/';
const MAX_SLOTS = 4;
const BRAND_RED = '#d72828';

function getImageSrc(product) {
  if (!product) return null;
  const img = product.images?.[0] || '';
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${PRODUCT_IMG_BASE}${img.replace(/^\/?(?:uploads\/products\/)?/, '').replace(/^\/+/, '')}`;
}

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const router = useRouter();

  const handleCompareNow = useCallback(() => {
    const slug = compareList[0]?.category_slug || '';
    trackCompareView({ count: compareList.length, category_slug: slug });
    router.push('/compare');
  }, [compareList, router]);

  const emptySlots = Array.from({ length: Math.max(0, MAX_SLOTS - compareList.length) });

  const [isClosed, setIsClosed] = useState(false);

  // Re-open if the compare list changes (like adding a new product)
  useEffect(() => {
    setIsClosed(false);
  }, [compareList]);

  return (
    <AnimatePresence>
      {compareList.length > 0 && !isClosed && (
        <motion.div
          key="compare-bar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          role="region"
          aria-label="Compare Bar"
          className="fixed bottom-0 left-0 right-0 z-[9000] bg-white/97 backdrop-blur-md border-t border-gray-200 shadow-2xl"
        >
          {/* Red accent line at top */}
          <div className="h-0.5" style={{ background: `linear-gradient(to right, ${BRAND_RED}, #f87171, ${BRAND_RED})` }} />

          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">

            {/* Label */}
            <div className="flex items-center gap-2 shrink-0 mr-2">
              <Layers size={17} style={{ color: BRAND_RED }} />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide hidden sm:block">Compare</span>
              <span
                className="text-xs font-extrabold text-white px-2 py-0.5 rounded-full"
                style={{ background: BRAND_RED }}
              >
                {compareList.length} / {MAX_SLOTS}
              </span>
            </div>

            {/* Product Slots */}
            <div className="flex items-center gap-2.5 flex-1 overflow-x-auto scrollbar-hide">
              {compareList.map((item) => {
                const product = item.productData || {};
                const imgSrc = getImageSrc(product);
                return (
                  <div key={String(item.productId)} className="relative shrink-0 group">
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 bg-gray-50 flex items-center justify-center overflow-hidden transition-all"
                      style={{ borderColor: `${BRAND_RED}40` }}
                    >
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={product.name || 'Product'}
                          width={60}
                          height={60}
                          className="object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[9px] text-gray-400 text-center leading-tight px-1">
                          {product.name ? product.name.slice(0, 20) : '—'}
                        </span>
                      )}
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCompare(item.productId)}
                      aria-label={`Remove ${product.name || 'product'} from compare`}
                      tabIndex={0}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-sm"
                      style={{ width: 18, height: 18 }}
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                    {/* Name tooltip */}
                    <p className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-[9px] text-gray-500 text-center leading-tight whitespace-nowrap max-w-[70px] truncate pointer-events-none hidden sm:block">
                      {product.name ? product.name.slice(0, 18) : '—'}
                    </p>
                  </div>
                );
              })}


            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                onClick={() => setIsClosed(true)}
                aria-label="Hide compare bar"
                tabIndex={0}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium px-2 py-1 rounded hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={clearCompare}
                aria-label="Clear all compare items"
                tabIndex={0}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium px-2 py-1 rounded hover:bg-red-50"
              >
                Clear all
              </button>

              <button
                onClick={handleCompareNow}
                aria-label={`Compare ${compareList.length} products`}
                tabIndex={0}
                disabled={compareList.length < 2}
                className="inline-flex items-center gap-2 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: compareList.length >= 2 ? BRAND_RED : '#9ca3af' }}
              >
                <GitCompare size={15} />
                <span className="hidden sm:inline">Compare Now</span>
                <span className="sm:hidden">Compare</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
