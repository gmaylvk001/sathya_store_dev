"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

/**
 * PaymentOffers Component
 * Displays eligible Bank Offers and EMI options for a product.
 * Defensively checks for undefined/null props and handles empty states.
 */
export default function PaymentOffers({ product, externalShowEmiModal, onExternalCloseEmiModal }) {
  const [offersData, setOffersData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Price Coercion & Debugging
  const price = Number(product?.special_price ?? product?.price ?? product?.sellingPrice ?? product?.finalPrice ?? 0);
  
  useEffect(() => {
    // Temporary console logger for debugging as requested
    console.log("[PaymentOffers] Evaluated Price:", price);
  }, [price]);

  useEffect(() => {
    if (!product?._id) return;

    let isMounted = true;
    setIsLoading(true);
    
    // Fetch from the API which utilizes our refactored offerCalculator
    fetch(`/api/products/${product._id}/payment-offers?price=${price}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setOffersData(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to fetch payment offers:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product?._id, price]);

  if (isLoading) {
    return (
      <div className="w-full mt-3 border border-gray-200 rounded-xl bg-white p-4 animate-pulse">
        <div className="h-4 w-1/3 bg-gray-200 rounded mb-4"></div>
        <div className="h-16 bg-gray-100 rounded-lg border border-gray-200"></div>
      </div>
    );
  }

  if (!offersData || typeof offersData !== "object") {
    return null;
  }

  let rawEmiOffers = Array.isArray(offersData.emiOffers) ? offersData.emiOffers : [];
  let rawBankOffers = Array.isArray(offersData.bankOffers) ? offersData.bankOffers : [];

  // 2. Strict EMI Rule
  const MIN_EMI_PRICE = 2500;
  // CRITICAL: If price < 2500, DO NOT render the EMI heading, tabs, or cards.
  if (price < MIN_EMI_PRICE) {
    rawEmiOffers = [];
  }
  const showEmi = price >= MIN_EMI_PRICE && rawEmiOffers.length > 0;

  // 3. Strict Bank Offers Filter
  const validBankOffers = rawBankOffers.filter(offer => {
    // Filter inactive offers
    if (offer.isActive === false) return false;
    
    // Filter expired offers
    if (offer.validTill && new Date(offer.validTill) < new Date()) return false;
    
    // Filter by minOrderValue
    if (price < (offer.minOrderValue || 0)) return false;
    
    // Filter by calculated discount
    if ((offer.calculatedDiscount || 0) <= 0) return false;
    
    // Filter out if effectivePrice >= price
    if ((offer.effectivePrice || price) >= price) return false;

    return true;
  });

  const showBankOffers = validBankOffers.length > 0;

  // 4. Container Collapse Rule
  if (!showEmi && !showBankOffers) {
    // NEVER display an empty card or empty container.
    return (
      <div className="mt-3 text-xs text-gray-500 italic px-2">
        Standard Payment Methods Available at Checkout
      </div>
    );
  }

  // Calculate best price for the top banner
  const maxDiscount = validBankOffers.length > 0 ? Math.max(...validBankOffers.map(o => o.calculatedDiscount || 0)) : 0;
  const bestPrice = price - maxDiscount;

  return (
    <div className="w-full mt-4">
      {/* 1. TOP ACCORDION / BEST PRICE HEADER */}
      <div className="bg-[#FFF5F5] border border-gray-200 rounded-xl px-3 py-2.5 flex items-center justify-between mb-4 cursor-pointer">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            BEST PRICE
          </span>
          <span className="text-green-600 font-bold text-sm">
            ₹{bestPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-gray-500 font-normal">with all applicable Offers</span>
          </span>
        </div>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </div>

      {/* 2. SECTION HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-800 text-base">Payment Offers</h3>
      </div>

      <div className="space-y-6">
        {/* 3. EMI OFFERS ROW */}
        {showEmi && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-gray-800">EMI Offers</h4>
              <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {rawEmiOffers.slice(0, 3).map((offer) => (
                <div key={offer.offerId} className={`border rounded-xl p-3 flex flex-col justify-between ${offer.isBestDeal ? 'border-pink-500' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    {offer.bankLogoUrl ? (
                      <div className="w-8 h-8 shrink-0 bg-white border border-gray-100 rounded-full flex items-center justify-center p-0.5 overflow-hidden">
                        <img src={offer.bankLogoUrl} alt={offer.bankName} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 shrink-0 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">
                        {offer.bankShortCode?.[0] || 'B'}
                      </div>
                    )}
                    {offer.isBestDeal ? (
                      <span className="bg-pink-100 text-pink-600 text-[9px] font-bold px-2 py-0.5 rounded-full">Best Deal</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-full">Standard EMI</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">
                      ₹{offer.monthlyEmi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{offer.tenureMonths}m
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase line-clamp-2">
                      {offer.bankName || 'BANK'} CREDIT CARD EMI ({offer.annualInterestRate}% P.A.)
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-3">
                    Effective Price: ₹{(offer.totalPayable || offer.effectivePrice || price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. BANK OFFERS ROW */}
        {showBankOffers && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-gray-800">Bank Offers</h4>
              <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {validBankOffers.slice(0, 3).map((offer) => (
                <div key={offer.offerId} className={`border rounded-xl p-3 flex flex-col justify-between ${offer.isBestOffer ? 'border-fuchsia-500' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    {offer.bankLogoUrl ? (
                      <div className="w-8 h-8 shrink-0 bg-white border border-gray-100 rounded-full flex items-center justify-center p-0.5 overflow-hidden">
                        <img src={offer.bankLogoUrl} alt={offer.bankName} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 shrink-0 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">
                        {offer.bankShortCode?.[0] || 'B'}
                      </div>
                    )}
                    {offer.isBestOffer ? (
                      <span className="bg-fuchsia-50 text-fuchsia-600 text-[9px] font-bold px-2 py-0.5 rounded-full">Best Offer</span>
                    ) : (
                      <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded-full">Credit/Debit</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-xs line-clamp-2 leading-tight">
                      {offer.name}
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-3">
                    Effective Price: ₹{offer.effectivePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
