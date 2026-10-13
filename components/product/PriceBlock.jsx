import React from "react";

export default function PriceBlock({ price, mrp, priceClass = "text-sm sm:text-base" }) {
  const safePrice = Number(price) || 0;
  const safeMrp = Number(mrp) || 0;

  const hasDiscount = safeMrp > safePrice;
  const discountPercent = hasDiscount
    ? Math.round(((safeMrp - safePrice) / safeMrp) * 100)
    : 0;

  const formatter = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  });

  const formattedPrice = formatter.format(Math.round(safePrice));
  const formattedMrp = formatter.format(Math.round(safeMrp));

  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mb-1.5 leading-tight">
      {/* 1. Price */}
      <span className={`font-bold text-[#d72828] shrink-0 tracking-tight ${priceClass}`}>
        ₹{formattedPrice}
      </span>

      {/* 2. MRP (strikethrough) - reduced size to fit in 1 line */}
      {hasDiscount && (
        <span className="text-[10px] sm:text-[11px] text-gray-400 line-through shrink-0 font-normal">
          MRP ₹{formattedMrp}
        </span>
      )}

      {/* 3. Offer (% OFF) */}
      {hasDiscount && (
        <span className="text-[10px] sm:text-[11.5px] font-bold text-emerald-600 shrink-0 tracking-tight">
          {discountPercent}% OFF
        </span>
      )}
    </div>
  );
}
