// components/CompareTable.jsx
//
// Side-by-side product comparison table — full details, red Sathya theme.
//
// Sections shown per product:
//   1. Product card header (image, name, price, MRP, discount %, rating, Buy Now)
//   2. Key Features   — from product.key_features (array of strings)
//   3. Technical Specs — from normalizeAttributes (key_specifications + filter)
//
// Best-value highlighting: green badge on the winning cell per row.
// Lower-is-better keys: price, weight, power, watt, noise.
// All other numeric keys: higher is better.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, CheckCircle2, XCircle, ShoppingCart, Zap, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { useCompare } from '@/context/CompareContext';
import { normalizeAttributes, parseNumericValue } from '@/utils/compareHelpers';

const PRODUCT_IMG_BASE = 'https://www.sathya.store/img/product/';
const BRAND_RED = '#d72828';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getImageSrc(product) {
  const img = product?.images?.[0] || '';
  if (!img) return '/uploads/products/placeholder.jpg';
  if (img.startsWith('http')) return img;
  return `${PRODUCT_IMG_BASE}${img.replace(/^\/?(?:uploads\/products\/)?/, '').replace(/^\/+/, '')}`;
}

function getPrice(product) {
  if (!product) return null;
  const special = Number(product.special_price);
  const regular = Number(product.price);
  return special > 0 && special < regular ? special : regular;
}

function getMRP(product) {
  if (!product) return null;
  return Number(product.price) || null;
}

function getDiscount(product) {
  const sp = Number(product?.special_price);
  const mp = Number(product?.price);
  if (!sp || !mp || sp >= mp) return null;
  return Math.round(((mp - sp) / mp) * 100);
}

function getRating(product) {
  return product ? Number(product.avgRating || product.rating || 0) : 0;
}

function findBestIndex(values, key) {
  const nums = values.map(parseNumericValue);
  if (nums.every((v) => v === null)) return null;
  const lowerIsBetter = /price|cost|weight|watt|power|noise|consum/i.test(key);
  let bestIdx = null;
  let bestVal = lowerIsBetter ? Infinity : -Infinity;
  nums.forEach((v, i) => {
    if (v === null) return;
    if (lowerIsBetter ? v < bestVal : v > bestVal) { bestVal = v; bestIdx = i; }
  });
  return bestIdx;
}

// ── Star Rating Display ───────────────────────────────────────────────────────

function StarDisplay({ rating, count }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => {
        let fill = '#e5e7eb';
        if (i <= full) fill = '#f59e0b';
        else if (i === full + 1 && half) fill = '#f59e0b';
        return (
          <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={fill} stroke="none">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        );
      })}
      <span className="text-xs font-bold text-amber-600 ml-1">{rating > 0 ? rating.toFixed(1) : '—'}</span>
      {count > 0 && <span className="text-xs text-gray-400 ml-0.5">({count})</span>}
    </span>
  );
}

// ── Product Header Card ───────────────────────────────────────────────────────

function ProductHeaderCard({ item, onRemove, colIdx }) {
  const p = item.productData;
  const price = getPrice(p);
  const mrp = getMRP(p);
  const disc = getDiscount(p);
  const rating = getRating(p);
  const reviewCount = p?.reviewCount || p?.review_count || 0;

  return (
    <div className="flex flex-col items-center gap-2 pb-3 relative min-h-[260px]">
      {/* Remove button */}
      <button
        onClick={() => onRemove(item.productId)}
        aria-label={`Remove ${p?.name || 'product'} from compare`}
        className="absolute top-0 right-0 w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-500 hover:text-red-700 flex items-center justify-center transition-all z-10"
      >
        <X size={12} strokeWidth={2.5} />
      </button>

      {p ? (
        <>
          {/* Discount badge */}
          {disc && (
            <div
              className="absolute top-0 left-0 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-tr-none rounded-br-lg rounded-bl-none rounded-tl-sm"
              style={{ background: BRAND_RED }}
            >
              -{disc}% OFF
            </div>
          )}

          {/* Image */}
          <Link href={`/product/${p.slug || p._id}`} className="block mt-4">
            <div className="w-28 h-28 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 hover:border-red-200 transition-all shadow-sm">
              <Image
                src={getImageSrc(p)}
                alt={p.name || 'Product'}
                width={100}
                height={100}
                className="object-contain p-2"
                unoptimized
              />
            </div>
          </Link>

          {/* Brand */}
          {p.brand_name && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{p.brand_name}</span>
          )}

          {/* Name */}
          <Link
            href={`/product/${p.slug || p._id}`}
            className="text-xs font-bold text-gray-800 hover:text-red-600 line-clamp-3 text-center leading-snug transition-colors px-1"
          >
            {p.name}
          </Link>

          {/* Price */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-extrabold" style={{ color: BRAND_RED }}>
              &#8377;{Number(price).toLocaleString('en-IN')}
            </span>
            {mrp && mrp > price && (
              <span className="text-xs text-gray-400 line-through">
                &#8377;{Number(mrp).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Rating */}
          <StarDisplay rating={rating} count={reviewCount} />

          {/* Buy Now */}
          <Link
            href={`/product/${p.slug || p._id}`}
            className="w-full text-center text-xs font-bold text-white py-2 rounded-lg transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-1.5 mt-auto"
            style={{ background: BRAND_RED }}
          >
            <ShoppingCart size={11} />
            Buy Now
          </Link>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 mt-6">
          <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center">
            <XCircle size={32} className="text-gray-300" />
          </div>
          <span className="text-xs text-gray-400 italic text-center">Product no longer available</span>
        </div>
      )}
    </div>
  );
}

// ── Desktop Table ─────────────────────────────────────────────────────────────

function DesktopTable({ products, rows }) {
  const { removeFromCompare } = useCompare();
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  const visibleRows = showAllSpecs ? rows : rows.slice(0, 15);
  const numCols = products.length;
  const colTemplate = `220px repeat(${numCols}, 1fr)`;

  return (
    <div className="hidden md:block">
      {/* ── Sticky Product Headers ── */}
      <div
        className="sticky top-0 z-30 grid border-b-2 shadow-md bg-white"
        style={{ gridTemplateColumns: colTemplate, borderBottomColor: BRAND_RED }}
      >
        <div className="px-5 py-5 flex items-end">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: BRAND_RED }} />
            <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Compare</span>
          </div>
        </div>
        {products.map((item, colIdx) => (
          <div key={colIdx} className="px-4 py-3 border-l border-gray-100">
            <ProductHeaderCard item={item} onRemove={removeFromCompare} colIdx={colIdx} />
          </div>
        ))}
      </div>

      {/* ── Key Features Section ── */}
      {products.some(item => item.productData?.product_highlights?.length > 0) && (
        <>
          {/* Section label */}
          <div className="px-5 py-2.5 flex items-center gap-2" style={{ background: `${BRAND_RED}10` }}>
            <Zap size={13} style={{ color: BRAND_RED }} />
            <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: BRAND_RED }}>
              Key Features
            </span>
          </div>

          <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: colTemplate }}>
            <div className="px-5 py-4 border-r border-gray-100 bg-gray-50/70 flex items-start">
              <span className="text-xs font-semibold text-gray-500">Highlights</span>
            </div>
            {products.map((item, colIdx) => {
              const p = item.productData;
              const features = p?.product_highlights || [];
              return (
                <div key={colIdx} className="px-4 py-4 border-l border-gray-100 bg-white">
                  {features.length > 0 ? (
                    <ul className="space-y-1.5">
                      {features.slice(0, 6).map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-[11px] text-gray-700 leading-snug">
                          <CheckCircle2 size={10} className="shrink-0 mt-0.5" style={{ color: BRAND_RED }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Technical Specifications ── */}
      {rows.length > 0 && (
        <>
          <div className="px-5 py-2.5 flex items-center gap-2" style={{ background: `${BRAND_RED}10` }}>
            <Award size={13} style={{ color: BRAND_RED }} />
            <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: BRAND_RED }}>
              Technical Specifications
            </span>
          </div>

          {visibleRows.map(({ key, values }, rowIdx) => {
            const bestIdx = findBestIndex(values, key);
            const isEven = rowIdx % 2 === 0;
            return (
              <div
                key={rowIdx}
                className="grid border-b border-gray-50 hover:bg-red-50/20 transition-colors group"
                style={{ gridTemplateColumns: colTemplate }}
              >
                <div className={`px-5 py-3 flex items-center border-r border-gray-100 ${isEven ? 'bg-gray-50/60' : 'bg-white'}`}>
                  <span className="text-xs font-semibold text-gray-600">{key}</span>
                </div>
                {values.map((val, colIdx) => {
                  const isBest = bestIdx === colIdx && val !== null;
                  return (
                    <div
                      key={colIdx}
                      className={`px-4 py-3 flex items-center justify-center border-l border-gray-100 ${
                        isBest ? 'bg-green-50/70' : isEven ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      {val !== null ? (
                        <span className={`text-xs text-center leading-snug ${isBest ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                          {isBest && <CheckCircle2 size={10} className="inline mr-1 text-green-500" />}
                          {val}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {rows.length > 15 && (
            <div className="flex justify-center py-4 border-b border-gray-100 bg-white">
              <button
                onClick={() => setShowAllSpecs(v => !v)}
                className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full border-2 transition-all hover:bg-red-50"
                style={{ color: BRAND_RED, borderColor: BRAND_RED }}
              >
                {showAllSpecs ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show All {rows.length} Specifications</>}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Customer Rating Row ── */}
      <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: colTemplate }}>
        <div className="px-5 py-4 border-r border-gray-100 bg-gray-50/60 flex items-center">
          <span className="text-xs font-semibold text-gray-600">Customer Rating</span>
        </div>
        {products.map((item, colIdx) => {
          const p = item.productData;
          const rating = getRating(p);
          const reviewCount = p?.reviewCount || p?.review_count || 0;
          return (
            <div key={colIdx} className="px-4 py-4 flex items-center justify-center border-l border-gray-100 bg-white">
              {rating > 0 ? <StarDisplay rating={rating} count={reviewCount} /> : <span className="text-gray-300">—</span>}
            </div>
          );
        })}
      </div>

      {/* ── Bottom CTA Row ── */}
      <div className="grid" style={{ gridTemplateColumns: colTemplate, background: `${BRAND_RED}06` }}>
        <div className="px-5 py-5 border-r border-gray-100 flex items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quick Actions</span>
        </div>
        {products.map((item, colIdx) => {
          const p = item.productData;
          return (
            <div key={colIdx} className="px-4 py-4 flex flex-col gap-2 border-l border-gray-100">
              {p ? (
                <>
                  <Link
                    href={`/product/${p.slug || p._id}`}
                    className="w-full text-center text-sm font-extrabold text-white py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-sm"
                    style={{ background: BRAND_RED }}
                  >
                    Buy Now
                  </Link>
                  <Link
                    href={`/product/${p.slug || p._id}`}
                    className="w-full text-center text-xs font-semibold py-2 rounded-xl border-2 transition-all hover:bg-red-50"
                    style={{ color: BRAND_RED, borderColor: BRAND_RED }}
                  >
                    View Details
                  </Link>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mobile Cards ──────────────────────────────────────────────────────────────

function MobileCards({ products, rows }) {
  const { removeFromCompare } = useCompare();

  return (
    <div className="md:hidden flex flex-col gap-5">
      {products.map((item, colIdx) => {
        const p = item.productData;
        const price = getPrice(p);
        const mrp = getMRP(p);
        const disc = getDiscount(p);
        const rating = getRating(p);
        const reviewCount = p?.reviewCount || p?.review_count || 0;
        const features = p?.product_highlights || [];

        return (
          <div key={colIdx} className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="relative px-4 py-4" style={{ background: `${BRAND_RED}08` }}>
              {disc && (
                <span className="absolute top-3 left-3 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: BRAND_RED }}>
                  -{disc}%
                </span>
              )}
              <button
                onClick={() => removeFromCompare(item.productId)}
                aria-label="Remove from compare"
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition"
              >
                <X size={13} strokeWidth={2.5} />
              </button>

              {p ? (
                <div className="flex gap-4 pt-2">
                  <Link href={`/product/${p.slug || p._id}`}>
                    <div className="w-24 h-24 bg-white rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      <Image src={getImageSrc(p)} alt={p.name || 'Product'} width={88} height={88} className="object-contain p-2" unoptimized />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {p.brand_name && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{p.brand_name}</span>}
                    <Link href={`/product/${p.slug || p._id}`} className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug">
                      {p.name}
                    </Link>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-lg font-extrabold" style={{ color: BRAND_RED }}>
                        &#8377;{Number(price).toLocaleString('en-IN')}
                      </span>
                      {mrp && mrp > price && (
                        <span className="text-xs text-gray-400 line-through">&#8377;{Number(mrp).toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <StarDisplay rating={rating} count={reviewCount} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                    <XCircle size={28} className="text-gray-300" />
                  </div>
                  <span className="text-sm text-gray-400 italic">Product no longer available</span>
                </div>
              )}
            </div>

            {p && (
              <>
                {features.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap size={11} style={{ color: BRAND_RED }} />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: BRAND_RED }}>Key Features</span>
                    </div>
                    <ul className="space-y-1">
                      {features.slice(0, 4).map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle2 size={10} className="shrink-0 mt-0.5" style={{ color: BRAND_RED }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rows.length > 0 && (
                  <div className="border-t border-gray-100">
                    <div className="px-4 py-2 flex items-center gap-1.5" style={{ background: `${BRAND_RED}08` }}>
                      <Award size={11} style={{ color: BRAND_RED }} />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: BRAND_RED }}>Specifications</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {rows.slice(0, 12).map(({ key, values }, rowIdx) => (
                        <div key={rowIdx} className={`flex justify-between items-center px-4 py-2.5 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <span className="text-gray-500 font-medium text-xs flex-shrink-0 max-w-[45%]">{key}</span>
                          <span className="text-gray-800 font-semibold text-xs text-right max-w-[50%] leading-snug">{values[colIdx] || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                  <Link href={`/product/${p.slug || p._id}`} className="flex-1 text-center text-sm font-extrabold text-white py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95" style={{ background: BRAND_RED }}>
                    Buy Now
                  </Link>
                  <Link href={`/product/${p.slug || p._id}`} className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl border-2 transition-all hover:bg-red-50" style={{ color: BRAND_RED, borderColor: BRAND_RED }}>
                    View Details
                  </Link>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function CompareTable({ products }) {
  if (!products || products.length === 0) return null;
  const rows = normalizeAttributes(products.map((item) => item.productData).filter(Boolean));
  return (
    <div className="w-full rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <DesktopTable products={products} rows={rows} />
      <MobileCards products={products} rows={rows} />
    </div>
  );
}
