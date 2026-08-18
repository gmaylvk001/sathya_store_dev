"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ProductCard from "@/components/ProductCard";

function usePerPage() {
  const [perPage, setPerPage] = useState(4);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setPerPage(2);
      else if (w < 900) setPerPage(3);
      else if (w < 1100) setPerPage(4);
      else setPerPage(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return perPage;
}

function getPageStarts(total, perPage) {
  if (total <= 0) return [];
  if (total <= perPage) return [0];
  const starts = [];
  for (let i = 0; i + perPage < total; i += perPage) {
    starts.push(i);
  }
  const last = total - perPage;
  if (starts[starts.length - 1] !== last) starts.push(last);
  return starts;
}

function productImageSrc(product) {
  const img = product?.images?.[0];
  if (!img) return "";
  return img.startsWith("http") ? img : `/uploads/products/${img}`;
}

function formatPrice(n) {
  return Math.round(Number(n) || 0).toLocaleString("en-IN");
}

function BannerLink({ href, children, className = "" }) {
  if (!href) return <div className={className}>{children}</div>;
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function ProductRow({ products, seeAllHref, name }) {
  const perPage = usePerPage();
  const scrollerRef = useRef(null);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  const pageStarts = useMemo(
    () => getPageStarts(products.length, perPage),
    [products.length, perPage]
  );
  const pages = useMemo(
    () => pageStarts.map((start) => products.slice(start, start + perPage)),
    [products, pageStarts, perPage]
  );
  const pageCount = Math.max(1, pages.length);

  const scrollToPage = useCallback(
    (index, behavior = "smooth") => {
      const el = scrollerRef.current;
      if (!el) return;
      let next = index;
      if (next >= pageCount) next = 0;
      if (next < 0) next = pageCount - 1;
      el.scrollTo({ left: next * el.clientWidth, behavior });
      setPage(next);
    },
    [pageCount]
  );

  useEffect(() => {
    setPage(0);
    const el = scrollerRef.current;
    if (el) el.scrollTo({ left: 0, behavior: "auto" });
  }, [perPage]);

  useEffect(() => {
    if (pageCount <= 1 || paused) return undefined;
    const id = setInterval(() => {
      setPage((current) => {
        const next = current + 1 >= pageCount ? 0 : current + 1;
        const el = scrollerRef.current;
        if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
        return next;
      });
    }, 4500);
    return () => clearInterval(id);
  }, [pageCount, paused]);

  const gapPx = 10;
  const cellStyle = {
    width: `calc((100% - ${(perPage - 1) * gapPx}px) / ${perPage})`,
  };

  const renderCard = (product, key) => {
    const price = Number(product.price) || 0;
    const special = Number(product.special_price) || 0;
    const hasOffer = special > 0 && special < price;
    const display = hasOffer ? special : price;
    const discountPct = hasOffer
      ? Math.round(100 - (special / price) * 100)
      : 0;
    const img = productImageSrc(product);
    const model = product.model_number
      ? `(${String(product.model_number).trim()})`
      : "";

    return (
      <div
        key={key}
        className="box-border min-w-0 shrink-0"
        style={cellStyle}
      >
        <div className="relative h-full border border-gray-200 bg-white flex flex-col">
          <div className="absolute top-2 right-2 z-10">
            <ProductCard productId={product._id} />
          </div>
          <Link
            href={`/product/${product.slug}`}
            className="block h-[100px] sm:h-[120px] bg-white overflow-hidden"
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={product.name}
                className="w-full h-full object-contain p-1.5 pointer-events-none select-none"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gray-50" />
            )}
          </Link>
          <div className="px-2 pb-2 pt-0.5 flex flex-col flex-1">
            <Link href={`/product/${product.slug}`}>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 min-h-[2rem] leading-snug">
                {product.name}
              </h3>
            </Link>
            {model ? (
              <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                {model}
              </p>
            ) : null}
            <p className="mt-1 text-sm font-bold text-green-600">
              ₹ {formatPrice(display)}
            </p>
            {hasOffer && (
              <p className="text-[10px] sm:text-[11px] text-gray-600 mt-0.5">
                <span className="line-through mr-1.5">
                  ₹ {formatPrice(price)}
                </span>
                <span className="font-semibold text-gray-900">
                  {discountPct}% OFF
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!products.length) return null;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
          {name}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {seeAllHref ? (
            <Link
              href={seeAllHref}
              className="text-xs sm:text-sm font-medium text-[#0069c1] hover:underline whitespace-nowrap"
            >
              See All
            </Link>
          ) : null}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollToPage(page - 1)}
            className="h-7 w-7 sm:h-8 sm:w-8 border border-gray-300 bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200"
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollToPage(page + 1)}
            className="h-7 w-7 sm:h-8 sm:w-8 border border-gray-300 bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200"
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={scrollerRef}
          className="flex w-full gap-0 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory scrollbar-hide bg-white"
        >
          {pages.map((chunk, pageIdx) => (
            <div
              key={pageIdx}
              className="flex w-full min-w-full shrink-0 snap-start snap-always"
              style={{ gap: `${gapPx}px` }}
            >
              {chunk.map((p, i) => renderCard(p, `${p._id}-${pageIdx}-${i}`))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Storefront: main banner + side banner (left/right) + product row.
 * See All uses mainBannerHref from config.
 */
export default function CategoryBannerSideProducts({ config }) {
  const products = (config?.products || []).filter((p) => p?._id || p?.slug);
  const name = config?.name || "";
  const mainDesktop = config?.mainBannerDesktop || "";
  const mainMobile = config?.mainBannerMobile || mainDesktop;
  const mainHref = config?.mainBannerHref || "";
  const sideImage = config?.sideBannerImage || "";
  const sideHref = config?.sideBannerHref || "";
  const sidePosition = config?.sideBannerPosition === "right" ? "right" : "left";

  if (!mainDesktop || !sideImage) return null;

  const sideBlock = (
    <BannerLink
      href={sideHref}
      className="block w-full sm:w-[28%] lg:w-[24%] shrink-0 overflow-hidden rounded-sm"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sideImage}
        alt=""
        className="w-full h-full min-h-[200px] sm:min-h-[280px] object-cover"
      />
    </BannerLink>
  );

  return (
    <section className="w-full mb-8 bg-white">
      <BannerLink href={mainHref} className="block w-full mb-4 overflow-hidden rounded-sm">
        <picture>
          {mainMobile && mainMobile !== mainDesktop ? (
            <source media="(max-width: 767px)" srcSet={mainMobile} />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainDesktop}
            alt=""
            className="w-full h-auto object-cover aspect-[16/5] sm:aspect-[16/4]"
          />
        </picture>
      </BannerLink>

      <div
        className={`flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch ${
          sidePosition === "right" ? "sm:flex-row-reverse" : ""
        }`}
      >
        {sideBlock}
        <ProductRow products={products} seeAllHref={mainHref} name={name} />
      </div>
    </section>
  );
}
