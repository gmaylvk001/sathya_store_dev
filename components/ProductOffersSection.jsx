"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";

/**
 * Classical Bank Icon (pediment with pillars)
 */
function BankBuildingIcon({ className = "w-4 h-4", color = "currentColor" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 2L2 7h20L12 2zm-8 7h2v9H4V9zm5 0h2v9H9V9zm5 0h2v9h-2V9zm5 0h2v9h-2V9zM2 20h20v2H2v-2z" />
    </svg>
  );
}

/**
 * Iconic SBI Bank Logo SVG (Sky blue circle with white keyhole)
 */
function SBILogoIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill="#0082cb" />
      <circle cx="12" cy="10" r="3.2" fill="#ffffff" />
      <rect x="10.8" y="10" width="2.4" height="7.5" fill="#ffffff" rx="1.2" />
    </svg>
  );
}

/**
 * Iconic Axis Bank Logo SVG (Burgundy square with white chevron)
 */
function AxisLogoIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="4" fill="#881337" />
      <path d="M12 5.5l5.5 11h-3.2L12 11.8l-2.3 4.7H6.5L12 5.5z" fill="#ffffff" />
    </svg>
  );
}

/**
 * Classical Credit Card Icon
 */
function CreditCardIcon({ className = "w-4 h-4", color = "#dc2626" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
    </svg>
  );
}

/**
 * Checkmark circle icon (Solid orange circle with white checkmark)
 */
function OrangeCheckCircleIcon({ className = "w-4 h-4" }) {
  return (
    <div className={`${className} rounded-full bg-[#f97316] flex items-center justify-center shrink-0`}>
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-2.5 h-2.5 text-white"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

/**
 * Indian Rupee Number Formatter
 */
const formatIndianCurrency = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return Number(num).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * ProductOffersSection
 * Exact reference clone of Image 1 (Payment Offers / Available Offers)
 *
 * @param {Object} props
 * @param {Object} props.product - Current product details
 * @param {boolean} [props.externalShowEmiModal] - Optional trigger from parent
 * @param {() => void} [props.onExternalCloseEmiModal] - Optional close callback
 * @param {string} [props.className] - Scoped styling container classes
 */
export default function ProductOffersSection({
  product = {},
  externalShowEmiModal = false,
  onExternalCloseEmiModal,
  className = "",
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBankKey, setSelectedBankKey] = useState("hdfc");

  // Sync external EMI modal trigger if provided
  useEffect(() => {
    if (externalShowEmiModal) {
      setShowEmiModal(true);
    }
  }, [externalShowEmiModal]);

  const handleCloseEmiModal = useCallback(() => {
    setShowEmiModal(false);
    if (onExternalCloseEmiModal) {
      onExternalCloseEmiModal();
    }
  }, [onExternalCloseEmiModal]);

  // Base price extraction (prefers special_price, falls back to regular price)
  const basePrice = useMemo(() => {
    const sp = Number(product?.special_price);
    const p = Number(product?.price);
    if (sp > 0) return sp;
    if (p > 0) return p;
    return 40990; // Default sample price matching reference Image 1
  }, [product?.special_price, product?.price]);

  // Derived calculation metrics
  const offersData = useMemo(() => {
    // 6-month No Cost EMI calculation
    const emiMonths = 6;
    const emiMonthlyValue = basePrice / emiMonths;
    const emiEffectivePrice = basePrice;

    // 7.5% instant discount (max ₹15,000)
    const discountRate = 0.075;
    const maxDiscount = 15000;
    const instantDiscount = Math.min(basePrice * discountRate, maxDiscount);
    const bankEffectivePrice = Math.max(0, basePrice - instantDiscount);

    // Rounded best price displayed at top
    const bestPrice = Math.round(bankEffectivePrice);

    return {
      bestPrice,
      emiMonthly: emiMonthlyValue,
      emiEffective: emiEffectivePrice,
      bankDiscount: instantDiscount,
      bankEffective: bankEffectivePrice,
    };
  }, [basePrice]);

  // Bank offer definitions
  const emiCards = useMemo(
    () => [
      {
        id: "emi-hdfc",
        bankKey: "hdfc",
        title: "HDFC BANK CREDIT CARD - No Cost EMI",
        badge: "Best Deal",
        isHighlighted: true,
        logo: (
          <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center border border-red-100">
            <BankBuildingIcon className="w-3.5 h-3.5" color="#dc2626" />
          </div>
        ),
      },
      {
        id: "emi-sbi",
        bankKey: "sbi",
        title: "SBI BANK CREDIT CARD - No Cost EMI",
        badge: null,
        isHighlighted: false,
        logo: <SBILogoIcon className="w-6 h-6" />,
      },
      {
        id: "emi-axis",
        bankKey: "axis",
        title: "AXIS BANK CREDIT CARD - No Cost EMI",
        badge: null,
        isHighlighted: false,
        logo: <AxisLogoIcon className="w-6 h-6" />,
      },
    ],
    []
  );

  const bankCards = useMemo(
    () => [
      {
        id: "bank-1",
        title: "7.5% up to Rs. 15000 Instant...",
        badge: "Best Offer",
        isHighlighted: true,
        logo: (
          <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center border border-slate-200">
            <BankBuildingIcon className="w-3.5 h-3.5" color="#475569" />
          </div>
        ),
      },
      {
        id: "bank-2",
        title: "7.5% up to Rs. 15000 Instant...",
        badge: null,
        isHighlighted: false,
        logo: (
          <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center border border-blue-100">
            <BankBuildingIcon className="w-3.5 h-3.5" color="#2563eb" />
          </div>
        ),
      },
      {
        id: "bank-3",
        title: "7.5% up to Rs. 15000 Instant...",
        badge: null,
        isHighlighted: false,
        logo: (
          <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center border border-red-100">
            <CreditCardIcon className="w-3.5 h-3.5" color="#dc2626" />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div
      className={`w-full rounded-xl border border-gray-200/90 bg-white overflow-hidden shadow-2xs font-sans text-gray-900 ${className}`}
    >
      {/* 1. TOP HEADER BANNER (Light Blush Background with Best Price Badge & Accordion Toggle) */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full bg-[#fdf2f4] px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-[#faebee]"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Magenta / Crimson Pill Badge */}
          <span className="inline-flex items-center justify-center bg-[#d81b60] text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded tracking-wide shadow-2xs uppercase">
            BEST PRICE
          </span>

          {/* Green Price */}
          <span className="text-[#059669] font-black text-sm sm:text-[15px] tracking-tight">
            ₹{formatIndianCurrency(offersData.bestPrice)}
          </span>

          {/* Label with Blue Offers text */}
          <span className="text-slate-600 text-[11px] sm:text-xs font-normal">
            with all applicable{" "}
            <span className="text-[#2563eb] font-semibold hover:underline">Offers</span>
          </span>
        </div>

        {/* Accordion Chevron Icon */}
        <div className="p-1 text-slate-500 hover:text-slate-700 transition-transform duration-200">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transform transition-transform duration-200 ${
              isExpanded ? "rotate-180" : "rotate-0"
            }`}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* 2. COLLAPSIBLE OFFERS BODY */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 bg-white transition-all duration-300">
          {/* Main Title: Orange Check Circle + Payment Offers */}
          <div className="flex items-center gap-2 mb-3">
            <OrangeCheckCircleIcon className="w-4 h-4" />
            <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
              Payment Offers
            </h4>
          </div>

          {/* SECTION A: EMI Offers */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight">
                EMI Offers
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmiModal(true);
                }}
                className="text-[11px] sm:text-xs text-[#2563eb] font-semibold hover:text-blue-700 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* EMI Cards Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {emiCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => {
                    setSelectedBankKey(card.bankKey);
                    setShowEmiModal(true);
                  }}
                  className={`flex flex-col justify-between rounded-lg sm:rounded-xl p-2.5 sm:p-3 bg-white transition-all cursor-pointer hover:shadow-sm ${
                    card.isHighlighted
                      ? "border border-[#c7d2fe]"
                      : "border border-gray-200"
                  }`}
                >
                  {/* Top: Icon + Badge */}
                  <div className="flex items-start justify-between min-h-[22px]">
                    <div className="shrink-0">{card.logo}</div>
                    {card.badge ? (
                      <span className="bg-[#ef4444] text-white text-[8.5px] sm:text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full tracking-tight leading-none">
                        {card.badge}
                      </span>
                    ) : (
                      <div className="w-1 h-1" />
                    )}
                  </div>

                  {/* Middle: EMI Amount & Bank Name */}
                  <div className="mt-2 min-h-[46px] flex flex-col justify-start">
                    <span className="text-xs sm:text-[13px] font-extrabold text-slate-900 tracking-tight leading-tight">
                      ₹{formatIndianCurrency(offersData.emiMonthly, 2)}/6m
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold uppercase leading-tight line-clamp-2 mt-1">
                      {card.title}
                    </span>
                  </div>

                  {/* Divider Line */}
                  <div className="border-t border-slate-100 my-2" />

                  {/* Bottom: Effective Price */}
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium tracking-tight">
                    Effective Price: ₹{formatIndianCurrency(offersData.emiEffective, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Separator Line Between EMI Offers & Bank Offers */}
          <div className="border-t border-slate-200/80 my-3 sm:my-3.5" />

          {/* SECTION B: Bank Offers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight">
                Bank Offers
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBankModal(true);
                }}
                className="text-[11px] sm:text-xs text-[#2563eb] font-semibold hover:text-blue-700 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Bank Cards Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {bankCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setShowBankModal(true)}
                  className={`flex flex-col justify-between rounded-lg sm:rounded-xl p-2.5 sm:p-3 bg-white transition-all cursor-pointer hover:shadow-sm ${
                    card.isHighlighted
                      ? "border border-[#c7d2fe]"
                      : "border border-gray-200"
                  }`}
                >
                  {/* Top: Icon + Badge */}
                  <div className="flex items-start justify-between min-h-[22px]">
                    <div className="shrink-0">{card.logo}</div>
                    {card.badge ? (
                      <span className="bg-[#ef4444] text-white text-[8.5px] sm:text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full tracking-tight leading-none">
                        {card.badge}
                      </span>
                    ) : (
                      <div className="w-1 h-1" />
                    )}
                  </div>

                  {/* Middle: Offer Text */}
                  <div className="mt-2 min-h-[46px] flex flex-col justify-start">
                    <span className="text-[10px] sm:text-[11.5px] font-black text-slate-900 leading-snug line-clamp-2">
                      {card.title}
                    </span>
                  </div>

                  {/* Divider Line */}
                  <div className="border-t border-slate-100 my-2" />

                  {/* Bottom: Effective Price */}
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium tracking-tight">
                    Effective Price: ₹{formatIndianCurrency(offersData.bankEffective, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom subtle divider matching Image 1 */}
          <div className="border-t border-slate-200/60 mt-3 sm:mt-3.5" />
        </div>
      )}

      {/* 3. EMI PLANS & DETAILS MODAL */}
      {showEmiModal && (
        <EmiPlansModal
          basePrice={basePrice}
          selectedBankKey={selectedBankKey}
          onSelectBank={setSelectedBankKey}
          onClose={handleCloseEmiModal}
        />
      )}

      {/* 4. BANK OFFERS & TERMS MODAL */}
      {showBankModal && (
        <BankOffersModal
          basePrice={basePrice}
          bankEffectivePrice={offersData.bankEffective}
          onClose={() => setShowBankModal(false)}
        />
      )}
    </div>
  );
}

/**
 * Detailed EMI Plans Modal Component
 */
function EmiPlansModal({ basePrice, selectedBankKey, onSelectBank, onClose }) {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const bankOptions = [
    { key: "hdfc", name: "HDFC Bank", cards: "Credit Cards" },
    { key: "sbi", name: "SBI Card", cards: "Credit Cards" },
    { key: "axis", name: "Axis Bank", cards: "Credit Cards" },
    { key: "icici", name: "ICICI Bank", cards: "Credit & Debit Cards" },
    { key: "kotak", name: "Kotak Mahindra", cards: "Credit Cards" },
  ];

  const getTenuresForBank = (price) => {
    return [
      {
        months: 3,
        rate: 0,
        isNoCost: true,
        monthly: price / 3,
        total: price,
        note: "No Cost EMI",
      },
      {
        months: 6,
        rate: 0,
        isNoCost: true,
        monthly: price / 6,
        total: price,
        note: "Best Deal (No Cost)",
      },
      {
        months: 9,
        rate: 14,
        isNoCost: false,
        monthly: (price * (1 + (0.14 * 9) / 12)) / 9,
        total: price * (1 + (0.14 * 9) / 12),
        note: "Standard EMI (14% p.a.)",
      },
      {
        months: 12,
        rate: 15,
        isNoCost: false,
        monthly: (price * (1 + 0.15)) / 12,
        total: price * (1 + 0.15),
        note: "Standard EMI (15% p.a.)",
      },
      {
        months: 18,
        rate: 15.5,
        isNoCost: false,
        monthly: (price * (1 + (0.155 * 18) / 12)) / 18,
        total: price * (1 + (0.155 * 18) / 12),
        note: "Standard EMI (15.5% p.a.)",
      },
    ];
  };

  const tenures = getTenuresForBank(basePrice);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
          <div>
            <h3 className="text-base font-bold text-gray-900">EMI Plans & Options</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Payable amount:{" "}
              <strong className="text-gray-900">
                ₹{formatIndianCurrency(basePrice, 2)}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Bank Selection Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 px-4 pt-2 bg-white gap-2 scrollbar-none">
          {bankOptions.map((bank) => (
            <button
              key={bank.key}
              onClick={() => onSelectBank(bank.key)}
              className={`pb-2.5 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                selectedBankKey === bank.key
                  ? "border-[#d81b60] text-[#d81b60]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {bank.name}
            </button>
          ))}
        </div>

        {/* EMI Plans Table */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <div className="overflow-hidden border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3">EMI Plan</th>
                  <th className="p-3">Monthly EMI</th>
                  <th className="p-3">Interest</th>
                  <th className="p-3 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenures.map((t) => (
                  <tr
                    key={t.months}
                    className={`hover:bg-gray-50 transition-colors ${
                      t.isNoCost ? "bg-green-50/30" : ""
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-bold text-gray-900">
                        {t.months} Months
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          t.isNoCost
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t.note}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-gray-900">
                      ₹{formatIndianCurrency(t.monthly, 2)}
                    </td>
                    <td className="p-3 text-gray-600">
                      {t.isNoCost ? (
                        <span className="font-bold text-green-600">0% No Cost</span>
                      ) : (
                        `${t.rate}% p.a.`
                      )}
                    </td>
                    <td className="p-3 text-right font-bold text-gray-900">
                      ₹{formatIndianCurrency(t.total, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-blue-900 space-y-1">
            <p className="font-bold">Important EMI Terms:</p>
            <p>
              • <strong>No Cost EMI:</strong> The bank interest amount is provided as an
              instant discount at checkout.
            </p>
            <p>
              • Taxes (GST) and one-time bank processing fees may apply as per individual bank policy.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Detailed Bank Offers & Terms Modal Component
 */
function BankOffersModal({ basePrice, bankEffectivePrice, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const bankOffersList = [
    {
      bank: "HDFC Bank",
      badge: "Best Offer",
      title: "7.5% Instant Discount up to ₹15,000 on HDFC Bank Credit Card EMI",
      description:
        "Applicable on credit card EMI transactions with min. cart value ₹5,000. Maximum discount capped at ₹15,000.",
      code: "NO CODE REQUIRED",
    },
    {
      bank: "State Bank of India (SBI)",
      badge: "Instant Discount",
      title: "7.5% Instant Discount up to ₹15,000 on SBI Credit Cards",
      description:
        "Valid on non-EMI and EMI transactions. Minimum order value ₹5,000.",
      code: "NO CODE REQUIRED",
    },
    {
      bank: "Axis Bank",
      badge: "Instant Discount",
      title: "7.5% Instant Discount up to ₹15,000 on Axis Bank Credit Cards",
      description:
        "Valid on select electronics and appliances with Axis Bank Credit Cards.",
      code: "NO CODE REQUIRED",
    },
    {
      bank: "ICICI Bank",
      badge: "Flat Cashback",
      title: "Flat ₹1,000 Instant Discount on ICICI Bank Cards",
      description:
        "Applicable on purchases above ₹10,000 via NetBanking and Debit/Credit Cards.",
      code: "ICICI1000",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
          <div>
            <h3 className="text-base font-bold text-gray-900">All Available Bank Offers</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Effective Price with Best Offer:{" "}
              <strong className="text-green-700">
                ₹{formatIndianCurrency(bankEffectivePrice, 2)}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Offers List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {bankOffersList.map((offer, idx) => (
            <div
              key={idx}
              className="p-3.5 border border-gray-200 rounded-xl hover:border-gray-300 transition-all bg-white"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-900">{offer.bank}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {offer.badge}
                </span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-800 mb-1 leading-snug">
                {offer.title}
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                {offer.description}
              </p>
              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                <span>Discount applied at payment step</span>
                <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                  {offer.code}
                </span>
              </div>
            </div>
          ))}

          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-[11px] text-amber-900">
            <span className="font-bold">Terms & Conditions: </span>
            Offers are valid for a limited period only. Bank discount is automatically
            applied on the checkout payment gateway upon entering eligible card details.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
