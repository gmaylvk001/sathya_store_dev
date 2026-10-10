"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

/**
 * PaymentOffers Component
 * Displays eligible Bank Offers and EMI options for a product.
 * Defensively checks for undefined/null props and handles empty states.
 */
export default function PaymentOffers({ product, externalShowEmiModal, onExternalCloseEmiModal }) {
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, EMI, BANK
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

  // Adjust active tab if one of the categories is empty but was selected
  let currentTab = activeTab;
  if (!showEmi && currentTab === "EMI") currentTab = "BANK";
  if (!showBankOffers && currentTab === "BANK") currentTab = "EMI";

  return (
    <div className="w-full mt-3 border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-3 py-2.5 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
          <svg className="w-4 h-4 text-[#d72828]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          Available Offers
        </h3>
        
        {/* Tabs for toggling (only show if both exist) */}
        {showEmi && showBankOffers && (
          <div className="flex bg-gray-200 rounded p-0.5 text-[11px] font-bold uppercase">
            <button 
              onClick={() => setActiveTab("ALL")}
              className={`px-2 py-1 rounded transition-colors ${currentTab === "ALL" ? "bg-white text-[#d72828] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab("BANK")}
              className={`px-2 py-1 rounded transition-colors ${currentTab === "BANK" ? "bg-white text-[#d72828] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              Bank Offers
            </button>
            <button 
              onClick={() => setActiveTab("EMI")}
              className={`px-2 py-1 rounded transition-colors ${currentTab === "EMI" ? "bg-white text-[#d72828] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              EMI Plans
            </button>
          </div>
        )}
      </div>

      <div className="p-3 space-y-4">
        
        {/* BANK OFFERS SECTION */}
        {showBankOffers && (currentTab === "ALL" || currentTab === "BANK") && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Bank Discounts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {validBankOffers.map((offer) => (
                <div key={offer.offerId} className={`relative border rounded p-3 transition-all ${offer.isBestOffer ? 'border-green-300 bg-green-50/20' : 'border-gray-200 bg-white'}`}>
                  {offer.isBestOffer && (
                    <span className="absolute -top-2.5 right-2 bg-green-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                      Best Offer
                    </span>
                  )}
                  <div className="flex items-start gap-2.5">
                    {offer.bankLogoUrl ? (
                      <div className="w-8 h-8 shrink-0 bg-white border border-gray-100 rounded flex items-center justify-center p-0.5">
                        <img src={offer.bankLogoUrl} alt={offer.bankName} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 shrink-0 bg-gray-100 rounded flex items-center justify-center text-gray-500 font-bold text-sm">
                        {offer.bankShortCode?.[0] || 'B'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-gray-900 text-xs leading-tight">{offer.name}</h5>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-snug">{offer.description}</p>
                      
                      <div className="mt-1.5 flex items-center flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700 border border-green-200">
                          Save ₹{offer.calculatedDiscount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500">
                          Eff. Price: <strong className="text-gray-900">₹{offer.effectivePrice.toLocaleString('en-IN')}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMI OFFERS SECTION */}
        {showEmi && (currentTab === "ALL" || currentTab === "EMI") && (
          <div className="space-y-2">
            {showBankOffers && (currentTab === "ALL") && <hr className="border-gray-100 my-1" />}
            <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">EMI Plans</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {rawEmiOffers.map((offer) => (
                <div key={offer.offerId} className={`relative border rounded p-3 transition-all ${offer.isBestDeal ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200 bg-white'}`}>
                  {offer.isBestDeal && (
                    <span className="absolute -top-2.5 right-2 bg-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                      Best Deal
                    </span>
                  )}
                  {offer.isNoCost && !offer.isBestDeal && (
                    <span className="absolute -top-2.5 right-2 bg-purple-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                      No Cost EMI
                    </span>
                  )}
                  
                  <div className="flex items-start gap-2.5">
                    {offer.bankLogoUrl ? (
                      <div className="w-8 h-8 shrink-0 bg-white border border-gray-100 rounded flex items-center justify-center p-0.5">
                        <img src={offer.bankLogoUrl} alt={offer.bankName} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 shrink-0 bg-gray-100 rounded flex items-center justify-center text-gray-500 font-bold text-sm">
                        {offer.bankShortCode?.[0] || 'B'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h5 className="font-bold text-gray-900 text-xs leading-tight line-clamp-1">{offer.name}</h5>
                        <span className="text-[#d72828] font-black text-xs whitespace-nowrap">₹{offer.monthlyEmi.toLocaleString('en-IN')}/mo</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{offer.description}</p>
                      
                      <div className="mt-1.5 flex items-center flex-wrap gap-1">
                        <span className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
                          {offer.tenureMonths} Months
                        </span>
                        {!offer.isNoCost && offer.annualInterestRate > 0 && (
                          <span className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
                            {offer.annualInterestRate}% p.a.
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-gray-500 ml-1">
                          Total: <strong className="text-gray-900">₹{offer.totalPayable.toLocaleString('en-IN')}</strong>
                        </span>
                      </div>
                    </div>
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
