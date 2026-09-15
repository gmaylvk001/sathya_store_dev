"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCardOfferCategoryHref } from "@/lib/cardOffers/cardOfferNavigationHelper";

/**
 * Individual Card Offer item matching Image 1 styling:
 * - White rounded container with subtle border & soft shadow
 * - Clean aspect ratio image container
 * - Dark bottom bar with gold/amber text and subtle border accent
 * - Smooth hover elevation and scale effects
 */
function CardOfferItem({ card }) {
  const initialImg = card.image
    ? card.image.startsWith("/") || card.image.startsWith("http")
      ? card.image
      : `/uploads/cardoffers/${card.image}`
    : "/uploads/sathya-header-logo.webp";

  const [imgSrc, setImgSrc] = useState(initialImg);
  const targetHref = getCardOfferCategoryHref(card);
  const displayLabel = card.title || card.description || "Special Offer";

  return (
    <Link
      href={targetHref}
      className="group flex flex-col bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden w-full h-full"
    >
      {/* Card Image Area */}
      <div className="relative w-full h-44 sm:h-52 md:h-56 bg-white flex items-center justify-center p-4 overflow-hidden">
        <Image
          src={imgSrc}
          alt={displayLabel}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 75vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => setImgSrc("/uploads/sathya-header-logo.webp")}
          unoptimized
        />
      </div>

      {/* Dark Bottom Bar matching Image 1 */}
      <div className="mt-auto px-3 py-2.5 sm:py-3 bg-[#181d24] group-hover:bg-[#222832] transition-colors border-t border-amber-400/20 flex items-center justify-center text-center">
        <span className="text-[#facc15] font-bold text-xs sm:text-sm tracking-wide line-clamp-1 group-hover:text-yellow-300 transition-colors uppercase">
          {displayLabel}
        </span>
      </div>
    </Link>
  );
}

/**
 * CardOfferCategorySection:
 * Renders a single category row with:
 * - Clean bold category heading
 * - Horizontal 4-card carousel (responsive: 1-2 mobile, 2-3 tablet, 4 desktop)
 * - Circular left & right navigation arrows (pale pink/red circle with red arrow)
 * - Dot pagination indicators underneath
 */
export default function CardOfferCategorySection({ categoryName, cards = [] }) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Measure and update scroll state & pagination dots
  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);

    // Calculate pages (typically clientWidth per page)
    if (clientWidth > 0 && maxScroll > 0) {
      const calculatedPages = Math.max(1, Math.round(scrollWidth / clientWidth));
      setTotalPages(calculatedPages);

      const currentPage = Math.min(
        calculatedPages - 1,
        Math.max(0, Math.round(scrollLeft / clientWidth))
      );
      setActivePageIndex(currentPage);
    } else {
      setTotalPages(1);
      setActivePageIndex(0);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, cards]);

  // Navigate left/right
  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.85;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Click dot indicator to navigate directly to that page
  const handleDotClick = (pageIndex) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.scrollTo({
      left: pageIndex * el.clientWidth,
      behavior: "smooth",
    });
  };

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <section className="w-full my-6 sm:my-10">
      {/* Category Heading matching Image 1 */}
      <div className="mb-4 sm:mb-5">
        <h2 className="text-base sm:text-lg md:text-xl font-black tracking-wider text-gray-900 uppercase">
          {categoryName}
        </h2>
      </div>

      {/* Carousel Wrapper */}
      <div className="relative group/carousel">
        {/* Left Navigation Arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label="Previous offers"
            className="absolute left-0 sm:-left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#fce8e8] hover:bg-[#f9d4d4] active:scale-95 text-[#d72828] shadow-md flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none stroke-[2.5]"
              viewBox="0 0 24 24"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Scrollable Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto scroll-smooth pb-2 pt-1 px-0.5 no-scrollbar snap-x snap-mandatory"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {cards.map((card, idx) => (
            <div
              key={card.id || card._id || idx}
              className="flex-shrink-0 snap-start w-[240px] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] flex"
            >
              <CardOfferItem card={card} />
            </div>
          ))}
        </div>

        {/* Right Navigation Arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label="Next offers"
            className="absolute right-0 sm:-right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#fce8e8] hover:bg-[#f9d4d4] active:scale-95 text-[#d72828] shadow-md flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none stroke-[2.5]"
              viewBox="0 0 24 24"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Carousel Dot Indicators matching Image 1 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-5">
          {Array.from({ length: totalPages }).map((_, dotIdx) => {
            const isActive = dotIdx === activePageIndex;
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={() => handleDotClick(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`transition-all duration-300 rounded-full focus:outline-none ${
                  isActive
                    ? "w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#d72828] shadow-xs"
                    : "w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
