"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ProductCard from "@/components/ProductCard";

function usePerPage() {
  const [perPage, setPerPage] = useState(5);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setPerPage(2);
      else if (w < 900) setPerPage(3);
      else if (w < 1100) setPerPage(4);
      else if (w < 1280) setPerPage(5);
      else setPerPage(5);
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

function resolveHref(raw) {
  const link = String(raw || "").trim();
  if (!link) return "";
  if (/^https?:\/\//i.test(link) || link.startsWith("/")) return link;
  return `/category/${link.replace(/^\/+/, "")}`;
}

function BannerLink({ href, children, className = "", style }) {
  if (!href) return <div className={className} style={style}>{children}</div>;
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a
        href={href}
        className={className}
        style={style}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}

function RelatedProducts({ products, seeAllHref, name }) {
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

  const gapPx = 12;
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
            className="block h-[110px] sm:h-[130px] bg-white overflow-hidden"
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={product.name}
                className="w-full h-full object-contain p-1.5 sm:p-2 pointer-events-none select-none"
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
            <p className="mt-1 text-sm font-bold text-gray-900">
              ₹ {formatPrice(display)}
            </p>
            {hasOffer && (
              <p className="text-[10px] sm:text-[11px] text-gray-600 mt-0.5 flex flex-wrap items-center gap-x-2">
                <span className="line-through">₹ {formatPrice(price)}</span>
                <span className="font-semibold text-red-600">
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
    <div className="w-full mt-6">
      <div className="flex items-center justify-between gap-3 mb-3 px-1">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
          {name}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {seeAllHref ? (
            <Link
              href={seeAllHref}
              className="text-sm font-medium text-[#0069c1] hover:underline"
            >
              See All
            </Link>
          ) : null}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollToPage(page - 1)}
            className="h-8 w-8 border border-gray-300 bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200"
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollToPage(page + 1)}
            className="h-8 w-8 border border-gray-300 bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={scrollerRef}
          className="flex w-full overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory scrollbar-hide bg-white"
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
 * Storefront: top banner + 3 or 4 tiles on colored BG + related products.
 * Banner & tiles: display at exact uploaded size; if too large, shrink to fit
 * (tiles max 450×450) without cropping.
 */
const TILE_MAX_DISPLAY = 450;

function getDisplaySize(naturalWidth, naturalHeight, maxSide = TILE_MAX_DISPLAY) {
  const nw = naturalWidth || 0;
  const nh = naturalHeight || 0;
  if (nw <= 0 || nh <= 0) return null;
  if (nw <= maxSide && nh <= maxSide) {
    return { width: nw, height: nh };
  }
  const scale = Math.min(maxSide / nw, maxSide / nh);
  return {
    width: Math.round(nw * scale),
    height: Math.round(nh * scale),
  };
}

function ExactSizeImage({ src, alt = "", maxSide, className = "" }) {
  const [displaySize, setDisplaySize] = useState(null);

  const handleLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (maxSide != null) {
      setDisplaySize(getDisplaySize(naturalWidth, naturalHeight, maxSide));
      return;
    }
    // Banner: keep exact pixel size (container may shrink via maxWidth)
    setDisplaySize({ width: naturalWidth, height: naturalHeight });
  };

  const style =
    maxSide != null
      ? displaySize
        ? {
            width: `${displaySize.width}px`,
            height: `${displaySize.height}px`,
            maxWidth: "100%",
          }
        : {
            width: "auto",
            height: "auto",
            maxWidth: "100%",
            maxHeight: `${maxSide}px`,
          }
      : displaySize
        ? {
            width: `${displaySize.width}px`,
            maxWidth: "100%",
            height: "auto",
          }
        : {
            width: "auto",
            height: "auto",
            maxWidth: "100%",
          };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onLoad={handleLoad}
      style={style}
      className={`block object-contain ${className}`}
      draggable={false}
    />
  );
}

export default function CategoryBannerFourProducts({ config }) {
  const bannerDesktop = config?.bannerDesktop || "";
  const bannerMobile = config?.bannerMobile || bannerDesktop;
  const bannerHref = config?.bannerHref || "";
  const tilesBgColor = config?.tilesBgColor || "#0d9488";
  const tiles = (config?.tiles || []).filter((t) => t?.image);
  const products = (config?.products || []).filter((p) => p?._id || p?.slug);
  const name = config?.name || "";

  if (!bannerDesktop || tiles.length < 3) return null;

  const visibleTiles = tiles.slice(0, 4);
  const tileGridClass =
    visibleTiles.length === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : "grid-cols-2 md:grid-cols-4";

  return (
    <section className="w-full mb-8 bg-white">
      <BannerLink
        href={bannerHref}
        className="flex w-full items-center justify-center overflow-hidden rounded-sm"
      >
        <picture className="flex w-full items-center justify-center">
          {bannerMobile && bannerMobile !== bannerDesktop ? (
            <source media="(max-width: 767px)" srcSet={bannerMobile} />
          ) : null}
          <ExactSizeImage src={bannerDesktop} alt="" className="mx-auto" />
        </picture>
      </BannerLink>

      <div
        className="w-full px-2 sm:px-3 py-3 sm:py-4 rounded-sm"
        style={{ backgroundColor: tilesBgColor }}
      >
        <div
          className={`grid ${tileGridClass} gap-2 sm:gap-3 place-items-center`}
        >
          {visibleTiles.map((tile, idx) => {
            const href = resolveHref(tile.url);
            return (
              <BannerLink
                key={idx}
                href={href}
                className="flex items-center justify-center w-full min-w-0 overflow-hidden rounded-md hover:opacity-95 transition-opacity"
              >
                <ExactSizeImage
                  src={tile.image}
                  alt=""
                  maxSide={TILE_MAX_DISPLAY}
                />
              </BannerLink>
            );
          })}
        </div>
      </div>

      <RelatedProducts
        products={products}
        seeAllHref={bannerHref}
        name={name}
      />
    </section>
  );
}
