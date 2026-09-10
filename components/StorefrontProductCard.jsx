"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import AddToWishlistButton from "@/components/ProductCard";
import ProductAddtoCart from "@/components/AddToCart";

export default function StorefrontProductCard({
  product,
  brandMap = {},
  onProductClick,
  className = "",
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!product) return null;

  const hasDiscount =
    Number(product.special_price) > 0 &&
    Number(product.special_price) < Number(product.price);

  const discountPercent = hasDiscount
    ? Math.round(
        100 - (Number(product.special_price) / Number(product.price)) * 100
      )
    : 0;

  const currentPrice = hasDiscount ? product.special_price : product.price || 0;
  const originalPrice = product.price || 0;

  const brandName =
    brandMap[product.brand] ||
    product.brand_name ||
    (typeof product.brand === "string" ? product.brand : "") ||
    "";

  const inStock =
    product.stock_status === "In Stock" && Number(product.quantity) > 0;

  const ratingValue = Number(
    product.avgRating || product.rating || product.average_rating || 0
  );
  const reviewCount = Number(
    product.reviewCount || product.reviews_count || product.numReviews || 0
  );

  // const imgSrc = product.images?.[0]
  //   ? product.images[0].startsWith("http")
  //     ? product.images[0]
  //     : `/uploads/products/${product.images[0]}`
  //   : "/uploads/products/placeholder.jpg";
  const tempURL = "https://www.sathya.store/img/product/";
  const imagepathname = product.images?.[0] || "";
  const imgSrc = imagepathname
    ? (imagepathname.startsWith("http") ? imagepathname : `${tempURL}${imagepathname.replace(/^\/?(uploads\/products\/)?/, "").replace(/^\/+/, "")}`)
    : "/uploads/products/placeholder.jpg";

  const productUrl = `/product/${product.slug || product._id}`;

  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <div
      className={`group relative bg-white rounded-[16px] border border-red-200/90 hover:border-[#d72828] shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden w-full select-none ${className}`}
    >
      {/* Top Image Container */}
      <div className="relative h-[150px] sm:h-[170px] w-full bg-[#f9fafb] flex items-center justify-center p-3 overflow-hidden">
        {hasDiscount && (
          <span className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs tracking-wide">
            -{discountPercent}%
          </span>
        )}

        <div className="absolute top-2.5 right-2.5 z-10">
          <AddToWishlistButton
            productId={product._id}
            iconSize={14}
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md shadow-xs border border-gray-100 flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all text-gray-600 hover:text-rose-600"
          />
        </div>

        <Link
          href={productUrl}
          onClick={handleClick}
          className="relative w-full h-full flex items-center justify-center"
        >
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gray-100/60 animate-pulse rounded-lg" />
          )}
          <Image
            src={imgSrc}
            alt={product.name || "Product Image"}
            fill
            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 20vw"
            className={`object-contain p-2 group-hover:scale-105 transition-transform duration-300 ease-out ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              setImgLoaded(true);
              if (e?.currentTarget) {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/uploads/products/placeholder.jpg";
              }
            }}
            unoptimized
          />
        </Link>
      </div>

      {/* Content Area */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 bg-white">
        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider truncate mb-1 block">
          {brandName || "SATHYA"}
        </span>

        <Link href={productUrl} onClick={handleClick} className="block mb-1.5">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#d72828] transition-colors leading-snug line-clamp-2 h-[2.4rem]">
            {product.name}
          </h4>
        </Link>

        <div className="flex items-center gap-1.5 mb-1.5 h-4">
          {ratingValue > 0 ? (
            <>
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                <FaStar className="text-amber-500 text-[9px]" />
                <span>{ratingValue.toFixed(1)}</span>
              </div>
              {reviewCount > 0 && (
                <span className="text-[10px] text-gray-400 font-medium">
                  ({reviewCount})
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
              <FaStar className="text-gray-300 text-[9px]" />
              <span>4.5</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline flex-wrap gap-1.5 mb-1.5">
          <span className="text-sm sm:text-base font-extrabold text-[#d72828] tracking-tight">
            ₹ {Number(currentPrice).toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through font-normal">
              ₹ {Number(originalPrice).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className="mb-2.5">
          {inStock ? (
            <span className="text-[10px] font-semibold text-emerald-600 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              In Stock
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-rose-500 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Out of Stock
            </span>
          )}
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <ProductAddtoCart
            productId={product._id}
            stockQuantity={product.quantity}
            special_price={product.special_price}
            className="w-full text-xs font-bold py-1.5 rounded-xl transition-all shadow-2xs"
            movement={product.movement}
            productName={product.name}
            productSlug={product.slug}
          />
        </div>
      </div>
    </div>
  );
}
