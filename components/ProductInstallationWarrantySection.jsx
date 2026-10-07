"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";

/**
 * ResQ Yellow Square Logo Component
 */
function ResQYellowIcon({ className = "w-8 h-8" }) {
  return (
    <div
      className={`${className} rounded-md bg-[#facc15] flex flex-col items-center justify-center shrink-0 shadow-2xs select-none`}
      aria-label="resQ Service Logo"
    >
      <span className="text-[10px] font-black tracking-tighter text-slate-900 leading-none">
        res
      </span>
      <span className="text-[11px] font-black text-slate-900 leading-none">
        Q
      </span>
    </div>
  );
}

/**
 * ResQ Blue Square Logo Component
 */
function ResQBlueIcon({ className = "w-7 h-7" }) {
  return (
    <div
      className={`${className} rounded-md bg-[#0082cb] flex items-center justify-center shrink-0 shadow-2xs select-none`}
      aria-label="resQ Plan Logo"
    >
      <span className="text-[10px] font-black tracking-tight text-white leading-none">
        resQ
      </span>
    </div>
  );
}

/**
 * Information Icon SVG
 */
function InfoCircleIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Indian Rupee Number Formatter
 */
const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * ProductInstallationWarrantySection
 * Exact UI clone of the reference screenshot containing:
 * 1. Installation & Protection Service (Expandable / Collapsible)
 * 2. Extended Warranty (Expandable / Collapsible with 1Y, 2Y, 3Y cards)
 *
 * @param {Object} props
 * @param {Object} props.product - Current product object
 * @param {Array} [props.warranties] - Array of warranty plans from DB
 * @param {Object|null} [props.selectedWarrantyData] - Currently selected warranty object
 * @param {(warranty: Object|null, amount: number) => void} [props.onSelectWarranty] - Selection callback
 * @param {string} [props.className] - Scoped container classes
 */
export default function ProductInstallationWarrantySection({
  product = {},
  warranties = [],
  selectedWarrantyData = null,
  onSelectWarranty,
  className = "",
}) {
  const [isInstallationExpanded, setIsInstallationExpanded] = useState(true);
  const [isWarrantyExpanded, setIsWarrantyExpanded] = useState(true);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [expandedCardDetails, setExpandedCardDetails] = useState({});

  // Base price extraction
  const productPrice = useMemo(() => {
    const sp = Number(product?.special_price);
    const p = Number(product?.price);
    if (sp > 0) return sp;
    if (p > 0) return p;
    return 40990;
  }, [product?.special_price, product?.price]);

  // Product category name for contextual title
  const categoryLabel = useMemo(() => {
    if (product?.sub_category_new_name) {
      return product.sub_category_new_name.replace(/##/g, " / ");
    }
    if (product?.categoryName) {
      return product.categoryName;
    }
    return "Appliance";
  }, [product?.sub_category_new_name, product?.categoryName]);

  // Toggle expandable details on individual warranty card
  const toggleCardDetails = (cardId, e) => {
    e.stopPropagation();
    setExpandedCardDetails((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  // Build the 3 standard warranty cards (1 Year, 2 Years, 3 Years)
  // Reuses DB warranties if available; otherwise uses calculated defaults
  const warrantyCards = useMemo(() => {
    const findByYear = (yr) =>
      Array.isArray(warranties) ? warranties.find((w) => w.year === yr) : null;

    const w1 = findByYear(1);
    const w2 = findByYear(2);
    const w3 = findByYear(3);

    // Derived prices if DB has no explicit record
    const defaultP1 = Math.round(productPrice * 0.1) || 4099;
    const defaultP2 = Math.round(productPrice * 0.15) || 6099;
    const defaultP3 = Math.round(productPrice * 0.23) || 9599;

    return [
      {
        id: "w-1yr",
        year: 1,
        title: "1 Year - resQ Care Plan (RCP)",
        subtitle: "Extended Warranty",
        dbItem: w1 || {
          item_no: `W-1Y-${product?._id || "DEF"}`,
          year: 1,
          price: defaultP1,
          name: "1 Year Extended Warranty",
        },
        price: w1?.price || defaultP1,
        mrp: null,
        discountPercent: null,
        mrpLabel: "MRP (Inclusive of all taxes)",
        features: [
          "Multiple repair requests can be availed up to invoice value",
          "Extended Warranty activates after expiry of Brand warranty.",
        ],
        extraBenefits: [
          "100% Cashless repairs at brand authorized service centers",
          "Free doorstep pickup & drop for eligible products",
          "Genuine OEM spare parts replacement guarantee",
          "Priority customer support and quick turnaround time",
        ],
      },
      {
        id: "w-2yr",
        year: 2,
        title: "2 Years - resQ Care Plan (RCP)",
        subtitle: "Extended Warranty",
        dbItem: w2 || {
          item_no: `W-2Y-${product?._id || "DEF"}`,
          year: 2,
          price: defaultP2,
          name: "2 Years Extended Warranty",
        },
        price: w2?.price || defaultP2,
        mrp: Math.round((w2?.price || defaultP2) * 1.1) || 6720,
        discountPercent: 9,
        mrpLabel: null,
        features: [
          "Multiple repair requests can be availed up to invoice value",
          "Extended Warranty activates after expiry of Brand warranty.",
        ],
        extraBenefits: [
          "100% Cashless repairs at brand authorized service centers",
          "Free doorstep pickup & drop for eligible products",
          "Genuine OEM spare parts replacement guarantee",
          "Comprehensive coverage against electrical & mechanical breakdowns",
        ],
      },
      {
        id: "w-3yr",
        year: 3,
        title: "3 Years - resQ Care Plan",
        subtitle: "Extended Warranty",
        dbItem: w3 || {
          item_no: `W-3Y-${product?._id || "DEF"}`,
          year: 3,
          price: defaultP3,
          name: "3 Years Extended Warranty",
        },
        price: w3?.price || defaultP3,
        mrp: Math.round((w3?.price || defaultP3) * 1.15) || 11000,
        discountPercent: null,
        mrpLabel: null,
        features: [
          "Multiple repair requests up to full value",
          "Zero depreciated repairs covered.",
        ],
        extraBenefits: [
          "Complete peace of mind for 3 full years post brand warranty",
          "No salvage deduction or hidden repair deductions",
          "Free annual preventive maintenance check",
          "Unlimited repair visits by certified technicians",
        ],
      },
    ];
  }, [warranties, productPrice, product?._id]);

  // Handle plan Add / Remove
  const handleTogglePlan = (card) => {
    if (!onSelectWarranty) return;

    const isCurrent =
      selectedWarrantyData?.item_no === card.dbItem.item_no ||
      selectedWarrantyData?.year === card.year;

    if (isCurrent) {
      // Unselect
      onSelectWarranty(null, 0);
    } else {
      // Select
      onSelectWarranty(card.dbItem, card.price);
    }
  };

  return (
    <div className={`w-full space-y-3 font-sans text-gray-900 ${className}`}>
      {/* ========================================================
          1. INSTALLATION & PROTECTION SERVICE SECTION
         ======================================================== */}
      <div className="w-full rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
        {/* Accordion Header */}
        <div
          onClick={() => setIsInstallationExpanded((prev) => !prev)}
          className="w-full px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-gray-50/70 transition-colors"
          role="button"
          tabIndex={0}
          aria-expanded={isInstallationExpanded}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsInstallationExpanded((prev) => !prev);
            }
          }}
        >
          <div>
            <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight leading-tight">
              Installation & Protection Service
            </h4>
            <p className="text-[11px] text-gray-500 font-normal mt-0.5 leading-tight">
              Product Installation and demo
            </p>
          </div>

          {/* Expand/Collapse Arrow */}
          <div className="p-1 text-gray-400 hover:text-gray-600 transition-transform duration-200">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 transform transition-transform duration-200 ${
                isInstallationExpanded ? "rotate-180" : "rotate-0"
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

        {/* Collapsible Content */}
        {isInstallationExpanded && (
          <div className="p-3.5 sm:p-4 pt-1 sm:pt-1 bg-white">
            {/* Highlighted Service Card with Royal Blue Accent Border */}
            <div className="w-full rounded-xl border-2 border-blue-600 bg-white p-3.5 sm:p-4 shadow-2xs">
              {/* Logo + Service Title */}
              <div className="flex items-start gap-3">
                <ResQYellowIcon className="w-8 h-8" />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
                    resQ Installation Service for {categoryLabel} / Demo
                  </h5>
                </div>
              </div>

              {/* 3 Short Service Details */}
              <ul className="mt-2.5 space-y-1.5 text-[11px] sm:text-xs text-gray-600 pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-gray-400 font-bold leading-none">•</span>
                  <span>Installation location feasibility check</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-gray-400 font-bold leading-none">•</span>
                  <span>Unboxing, leveling & setup to power source</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-gray-400 font-bold leading-none">•</span>
                  <span>Product demonstration & usage instructions</span>
                </li>
              </ul>

              {/* Free Label */}
              <div className="mt-3">
                <span className="text-sm font-bold text-green-600 block leading-tight">
                  Free
                </span>
              </div>

              {/* Read more about benefits link with info icon */}
              <button
                type="button"
                onClick={() => setShowBenefitsModal(true)}
                className="mt-1 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer transition-colors"
              >
                <span>Read more about benefits</span>
                <InfoCircleIcon className="w-3.5 h-3.5 text-teal-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          2. EXTENDED WARRANTY SECTION
         ======================================================== */}
      <div className="w-full rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
        {/* Accordion Header */}
        <div
          onClick={() => setIsWarrantyExpanded((prev) => !prev)}
          className="w-full px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-gray-50/70 transition-colors"
          role="button"
          tabIndex={0}
          aria-expanded={isWarrantyExpanded}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsWarrantyExpanded((prev) => !prev);
            }
          }}
        >
          <div>
            <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight leading-tight">
              Extended Warranty
            </h4>
            <p className="text-[11px] text-gray-500 font-normal mt-0.5 leading-tight">
              Protect your purchase beyond manufacturer warranty
            </p>
          </div>

          {/* Expand/Collapse Arrow */}
          <div className="p-1 text-gray-400 hover:text-gray-600 transition-transform duration-200">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 transform transition-transform duration-200 ${
                isWarrantyExpanded ? "rotate-180" : "rotate-0"
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

        {/* Collapsible Content */}
        {isWarrantyExpanded && (
          <div className="p-3.5 sm:p-4 pt-1 sm:pt-1 bg-white">
            {/* 3 Warranty Plan Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {warrantyCards.map((card) => {
                const isSelected =
                  selectedWarrantyData?.item_no === card.dbItem.item_no ||
                  selectedWarrantyData?.year === card.year;
                const isExpanded = Boolean(expandedCardDetails[card.id]);

                return (
                  <div
                    key={card.id}
                    className={`flex flex-col justify-between rounded-xl p-3 sm:p-3.5 bg-white transition-all ${
                      isSelected
                        ? "border-2 border-blue-600 ring-2 ring-blue-50 shadow-sm"
                        : "border border-gray-200 hover:border-gray-300 hover:shadow-xs"
                    }`}
                  >
                    {/* Top: Icon + Title + Subtitle */}
                    <div>
                      <div className="flex items-start gap-2">
                        <ResQBlueIcon className="w-7 h-7" />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-[11px] sm:text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                            {card.title}
                          </h5>
                          <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                            {card.subtitle}
                          </span>
                        </div>
                      </div>

                      {/* Bullet points features */}
                      <ul className="mt-2.5 space-y-1 text-[10px] sm:text-[10.5px] text-gray-600 pl-0.5">
                        {card.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-gray-400 font-bold leading-none">•</span>
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Expandable Extra Details (+4 More / Show Less) */}
                      {isExpanded && (
                        <ul className="mt-2 pt-2 border-t border-dashed border-gray-200 space-y-1 text-[10px] text-gray-600 pl-0.5 animate-in fade-in duration-150">
                          {card.extraBenefits.map((b, idx) => (
                            <li key={idx} className="flex items-start gap-1 text-slate-700">
                              <span className="text-blue-500 font-bold leading-none">✓</span>
                              <span className="leading-snug">{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* "+4 More" interaction link */}
                      <button
                        type="button"
                        onClick={(e) => toggleCardDetails(card.id, e)}
                        className="text-[10.5px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer mt-1.5 block"
                      >
                        {isExpanded ? "Show Less" : "+4 More"}
                      </button>
                    </div>

                    {/* Bottom: Divider + Price + Add Button */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-end justify-between gap-2">
                      {/* Price info */}
                      <div className="min-w-0">
                        <span className="text-xs sm:text-[13px] font-extrabold text-gray-900 block leading-tight">
                          ₹{formatCurrency(card.price)}
                        </span>

                        {/* MRP / Discount label */}
                        {card.mrpLabel && (
                          <span className="text-[9px] text-gray-400 block leading-tight mt-0.5 truncate">
                            {card.mrpLabel}
                          </span>
                        )}

                        {card.mrp && (
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {card.discountPercent && (
                              <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1 py-0.2 rounded leading-tight">
                                {card.discountPercent}% OFF
                              </span>
                            )}
                            <span className="text-[9px] text-gray-400 line-through leading-tight">
                              MRP ₹{formatCurrency(card.mrp)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePlan(card)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer shrink-0 select-none ${
                          isSelected
                            ? "bg-blue-600 border border-blue-600 text-white shadow-2xs hover:bg-blue-700"
                            : "border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 active:scale-95"
                        }`}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? "Added ✓" : "Add"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          3. BENEFITS INFORMATION MODAL
         ======================================================== */}
      {showBenefitsModal && (
        <BenefitsModal onClose={() => setShowBenefitsModal(false)} />
      )}
    </div>
  );
}

/**
 * Benefits Information Modal
 */
function BenefitsModal({ onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const benefitList = [
    {
      title: "Certified Brand Technicians",
      description:
        "Trained and verified engineers carry out the unboxing, safety inspection, and installation.",
    },
    {
      title: "Pre-Installation Feasibility Check",
      description:
        "Comprehensive assessment of electrical supply, earthing, plumbing, and positioning before mounting.",
    },
    {
      title: "Standard Leveling & Setup",
      description:
        "Precise leveling and secure connections to power and water outlets to avoid vibration and damage.",
    },
    {
      title: "Demonstration & Usage Guidelines",
      description:
        "Walkthrough of key features, energy saving modes, operating do's and don'ts, and cleaning tips.",
    },
    {
      title: "Zero Hidden Costs",
      description:
        "Standard installation service and demo are completely Free of charge at your doorstep.",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <ResQYellowIcon className="w-6 h-6" />
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Installation & Demo Benefits
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Benefits Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {benefitList.map((item, idx) => (
            <div
              key={idx}
              className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-colors"
            >
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 mb-1">
                <span className="text-blue-600 font-black">✓</span>
                {item.title}
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed pl-4">
                {item.description}
              </p>
            </div>
          ))}

          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-[11px] text-blue-900">
            <span className="font-bold">Service Scheduling: </span>
            Our installation partner connects within 24–48 hours of successful product delivery to confirm your preferred slot.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
