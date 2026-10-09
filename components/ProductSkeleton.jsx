"use client";

import React from "react";

export default function ProductSkeleton() {
  return (
    <div className="bg-white min-h-[80vh] w-full animate-pulse">
      <div className="container mx-auto px-2 md:px-4 pt-3 pb-12">
        {/* Top Breadcrumb Placeholder */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-3.5 w-16 bg-gray-200 rounded"></div>
          <div className="h-3.5 w-3 bg-gray-200 rounded"></div>
          <div className="h-3.5 w-24 bg-gray-200 rounded"></div>
          <div className="h-3.5 w-3 bg-gray-200 rounded"></div>
          <div className="h-3.5 w-36 bg-gray-200 rounded"></div>
          <div className="h-3.5 w-3 bg-gray-200 rounded hidden sm:block"></div>
          <div className="h-3.5 w-48 bg-gray-200 rounded hidden sm:block"></div>
        </div>

        {/* ================= MOBILE VIEW (Hidden on Desktop) ================= */}
        <div className="block lg:hidden w-full space-y-4">
          {/* Main Image Box */}
          <div className="w-full aspect-square bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl border border-gray-200 flex items-center justify-center p-8 relative overflow-hidden">
            <div className="w-24 h-24 rounded-full bg-gray-300/40"></div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-lg bg-gray-200 border border-gray-300 flex-shrink-0"
              ></div>
            ))}
          </div>

          {/* Product Info */}
          <div className="space-y-3 pt-2">
            <div className="h-3.5 w-28 bg-red-100 rounded"></div>
            <div className="h-5 w-11/12 bg-gray-200 rounded"></div>
            <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-40 bg-gray-200 rounded"></div>

            {/* Price block */}
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="h-8 w-44 bg-red-100 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 pt-3">
              <div className="h-11 flex-1 bg-red-200 rounded-lg"></div>
              <div className="h-11 flex-1 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* ================= DESKTOP VIEW (3 Columns) ================= */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 items-start mt-2 w-full">
          {/* COLUMN 1: Gallery (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="border border-gray-200 rounded-xl p-4 bg-white relative aspect-square w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100">
              <div className="w-28 h-28 rounded-2xl bg-gray-200/80"></div>
            </div>

            {/* Thumbnail Row */}
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0"
                ></div>
              ))}
            </div>

            {/* Action buttons (Share / Wishlist) */}
            <div className="flex gap-3 mt-1">
              <div className="h-9 flex-1 bg-gray-100 border border-gray-200 rounded-md"></div>
              <div className="h-9 flex-1 bg-gray-100 border border-gray-200 rounded-md"></div>
            </div>
          </div>

          {/* COLUMN 2: Details (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            {/* Brand */}
            <div className="h-3.5 w-32 bg-red-100 rounded"></div>

            {/* Title (2 lines) */}
            <div className="space-y-2">
              <div className="h-6 w-full bg-gray-200 rounded"></div>
              <div className="h-6 w-4/5 bg-gray-200 rounded"></div>
            </div>

            {/* Stock & SKU */}
            <div className="flex items-center gap-3">
              <div className="h-5 w-24 bg-green-100 rounded-full"></div>
              <div className="h-4 w-36 bg-gray-100 rounded"></div>
            </div>

            {/* Rating badge */}
            <div className="h-5 w-36 bg-gray-200 rounded"></div>

            {/* Price Box */}
            <div className="border-t border-b border-gray-200 py-4 my-1 space-y-2">
              <div className="flex items-baseline gap-3">
                <div className="h-8 w-44 bg-red-100 rounded"></div>
                <div className="h-4 w-28 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-green-100 rounded"></div>
              </div>
              <div className="h-3.5 w-56 bg-gray-100 rounded"></div>
            </div>

            {/* Pincode & Delivery */}
            <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-8 w-44 bg-white border border-gray-200 rounded-md"></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 bg-white border border-gray-200 rounded-md"></div>
                <div className="h-12 bg-white border border-gray-200 rounded-md"></div>
              </div>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-9 bg-gray-50 border border-gray-200 rounded-md"></div>
              <div className="h-9 bg-gray-50 border border-gray-200 rounded-md"></div>
            </div>
          </div>

          {/* COLUMN 3: Buy Box & Offers (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Action Buttons Box */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3 shadow-sm">
              <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
              <div className="h-11 w-full bg-red-600/20 rounded-lg"></div>
              <div className="h-11 w-full bg-gray-100 border border-gray-300 rounded-lg"></div>
            </div>

            {/* Frequently Bought Together Placeholder */}
            <div className="border border-gray-200 rounded-xl p-3.5 bg-white space-y-3 shadow-sm">
              <div className="h-4 w-40 bg-gray-200 rounded border-b border-gray-100 pb-2"></div>
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full bg-gray-200 rounded"></div>
                  <div className="h-3 w-16 bg-red-100 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full bg-gray-200 rounded"></div>
                  <div className="h-3 w-16 bg-red-100 rounded"></div>
                </div>
              </div>
            </div>

            {/* Extra Benefits */}
            <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50 space-y-2">
              <div className="h-3.5 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-full bg-gray-200/70 rounded"></div>
              <div className="h-3 w-4/5 bg-gray-200/70 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
