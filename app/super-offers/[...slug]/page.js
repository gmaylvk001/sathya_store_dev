"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useRegion } from "@/context/RegionContext";
import Addtocart from "@/components/AddToCart";
import AddToWishlistButton from "@/components/ProductCard";
import { getCardOfferCategoryHref } from "@/lib/cardOffers/cardOfferNavigationHelper";

// Format date into ordinal format e.g. "Sep 8th to 10th, 2026"
function formatOfferDateRange(startVal, endVal) {
  if (!startVal && !endVal) return "Sep 8th to 10th, 2026";
  const s = startVal ? new Date(startVal) : null;
  const e = endVal ? new Date(endVal) : null;

  const validS = s && !isNaN(s.getTime()) ? s : null;
  const validE = e && !isNaN(e.getTime()) ? e : null;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (validS && validE) {
    const m1 = months[validS.getMonth()];
    const m2 = months[validE.getMonth()];
    const d1 = getOrdinal(validS.getDate());
    const d2 = getOrdinal(validE.getDate());
    const y1 = validS.getFullYear();
    const y2 = validE.getFullYear();

    if (y1 === y2) {
      if (m1 === m2) {
        return `${m1} ${d1} to ${d2}, ${y1}`;
      }
      return `${m1} ${d1} to ${m2} ${d2}, ${y1}`;
    }
    return `${m1} ${d1}, ${y1} to ${m2} ${d2}, ${y2}`;
  }

  if (validE) {
    return `Valid till ${months[validE.getMonth()]} ${getOrdinal(validE.getDate())}, ${validE.getFullYear()}`;
  }

  if (validS) {
    return `Starts ${months[validS.getMonth()]} ${getOrdinal(validS.getDate())}, ${validS.getFullYear()}`;
  }

  return "Sep 8th to 10th, 2026";
}

// Fallback card offers if none are uploaded in admin
const FALLBACK_CARD_OFFERS = [
  {
    id: "gas-stove",
    title: "GAS STOVE",
    image: "/uploads/cardoffers/card-offer-1788935251002-Capture.PNG",
    link: "/category/kitchen-appliances",
  },
  {
    id: "chimney-offer",
    title: "CHIMNEY OFFER",
    image: "/uploads/cardoffers/card-offer-1788935251002-Capture.PNG",
    link: "/category/kitchen-appliances",
  },
  {
    id: "mixie-offer",
    title: "MIXIE OFFER",
    image: "/uploads/cardoffers/card-offer-1788935251002-Capture.PNG",
    link: "/category/kitchen-appliances",
  },
];

// Helper to determine destination URL for any card offer
function getCardOfferHref(card) {
  return getCardOfferCategoryHref(card);
}

// Card Offer Banner Component with solid red bottom bar
function SuperOfferCardItem({ card }) {
  const initialImg = card.image
    ? card.image.startsWith("/") || card.image.startsWith("http")
      ? card.image
      : `/uploads/cardoffers/${card.image}`
    : "/uploads/sathya-header-logo.webp";

  const [imgSrc, setImgSrc] = useState(initialImg);

  const targetHref = getCardOfferHref(card);

  return (
    <Link
      href={targetHref}
      className="group flex flex-col bg-white border border-gray-200/90 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden rounded-sm"
    >
      <div className="relative w-full h-48 sm:h-56 bg-white flex items-center justify-center p-3 overflow-hidden">
        <Image
          src={imgSrc}
          alt={card.title || "Offer Banner"}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={() => setImgSrc("/uploads/sathya-header-logo.webp")}
          unoptimized
        />
      </div>
      <div className="bg-[#d72828] group-hover:bg-red-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 uppercase tracking-wider transition-colors text-left">
        {card.title}
      </div>
    </Link>
  );
}

// Product Card for Super Offers
function SuperOfferProductCard({ product, brandMap }) {
  const price = Number(product.price) || 0;
  const specialPrice = Number(product.special_price) || 0;
  const hasDiscount = specialPrice > 0 && specialPrice < price;
  const discountPct = hasDiscount
    ? Math.round(100 - (specialPrice / price) * 100)
    : 0;
  const displayPrice = hasDiscount ? specialPrice : price;

  // const initialImg = product.images?.[0]
  //   ? product.images[0].startsWith("http")
  //     ? product.images[0]
  //     : `/uploads/products/${product.images[0]}`
  //   : "/uploads/sathya-header-logo.webp";
  const tempURL = "https://www.sathya.store/img/product/";
  const imagepathname = product.images?.[0] || "";
  const initialImg = imagepathname
    ? (imagepathname.startsWith("http") ? imagepathname : `${tempURL}${imagepathname.replace(/^\/?(uploads\/products\/)?/, "").replace(/^\/+/, "")}`)
    : "/uploads/sathya-header-logo.webp";

  const [imgSrc, setImgSrc] = useState(initialImg);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-xl hover:border-red-200 transition-all duration-300 flex flex-col p-3 sm:p-4 w-full relative group">
      {hasDiscount && discountPct > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-[#d72828] text-white text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded shadow-sm">
          {discountPct}% OFF
        </div>
      )}

      <div className="absolute top-3 right-3 z-10">
        <AddToWishlistButton productId={product._id} />
      </div>

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

      {brandMap[product.brand] && (
        <div className="text-[10px] sm:text-xs uppercase font-semibold text-gray-400 mb-1 tracking-wider">
          {brandMap[product.brand]}
        </div>
      )}

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

      <div className="text-[11px] font-medium mb-3">
        {product.stock_status === "In Stock" ||
          (product.quantity && product.quantity > 0) ? (
          <span className="text-green-600 font-semibold">In Stock</span>
        ) : (
          <span className="text-red-500 font-semibold">Out of Stock</span>
        )}
      </div>

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

function SuperOffersContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { region, selectedRegion } = useRegion();

  const [timer, setTimer] = useState(null);
  const [products, setProducts] = useState([]);
  const [brandMap, setBrandMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [offerStatus, setOfferStatus] = useState({
    status: "loading", // "loading" | "upcoming" | "countdown" | "live" | "ended"
    isLive: false,
    isCountdown: false,
    isUpcoming: false,
    isEnded: false,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Extract slug parameters
  const slugArray = Array.isArray(params?.slug) ? params.slug : [params?.slug];
  const urlOfferSlug = slugArray[slugArray.length - 1] || "";
  const queryTimerId = searchParams.get("offer_timer_id");

  // Load offer details
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const [timersRes, productsRes, brandRes] = await Promise.allSettled([
          fetch("/api/offer-timer"),
          fetch("/api/categoryproduct/settings"),
          fetch("/api/brand"),
        ]);

        let matchedTimer = null;
        if (timersRes.status === "fulfilled" && timersRes.value.ok) {
          const tData = await timersRes.value.json();
          const timers = tData?.data || [];

          if (queryTimerId) {
            matchedTimer = timers.find(
              (t) =>
                String(t.timerId) === String(queryTimerId) ||
                String(t.custom_id) === String(queryTimerId) ||
                String(t._id) === String(queryTimerId)
            );
          }

          if (!matchedTimer && urlOfferSlug) {
            matchedTimer = timers.find((t) => {
              const s = (t.offerTitle || t.offer_title || "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-");
              return s === urlOfferSlug.toLowerCase();
            });
          }

          if (!matchedTimer && timers.length > 0) {
            matchedTimer = timers[0];
          }
        }

        if (isMounted && matchedTimer) {
          setTimer(matchedTimer);
          const title = matchedTimer.offerTitle || matchedTimer.offer_title;
          if (title) {
            document.title = `${title} | Sathya Store`;
          }
        }

        // Brands
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

        // Products
        if (productsRes.status === "fulfilled" && productsRes.value.ok) {
          const pData = await productsRes.value.json();
          if (pData?.ok && Array.isArray(pData?.data)) {
            const allProds = pData.data.flatMap((item) => item.products || []);
            if (isMounted) setProducts(allProds.slice(0, 12));
          }
        }
      } catch (err) {
        console.error("Error loading super offer:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [queryTimerId, urlOfferSlug]);

  // Live Countdown & Offer Status Calculator
  useEffect(() => {
    if (!timer) return;

    const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

    const calculateTime = () => {
      const now = Date.now();
      const startDateRaw = timer.startDate || timer.offer_start;
      const endDateRaw = timer.endDate || timer.offer_end;

      const parsedStart = startDateRaw ? new Date(startDateRaw).getTime() : null;
      const parsedEnd = endDateRaw ? new Date(endDateRaw).getTime() : null;

      const startMs = parsedStart && !isNaN(parsedStart) ? parsedStart : null;
      const endMs = parsedEnd && !isNaN(parsedEnd) ? parsedEnd : null;

      // 1. Ended (past end date)
      if (endMs !== null && now >= endMs) {
        setOfferStatus({
          status: "ended",
          isLive: false,
          isCountdown: false,
          isUpcoming: false,
          isEnded: true,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      // 2. Active / Live (start time reached and not yet ended)
      if ((startMs !== null && now >= startMs) || (startMs === null && endMs !== null && now < endMs)) {
        setOfferStatus({
          status: "live",
          isLive: true,
          isCountdown: false,
          isUpcoming: false,
          isEnded: false,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      // 3. Not started yet (now < startMs)
      if (startMs !== null && now < startMs) {
        const diff = startMs - now;

        if (diff <= FIVE_HOURS_MS && diff > 0) {
          // Within 5 hours before start: Show Countdown (HOURS, MINS, SECS only - no DAYS)
          const totalSecs = Math.floor(diff / 1000);
          const hours = Math.floor(totalSecs / 3600);
          const minutes = Math.floor((totalSecs % 3600) / 60);
          const seconds = totalSecs % 60;

          setOfferStatus({
            status: "countdown",
            isLive: false,
            isCountdown: true,
            isUpcoming: false,
            isEnded: false,
            hours,
            minutes,
            seconds,
          });
          return;
        }

        // More than 5 hours before start: Hide Countdown, Show Upcoming Offer Info
        setOfferStatus({
          status: "upcoming",
          isLive: false,
          isCountdown: false,
          isUpcoming: true,
          isEnded: false,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      // Fallback if neither start nor end is configured: treat as live
      setOfferStatus({
        status: "live",
        isLive: true,
        isCountdown: false,
        isUpcoming: false,
        isEnded: false,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const displayTitle =
    timer?.offerTitle || timer?.offer_title || "FULL MOON SALE";
  const displaySubtitle =
    timer?.offerHeading ||
    timer?.offerDescription ||
    timer?.offerTitle ||
    "Full Moon Sale";

  const cardOffersList =
    Array.isArray(timer?.card_offers) && timer.card_offers.length > 0
      ? timer.card_offers.filter((c) => c.status !== "inactive")
      : FALLBACK_CARD_OFFERS;

  const dateRangeBadge = useMemo(() => {
    return formatOfferDateRange(
      timer?.startDate || timer?.offer_start,
      timer?.endDate || timer?.offer_end
    );
  }, [timer]);

  return (
    <div className="min-h-screen bg-white text-gray-800 pb-20">
      {/* Top Titles (Matching Reference Image 1) */}
      <div className="py-8 px-4 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-wide text-gray-900">
          {displayTitle}
        </h1>
        <p className="text-gray-500 font-normal text-sm sm:text-base mt-2">
          {displaySubtitle}
        </p>
      </div>

      {/* Main Hero Section (Black Background Matching Reference Image 1) */}
      <section className="w-full bg-black py-10 sm:py-14 px-4 sm:px-8 text-center text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Brief loading state if timer is still fetching */}
          {loading && !timer && (
            <div className="py-6 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-400 border-t-transparent" />
              <div className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Loading offer details...
              </div>
            </div>
          )}

          {/* STATE 1: COUNTDOWN (Only within 5 hours before start) */}
          {offerStatus.isCountdown && (
            <>
              {/* Sale Status Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                <span>SALE STARTS SOON - HURRY UP!</span>
              </div>

              {/* Countdown Title */}
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-wide uppercase">
                  DEALS UNLOCK IN
                </h2>
              </div>

              {/* 3 Countdown Time Boxes: HOURS : MINS : SECS */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-4 md:gap-6 my-2">
                {/* HOURS */}
                <div className="flex flex-col items-center justify-center bg-[#131d33] border border-blue-900/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 w-24 sm:w-28 md:w-32 shadow-2xl hover:border-blue-700/80 transition-all">
                  <span className="text-3xl sm:text-5xl font-black text-[#FFD700] tracking-tight font-mono">
                    {String(offerStatus.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-300 tracking-wider uppercase mt-2">
                    HOURS
                  </span>
                </div>

                <span className="text-2xl sm:text-4xl font-extrabold text-[#FFD700] self-center -mt-3">
                  :
                </span>

                {/* MINS */}
                <div className="flex flex-col items-center justify-center bg-[#131d33] border border-blue-900/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 w-24 sm:w-28 md:w-32 shadow-2xl hover:border-blue-700/80 transition-all">
                  <span className="text-3xl sm:text-5xl font-black text-[#FFD700] tracking-tight font-mono">
                    {String(offerStatus.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-300 tracking-wider uppercase mt-2">
                    MINS
                  </span>
                </div>

                <span className="text-2xl sm:text-4xl font-extrabold text-[#FFD700] self-center -mt-3">
                  :
                </span>

                {/* SECS */}
                <div className="flex flex-col items-center justify-center bg-[#131d33] border border-blue-900/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 w-24 sm:w-28 md:w-32 shadow-2xl hover:border-blue-700/80 transition-all">
                  <span className="text-3xl sm:text-5xl font-black text-[#FFD700] tracking-tight font-mono">
                    {String(offerStatus.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-300 tracking-wider uppercase mt-2">
                    SECS
                  </span>
                </div>
              </div>

              {/* Red Date Pill */}
              <div className="mt-7">
                <span className="bg-[#ED1C24] text-white font-bold text-xs sm:text-sm px-7 py-2.5 rounded-full inline-block shadow-lg tracking-wide">
                  {dateRangeBadge}
                </span>
              </div>
            </>
          )}

          {/* STATE 2: UPCOMING (> 5 hours before start) */}
          {offerStatus.isUpcoming && (
            <>
              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                <span>UPCOMING SUPER OFFER</span>
              </div>

              {/* Upcoming Offer Info */}
              <div className="max-w-xl mx-auto my-2 space-y-3">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide uppercase">
                  {timer?.offerHeading || "GET READY FOR MEGA OFFERS!"}
                </h2>
                <p className="text-gray-300 text-xs sm:text-sm md:text-base font-normal max-w-lg mx-auto leading-relaxed">
                  {timer?.offerDescription || "Exclusive discounts and limited-time savings will go live soon. Stay tuned!"}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#131d33] border border-blue-900/50 text-gray-300 text-xs font-medium">
                  <span className="text-yellow-400">⏰</span>
                  <span>Countdown timer will go live 5 hours before start</span>
                </div>
              </div>

              {/* Red Date Pill */}
              <div className="mt-6">
                <span className="bg-[#ED1C24] text-white font-bold text-xs sm:text-sm px-7 py-2.5 rounded-full inline-block shadow-lg tracking-wide">
                  {dateRangeBadge}
                </span>
              </div>
            </>
          )}

          {/* STATE 3: LIVE / ACTIVE (From start time until end date) */}
          {offerStatus.isLive && (
            <>
              {/* Sale Status Pill */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-red-600/20 border border-red-500/40 text-yellow-400 font-extrabold text-xs sm:text-sm uppercase tracking-widest mb-4 shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span>SALE IS LIVE NOW!</span>
              </div>

              {/* Relevant Offer Text / Headline */}
              <div className="max-w-2xl mx-auto my-2 space-y-2.5">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
                  {timer?.offerHeading || "EXCLUSIVE DEALS ARE UNLOCKED!"}
                </h2>
                <p className="text-gray-300 text-xs sm:text-sm md:text-base font-normal max-w-lg mx-auto leading-relaxed">
                  {timer?.offerDescription || "Shop limited-time mega discounts on top brands and appliances. Limited stock available!"}
                </p>
              </div>

              {/* Compact Modern Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 my-3">
                <span className="bg-[#131d33] border border-blue-900/60 text-[#FFD700] text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm">
                  ⚡ Best Price Guaranteed
                </span>
                <span className="bg-[#131d33] border border-blue-900/60 text-white text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm">
                  🛡️ 100% Genuine Products
                </span>
                <span className="bg-[#131d33] border border-blue-900/60 text-[#FFD700] text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm">
                  🚚 Fast Store Delivery
                </span>
              </div>

              {/* Red Date Pill */}
              <div className="mt-4">
                <span className="bg-[#ED1C24] text-white font-bold text-xs sm:text-sm px-7 py-2.5 rounded-full inline-block shadow-lg tracking-wide">
                  {dateRangeBadge}
                </span>
              </div>
            </>
          )}

          {/* STATE 4: ENDED (Past end date) */}
          {offerStatus.isEnded && (
            <>
              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                <span>SALE HAS ENDED</span>
              </div>

              {/* Relevant Offer Text */}
              <div className="max-w-xl mx-auto my-2 space-y-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-wide uppercase">
                  THIS OFFER HAS CONCLUDED
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm font-normal max-w-md mx-auto">
                  This limited-time offer has expired. Browse our wide range of products and active promotions below!
                </p>
              </div>

              {/* Date Pill */}
              <div className="mt-4">
                <span className="bg-gray-800 text-gray-300 font-bold text-xs sm:text-sm px-7 py-2 rounded-full inline-block border border-gray-700 tracking-wide">
                  Ended: {dateRangeBadge}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Offers Showcase & Products Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-14">
        {/* Card Offers Grid (with Solid Red Bottom Bar) */}
        {cardOffersList.length > 0 && (
          <section>
            <div className="flex items-center justify-between pb-2 mb-6 border-b border-gray-300">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide text-[#d72828] uppercase">
                {displayTitle} - EXCLUSIVE OFFERS
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {cardOffersList.map((card, idx) => (
                <SuperOfferCardItem
                  key={card.id || card._id || idx}
                  card={card}
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured Deals Products Grid */}
        {products.length > 0 && (
          <section>
            <div className="flex items-center justify-between pb-2 mb-6 border-b border-gray-300">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide text-[#d72828] uppercase">
                HOT DEALS FOR YOU
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <SuperOfferProductCard
                  key={product._id}
                  product={product}
                  brandMap={brandMap}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function SuperOffersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
        </div>
      }
    >
      <SuperOffersContent />
    </Suspense>
  );
}
