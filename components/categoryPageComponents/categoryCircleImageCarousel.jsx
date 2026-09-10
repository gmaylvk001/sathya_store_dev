"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function usePerPage() {
  const [perPage, setPerPage] = useState(6);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setPerPage(3);
      else if (w < 768) setPerPage(4);
      else if (w < 1024) setPerPage(5);
      else if (w < 1280) setPerPage(6);
      else setPerPage(7);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return perPage;
}

function resolveItemHref(item) {
  const target = String(item?.slug || item?.url || "").trim();
  if (!target) return "#";
  if (/^https?:\/\//i.test(target) || target.startsWith("/")) return target;
  return `/${target.replace(/^\/+/, "")}`;
}

/**
 * Category & Home Circle Image Carousel:
 * - Whole component name in red color, centered at the top.
 * - Circular images (radius 100%).
 * - Image name displayed at the bottom of each image.
 * - Click navigates to the item's slug / url.
 */
export default function CategoryCircleImageCarousel({ config }) {
  const items = (config?.items || []).filter((i) => i?.image);
  const name = config?.name || "";
  const perPage = usePerPage();
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const dragRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });

  const checkScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, items.length]);

  const scrollByDirection = useCallback((direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  }, []);

  // Pointer drag support
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.style.scrollBehavior = "auto";
    el.style.cursor = "grabbing";
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5) d.moved = true;
    const el = scrollerRef.current;
    if (el) {
      el.scrollLeft = d.startScroll - dx;
    }
  };

  const endDrag = () => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const el = scrollerRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.scrollBehavior = "smooth";
      checkScroll();
    }
  };

  const onClickCapture = (e) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  if (!items.length) return null;

  return (
    <section className="w-full my-6 py-4 bg-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Whole component name displaying red color top center */}
        {name && (
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-[#BC2121] mb-6 tracking-tight">
            {name}
          </h2>
        )}

        {/* Carousel Container */}
        <div
          className="relative group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Arrow */}
          <button
            type="button"
            aria-label="Previous"
            disabled={!canScrollLeft}
            onClick={() => scrollByDirection("left")}
            className={`absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-[#BC2121] text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:bg-[#9E1B1B] hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none`}
          >
            <FiChevronLeft size={22} />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            aria-label="Next"
            disabled={!canScrollRight}
            onClick={() => scrollByDirection("right")}
            className={`absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-[#BC2121] text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:bg-[#9E1B1B] hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none`}
          >
            <FiChevronRight size={22} />
          </button>

          {/* Scrollable Track */}
          <div
            ref={scrollerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={onClickCapture}
            className="flex items-start overflow-x-auto scrollbar-hide py-3 px-2 cursor-grab"
            style={{
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="flex items-start justify-center gap-5 sm:gap-7 mx-auto">
              {items.map((item, idx) => {
                const href = resolveItemHref(item);
                const isExternal = /^https?:\/\//i.test(href);

                const content = (
                  <div className="flex flex-col items-center group/item cursor-pointer w-28 sm:w-32 md:w-36 lg:w-40 shrink-0 transition-transform duration-200 hover:-translate-y-1.5">
                    {/* Circle image container with radius 100 & red outline border */}
                    <div
                      className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 overflow-hidden bg-white border-2 sm:border-[3px] border-[#BC2121] shadow-sm flex items-center justify-center p-2 transition-all duration-300 group-hover/item:shadow-md group-hover/item:border-[#9E1B1B]"
                      style={{ borderRadius: "100%" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.imageName || name || `Image ${idx + 1}`}
                        className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-300 group-hover/item:scale-105"
                        style={{ borderRadius: "100%" }}
                        draggable={false}
                      />
                    </div>

                    {/* Image name displaying in the bottom of the image in red color */}
                    {item.imageName && (
                      <span className="mt-3 text-center text-xs sm:text-sm font-bold text-[#BC2121] line-clamp-2 px-1 leading-snug tracking-tight transition-colors duration-200 group-hover/item:text-[#9E1B1B]">
                        {item.imageName}
                      </span>
                    )}
                  </div>
                );

              if (href && href !== "#") {
                if (isExternal) {
                  return (
                    <a
                      key={item._id || idx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline"
                    >
                      {content}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item._id || idx}
                    href={href}
                    className="no-underline"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div key={item._id || idx} className="no-underline">
                  {content}
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
