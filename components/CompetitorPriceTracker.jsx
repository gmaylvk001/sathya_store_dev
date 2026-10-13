"use client";

import React, { useState, useEffect } from "react";

// ==========================================
// Vector Brand Logos for Verified Competitors
// ==========================================
function AmazonLogoSvg({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-label="Amazon India">
      <rect width="100" height="100" rx="20" fill="#232f3e" />
      <path
        d="M26 62 C40 73 60 73 74 62"
        stroke="#ff9900"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M71 58 L77 64 L71 70"
        stroke="#ff9900"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="50" y="44" fill="#ffffff" fontSize="26" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
        a
      </text>
    </svg>
  );
}

function FlipkartLogoSvg({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-label="Flipkart">
      <rect width="100" height="100" rx="20" fill="#2874f0" />
      <path
        d="M32 30 H66 M32 48 H58 M32 30 V72"
        stroke="#ffe500"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CromaLogoSvg({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-label="Croma">
      <rect width="100" height="100" rx="20" fill="#0f766e" />
      <circle cx="50" cy="50" r="28" stroke="#2dd4bf" strokeWidth="8" fill="none" />
      <circle cx="50" cy="50" r="10" fill="#2dd4bf" />
    </svg>
  );
}

function RelianceLogoSvg({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-label="Reliance Digital">
      <rect width="100" height="100" rx="20" fill="#dc2626" />
      <text x="50" y="60" fill="#ffffff" fontSize="30" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
        RD
      </text>
    </svg>
  );
}

function PoorvikaLogoSvg({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-label="Poorvika">
      <rect width="100" height="100" rx="20" fill="#ea580c" />
      <text x="50" y="60" fill="#ffffff" fontSize="32" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
        P
      </text>
    </svg>
  );
}

function GenericStoreLogoSvg({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function RenderCompetitorLogo({ platform, size = 18 }) {
  const norm = String(platform || "").toLowerCase();
  const cls = `w-[${size}px] h-[${size}px] shrink-0`;

  if (norm.includes("amazon")) return <AmazonLogoSvg className="w-4 h-4 shrink-0 rounded" />;
  if (norm.includes("flipkart")) return <FlipkartLogoSvg className="w-4 h-4 shrink-0 rounded" />;
  if (norm.includes("croma")) return <CromaLogoSvg className="w-4 h-4 shrink-0 rounded" />;
  if (norm.includes("reliance")) return <RelianceLogoSvg className="w-4 h-4 shrink-0 rounded" />;
  if (norm.includes("poorvika")) return <PoorvikaLogoSvg className="w-4 h-4 shrink-0 rounded" />;
  return <GenericStoreLogoSvg className="w-4 h-4 text-slate-500 shrink-0" />;
}

/**
 * CompetitorPriceTracker Component
 * Modern 2026 Live Market Price Comparison widget powered by ePrice Tracker™.
 * Defensively renders with zero CLS and graceful fallback.
 */
export default function CompetitorPriceTracker({ product, className = "" }) {
  const [trackerData, setTrackerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const sathyaPrice = Number(
    product?.special_price > 0 ? product?.special_price : product?.price || 0
  );
  const sku = product?.item_code || product?.sku || product?.slug || "";
  const title = product?.name || "";

  useEffect(() => {
    if (!product || sathyaPrice <= 0) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const params = new URLSearchParams({
      sku,
      price: String(sathyaPrice),
      title: title.slice(0, 80),
    });

    fetch(`/api/price-tracker?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data && data.success && Array.isArray(data.deals) && data.deals.length > 0) {
            setTrackerData(data);
          } else {
            setTrackerData(null);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load live price tracker:", err);
        if (isMounted) {
          setTrackerData(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [product?._id, sku, sathyaPrice, title]);

  // Loading skeleton with matching dimensions (zero CLS)
  if (isLoading) {
    return (
      <div
        className={`bg-gradient-to-b from-slate-50/80 to-white border border-slate-200/90 rounded-2xl p-4 shadow-sm backdrop-blur-xs relative overflow-hidden mb-4 ${className}`}
      >
        <div className="h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 w-full absolute top-0 left-0" />
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="h-3.5 w-36 bg-slate-200 rounded animate-pulse" />
          <div className="h-3.5 w-24 bg-slate-100 rounded-full animate-pulse" />
        </div>
        <div className="space-y-2 mt-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 bg-slate-100/80 rounded-xl animate-pulse border border-slate-100"
            />
          ))}
        </div>
        <div className="h-2.5 w-48 bg-slate-100 rounded mx-auto mt-3 animate-pulse" />
      </div>
    );
  }

  // Graceful silent fallback if no deals available
  if (!trackerData || !Array.isArray(trackerData.deals) || trackerData.deals.length === 0) {
    return null;
  }

  const deals = trackerData.deals.slice(0, 3);
  const lastVerified = trackerData.lastVerifiedSlot || "2:30 PM";

  return (
    <div
      className={`bg-gradient-to-b from-slate-50/80 to-white border border-slate-200/90 rounded-2xl p-4 shadow-sm backdrop-blur-xs relative overflow-hidden mb-4 transition-all duration-200 hover:shadow-md ${className}`}
    >
      {/* 1. Micro Gradient Accent Line */}
      <div className="h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 w-full absolute top-0 left-0" />

      {/* 2. Header & Live Sync Badge */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          {/* Pulsing Radar/Live Icon */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d72828]" />
          </span>
          <svg
            className="w-4 h-4 text-[#d72828]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="text-xs font-bold text-slate-800 tracking-tight">
            Live Market Comparison
          </span>
        </div>

        {/* Live Slot Verification Pill */}
        <div
          className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
          title={`Verified by ePrice Tracker at ${lastVerified} IST`}
        >
          <span className="text-amber-500">⚡</span>
          <span>Verified at {lastVerified}</span>
        </div>
      </div>

      {/* 3. Top 3 Competitor Micro-Cards Stack */}
      <div className="space-y-2 mt-3">
        {deals.map((deal, idx) => {
          const savings = deal.savingsVsSathya || 0;
          const isCheaper = deal.isSathyaCheaper && savings > 0;
          const isMatched = deal.isMatched || savings === 0;

          return (
            <div
              key={deal.platform || idx}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-150 hover:border-slate-300 transition-all shadow-2xs"
            >
              {/* Left: Platform Logo & Name */}
              <div className="flex items-center gap-2 min-w-0">
                <RenderCompetitorLogo platform={deal.platform} size={18} />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {deal.platform}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium flex items-center gap-0.5">
                    <svg className="w-2.5 h-2.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified Store
                  </span>
                </div>
              </div>

              {/* Right: Competitor Price & Advantage Pill */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-700">
                  ₹{Number(deal.price).toLocaleString("en-IN")}
                </span>

                {isCheaper ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                    Save ₹{savings.toLocaleString("en-IN")} on SATHYA
                  </span>
                ) : isMatched ? (
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                    Best Price Matched
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Trust Footer */}
      <div className="text-[10px] text-slate-400 text-center mt-2.5 font-normal tracking-tight">
        ePrice Tracker™ Verified • Prices refreshed 3x daily (10:30 AM, 2:30 PM, 8:30 PM)
      </div>
    </div>
  );
}
