/**
 * High-Precision Payment Offers & EMI Calculation Engine
 * Sathya Store E-Commerce
 *
 * Implements:
 * 1. Reducing Balance Method for EMI calculations:
 *    E = [P * r * (1+r)^n] / [(1+r)^n - 1]
 *    where r = annualInterestRate / (12 * 100), n = tenureMonths
 *    - No-Cost EMI: Interest subsidized by merchant/bank, user pays exact principal P.
 *    - Standard EMI: effectivePrice = E * n (total repayment reflecting interest).
 *
 * 2. Instant Discount Calculations:
 *    discount = min(P * (discountValue / 100), maxDiscountLimit) [for PERCENTAGE]
 *    discount = min(discountValue, maxDiscountLimit) [for FLAT]
 *    effectivePrice = P - discount
 *
 * 3. Best Price & Badge Resolvers:
 *    - Single lowest effectivePrice among bank offers feeds BEST PRICE.
 *    - Highest discount bank offer marked with "Best Offer" badge.
 *    - Lowest monthly installment or optimal No-Cost EMI marked with "Best Deal" badge.
 */

/**
 * Safe 2-decimal monetary rounding
 * @param {number|string} val
 * @returns {number}
 */
export function roundToTwoDecimals(val) {
  const num = Number(val);
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Extract canonical selling price from a product object or numeric value
 * @param {object|number} product
 * @returns {number}
 */
export function getSellingPrice(product) {
  if (typeof product === "number") return roundToTwoDecimals(Math.max(0, product));
  if (!product || typeof product !== "object") return 0;

  const sp = Number(product.special_price);
  const p = Number(product.price);
  if (!isNaN(sp) && sp > 0) return roundToTwoDecimals(sp);
  if (!isNaN(p) && p > 0) return roundToTwoDecimals(p);
  return 0;
}

/**
 * 1. Reducing Balance EMI Calculation
 *
 * @param {number} principal - Product selling price (P)
 * @param {number} tenureMonths - Number of months (n)
 * @param {number} annualInterestRate - Annual rate percentage (e.g. 14 for 14% p.a.)
 * @param {boolean} isNoCost - Whether interest is subsidized (No-Cost EMI)
 * @returns {object} EMI calculation breakdown
 */
export function calculateEmi(
  principal,
  tenureMonths,
  annualInterestRate = 0,
  isNoCost = false
) {
  const P = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Math.round(Number(tenureMonths) || 1));
  const annual = Math.max(0, Number(annualInterestRate) || 0);
  const noCost = Boolean(isNoCost);

  if (P === 0) {
    return {
      monthlyEmi: 0,
      totalPayable: 0,
      totalInterest: 0,
      effectivePrice: 0,
      subventionDiscount: 0,
      isNoCost: noCost,
      tenureMonths: n,
      annualInterestRate: annual,
    };
  }

  // Case A: No-Cost EMI (or 0% interest)
  if (noCost || annual === 0) {
    const monthlyEmi = roundToTwoDecimals(P / n);
    const effectivePrice = roundToTwoDecimals(P);
    const totalPayable = roundToTwoDecimals(P);

    // Calculate subvention discount if a standard rate was provided
    let subventionDiscount = 0;
    if (annual > 0) {
      const r = annual / (12 * 100);
      const factor = Math.pow(1 + r, n);
      const standardEmi = (P * r * factor) / (factor - 1);
      const standardTotal = standardEmi * n;
      subventionDiscount = roundToTwoDecimals(Math.max(0, standardTotal - P));
    }

    return {
      monthlyEmi,
      totalPayable,
      totalInterest: 0,
      effectivePrice,
      subventionDiscount,
      isNoCost: true,
      tenureMonths: n,
      annualInterestRate: annual,
    };
  }

  // Case B: Standard Reducing-Balance EMI
  const r = annual / (12 * 100);
  const factor = Math.pow(1 + r, n);
  const rawEmi = (P * r * factor) / (factor - 1);
  const monthlyEmi = roundToTwoDecimals(rawEmi);
  const totalPayable = roundToTwoDecimals(monthlyEmi * n);
  const totalInterest = roundToTwoDecimals(Math.max(0, totalPayable - P));
  const effectivePrice = totalPayable; // Fixes bug where ₹35,000 was shown instead of total repayment

  return {
    monthlyEmi,
    totalPayable,
    totalInterest,
    effectivePrice,
    subventionDiscount: 0,
    isNoCost: false,
    tenureMonths: n,
    annualInterestRate: annual,
  };
}

/**
 * 2. Instant Discount Calculation
 *
 * @param {number} principal - Product selling price (P)
 * @param {string} discountType - "PERCENTAGE" | "FLAT"
 * @param {number} discountValue - Percentage rate or flat amount
 * @param {number} maxDiscountLimit - Cap on maximum discount (0 = no cap)
 * @returns {object} { discount, effectivePrice }
 */
export function calculateInstantDiscount(
  principal,
  discountType = "PERCENTAGE",
  discountValue = 0,
  maxDiscountLimit = 0
) {
  const P = Math.max(0, Number(principal) || 0);
  const val = Math.max(0, Number(discountValue) || 0);
  const cap = Math.max(0, Number(maxDiscountLimit) || 0);
  const type = String(discountType || "PERCENTAGE").toUpperCase();

  if (P === 0 || val === 0) {
    return {
      discount: 0,
      effectivePrice: P,
    };
  }

  let rawDiscount = 0;
  if (type === "PERCENTAGE") {
    rawDiscount = P * (val / 100);
  } else {
    // FLAT / FIXED
    rawDiscount = val;
  }

  let discount = rawDiscount;
  if (cap > 0) {
    discount = Math.min(rawDiscount, cap);
  }

  // Discount cannot exceed product principal price
  discount = Math.min(discount, P);
  discount = roundToTwoDecimals(discount);
  const effectivePrice = roundToTwoDecimals(P - discount);

  return {
    discount,
    effectivePrice,
  };
}

/**
 * Check if an offer is eligible for a given price, category, and date
 *
 * @param {object} offer - PaymentOffer document or plain object
 * @param {number} productPrice - Product selling price
 * @param {string|null} categoryId - Optional category ID / slug
 * @param {Date} [currentDate=new Date()] - Reference date
 * @returns {boolean}
 */
export function isOfferEligible(
  offer,
  productPrice,
  categoryId = null,
  currentDate = new Date()
) {
  if (!offer || typeof offer !== "object") return false;

  // 1. Active status check
  const isActive =
    offer.isActive !== false &&
    offer.status !== "INACTIVE" &&
    offer.status !== "Inactive";
  if (!isActive) return false;

  // 2. Validity date range check
  const now = currentDate.getTime();
  if (offer.validFrom) {
    const fromTime = new Date(offer.validFrom).getTime();
    if (!isNaN(fromTime) && now < fromTime) return false;
  }
  if (offer.validTill) {
    const tillTime = new Date(offer.validTill).getTime();
    if (!isNaN(tillTime) && now > tillTime) return false;
  }

  // 3. Minimum order value check
  const minOrder = Number(
    offer.minOrderValue ?? offer.minimumTransactionAmount ?? 0
  );
  if (minOrder > 0 && productPrice < minOrder) {
    return false;
  }

  // 4. Category eligibility check
  const applicableCategories =
    offer.applicableCategories || offer.applicableCategoryIds || ["ALL"];
  if (
    Array.isArray(applicableCategories) &&
    applicableCategories.length > 0 &&
    !applicableCategories.includes("ALL") &&
    categoryId
  ) {
    const catStr = String(categoryId);
    const matchesCategory = applicableCategories.some((c) => String(c) === catStr);
    if (!matchesCategory) return false;
  }

  return true;
}

/**
 * Standard default bank registry for seamless zero-config fallback
 */
export const DEFAULT_BANKS = [
  { code: "HDFC", name: "HDFC Bank", logoUrl: "/images/banks/hdfc.svg" },
  { code: "SBI", name: "State Bank of India", logoUrl: "/uploads/banks/sbi.png" },
  { code: "AXIS", name: "Axis Bank", logoUrl: "/uploads/banks/axis.png" },
  { code: "ICICI", name: "ICICI Bank", logoUrl: "/uploads/banks/icici.png" },
  { code: "KOTAK", name: "Kotak Mahindra Bank", logoUrl: "/uploads/banks/kotak.png" },
];

/**
 * Generate standard fallback offers when DB offers are not available
 * @param {number} price
 * @returns {Array<object>}
 */
export function generateDefaultOffers(price) {
  const p = Math.max(0, Number(price) || 0);

  return [
    // Bank Instant Discount Offers
    {
      offerId: "bank-hdfc-7-5",
      offerType: "BANK_OFFER",
      bank: { code: "HDFC", name: "HDFC Bank", logoUrl: "/images/banks/hdfc.svg" },
      discountType: "PERCENTAGE",
      discountValue: 7.5,
      maxDiscountLimit: 15000,
      minOrderValue: 5000,
      cardType: "ALL",
      badge: "Credit/Debit",
      name: "HDFC Bank Cards",
      description: "HDFC Bank Cards - Full payment and standard Credit Card EMI available at checkout",
      isActive: true,
    },
    {
      offerId: "bank-sbi-7-5",
      offerType: "BANK_OFFER",
      bank: { code: "SBI", name: "State Bank of India", logoUrl: "/uploads/banks/sbi.png" },
      discountType: "PERCENTAGE",
      discountValue: 7.5,
      maxDiscountLimit: 15000,
      minOrderValue: 5000,
      cardType: "ALL",
      badge: "Credit/Debit",
      name: "SBI Cards & NetBanking",
      description: "SBI Cards & NetBanking - Full payment and standard Credit Card EMI available at checkout",
      isActive: true,
    },
    {
      offerId: "bank-axis-7-5",
      offerType: "BANK_OFFER",
      bank: { code: "AXIS", name: "Axis Bank", logoUrl: "/uploads/banks/axis.png" },
      discountType: "PERCENTAGE",
      discountValue: 7.5,
      maxDiscountLimit: 15000,
      minOrderValue: 5000,
      cardType: "ALL",
      badge: "Credit/Debit",
      name: "Axis Bank Cards & NetBanking",
      description: "Axis Bank Cards & NetBanking - Full payment and standard Credit Card EMI available at checkout",
      isActive: true,
    },
    {
      offerId: "bank-icici-flat",
      offerType: "BANK_OFFER",
      bank: { code: "ICICI", name: "ICICI Bank", logoUrl: "/uploads/banks/icici.png" },
      discountType: "FLAT",
      discountValue: 1500,
      maxDiscountLimit: 1500,
      minOrderValue: 10000,
      cardType: "ALL",
      badge: "Credit/Debit",
      name: "ICICI Bank Cards",
      description: "ICICI Bank Cards & NetBanking - Flat ₹1,500 Instant Discount on orders above ₹10,000",
      isActive: true,
    },
    // EMI Offers (Top 3 for primary cards)
    {
      offerId: "emi-hdfc-6m",
      offerType: "EMI_OFFER",
      bank: { code: "HDFC", name: "HDFC Bank", logoUrl: "/images/banks/hdfc.svg" },
      emiDetails: { tenureMonths: 6, annualInterestRate: 14, isNoCost: false },
      minOrderValue: 3000,
      cardType: "CREDIT",
      badge: "Standard EMI",
      name: "HDFC Bank 6 Months Standard EMI",
      description: "HDFC BANK CREDIT CARD EMI (14% P.A.)",
      isActive: true,
    },
    {
      offerId: "emi-sbi-6m",
      offerType: "EMI_OFFER",
      bank: { code: "SBI", name: "State Bank of India", logoUrl: "/uploads/banks/sbi.png" },
      emiDetails: { tenureMonths: 6, annualInterestRate: 14, isNoCost: false },
      minOrderValue: 2500,
      cardType: "CREDIT",
      badge: "Standard EMI",
      name: "SBI Bank 6 Months Standard EMI",
      description: "SBI BANK CREDIT CARD EMI (14% P.A.)",
      isActive: true,
    },
    {
      offerId: "emi-axis-6m",
      offerType: "EMI_OFFER",
      bank: { code: "AXIS", name: "Axis Bank", logoUrl: "/uploads/banks/axis.png" },
      emiDetails: { tenureMonths: 6, annualInterestRate: 14, isNoCost: false },
      minOrderValue: 2500,
      cardType: "CREDIT",
      badge: "Standard EMI",
      name: "Axis Bank 6 Months Standard EMI",
      description: "AXIS BANK CREDIT CARD EMI (14% P.A.)",
      isActive: true,
    },
  ];
}

/**
 * 3. High-Precision Best Price & Offers Resolver
 *
 * Scans all applicable offers for the product price and category.
 * Determines:
 * - bestPrice: Single lowest effectivePrice across eligible bank offers.
 * - bestOffer: Highest-discount bank offer marked with "Best Offer" badge.
 * - bestDeal: Lowest monthly installment or No-Cost EMI tenure with "Best Deal" badge.
 *
 * @param {number|object} productOrPrice - Product selling price or product doc
 * @param {Array<object>} [rawOffers=[]] - Offers from DB
 * @param {object} [options={}] - Options { categoryId, currentDate }
 * @returns {object} { bestPrice, emiOffers, bankOffers, bestBankOffer, bestEmiOffer }
 */
export function resolveOffersForProduct(
  productOrPrice,
  rawOffers = [],
  options = {}
) {
  const price = getSellingPrice(productOrPrice);
  const categoryId =
    options.categoryId ||
    (typeof productOrPrice === "object"
      ? productOrPrice?.category || productOrPrice?.sub_category
      : null);
  const currentDate = options.currentDate || new Date();

  // If DB offers are empty, use standard business defaults
  const sourceOffers =
    Array.isArray(rawOffers) && rawOffers.length > 0
      ? rawOffers
      : generateDefaultOffers(price);

  let bankOffersList = [];
  let emiOffersList = [];

  for (let i = 0; i < sourceOffers.length; i++) {
    const o = sourceOffers[i];
    if (!isOfferEligible(o, price, categoryId, currentDate)) {
      continue;
    }

    // Resolve bank info
    const bankObj = o.bank && typeof o.bank === "object" ? o.bank : null;
    const bankShortCode = (
      bankObj?.code ||
      bankObj?.shortCode ||
      o.bankShortCode ||
      "BANK"
    ).toUpperCase();
    const bankName =
      bankObj?.name || o.bankName || o.name || `${bankShortCode} Bank`;
    const bankLogoUrl =
      bankObj?.logoUrl || bankObj?.logo || o.bankLogoUrl || o.logoUrl || "";

    // Determine offer type
    const isBankDiscount =
      o.offerType === "BANK_OFFER" ||
      o.stackGroup === "BANK_OFFER" ||
      o.type === "BANK_DISCOUNT";

    const isEmi =
      !isBankDiscount &&
      (o.offerType === "EMI_OFFER" ||
        o.offerType === "STANDARD_EMI" ||
        o.offerType === "NO_COST_EMI" ||
        o.stackGroup === "EMI_OFFER" ||
        o.type === "EMI" ||
        Boolean(o.emiDetails?.tenureMonths > 0));

    if (isEmi) {
      const tenure = Number(
        o.emiDetails?.tenureMonths || o.tenureMonths || 6
      );
      const annualRate = Number(
        o.emiDetails?.annualInterestRate ?? o.interestRate ?? 14
      );
      const isNoCost = Boolean(
        o.emiDetails?.isNoCost ??
          o.isNoCostEmi ??
          o.isNoCostEMI ??
          o.offerType === "NO_COST_EMI" ??
          false
      );

      const emiCalc = calculateEmi(price, tenure, annualRate, isNoCost);

      emiOffersList.push({
        offerId: o._id?.toString() || o.id || o.offerId || `emi-${i}`,
        bankShortCode,
        bankName,
        bankLogoUrl,
        offerType: "EMI_OFFER",
        tenureMonths: tenure,
        annualInterestRate: annualRate,
        isNoCost: emiCalc.isNoCost,
        isNoCostEmi: emiCalc.isNoCost,
        monthlyEmi: emiCalc.monthlyEmi,
        totalPayable: emiCalc.totalPayable,
        totalInterest: emiCalc.totalInterest,
        subventionDiscount: emiCalc.subventionDiscount,
        effectivePrice: emiCalc.effectivePrice,
        minOrderValue: Number(o.minOrderValue ?? o.minimumTransactionAmount ?? 0),
        cardType: o.cardType || "CREDIT",
        badge: emiCalc.isNoCost ? "No Cost EMI" : "Standard EMI",
        description:
          o.description ||
          `${bankShortCode} BANK CREDIT CARD EMI (${annualRate}% P.A.)`,
        name: o.title || o.name || `${bankName} ${tenure}m EMI`,
        isBestDeal: false,
        priority: Number(o.priority || 0),
      });
    } else {
      // Bank Instant Discount Offer
      const discountType = (
        o.discountType || "PERCENTAGE"
      ).toUpperCase();
      const discountValue = Number(o.discountValue || 0);
      const maxDiscountLimit = Number(
        o.maxDiscountLimit ?? o.discountCap ?? 0
      );

      const discountCalc = calculateInstantDiscount(
        price,
        discountType,
        discountValue,
        maxDiscountLimit
      );

      bankOffersList.push({
        offerId: o._id?.toString() || o.id || o.offerId || `bank-${i}`,
        bankShortCode,
        bankName,
        bankLogoUrl,
        offerType: "BANK_OFFER",
        discountType,
        discountValue,
        maxDiscountLimit,
        calculatedDiscount: discountCalc.discount,
        effectivePrice: discountCalc.effectivePrice,
        minOrderValue: Number(o.minOrderValue ?? o.minimumTransactionAmount ?? 0),
        cardType: o.cardType || "ALL",
        badge: o.badge || "Credit/Debit",
        description:
          o.description ||
          o.name ||
          `${bankName} Cards - Full payment and discount available at checkout`,
        name: o.title || o.name || `${bankName} Cards`,
        isBestOffer: false,
        priority: Number(o.priority || 0),
      });
    }
  }

  // Preferred bank order ensuring top partners (HDFC, SBI, AXIS) are prioritized
  const PREFERRED_BANK_ORDER = {
    HDFC: 1,
    SBI: 2,
    AXIS: 3,
    ICICI: 4,
    KOTAK: 5,
    RBL: 6,
    SCB: 7,
  };

  // Sort by preferred bank partner and priority
  const sortComparator = (a, b) => {
    const orderA = PREFERRED_BANK_ORDER[a.bankShortCode] || 99;
    const orderB = PREFERRED_BANK_ORDER[b.bankShortCode] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return (b.priority || 0) - (a.priority || 0);
  };

  bankOffersList.sort(sortComparator);
  emiOffersList.sort(sortComparator);

  // Group top preview slots by distinct banks
  const prioritizeDistinctBanks = (list) => {
    const seen = new Set();
    const primary = [];
    const remaining = [];
    for (const item of list) {
      if (!seen.has(item.bankShortCode)) {
        seen.add(item.bankShortCode);
        primary.push(item);
      } else {
        remaining.push(item);
      }
    }
    return [...primary, ...remaining];
  };

  bankOffersList = prioritizeDistinctBanks(bankOffersList);
  emiOffersList = prioritizeDistinctBanks(emiOffersList);

  // --- BEST PRICE & BEST OFFER (BANK OFFERS) ---
  let bestPrice = price;
  let highestDiscount = 0;
  let bestBankOfferIndex = -1;

  for (let j = 0; j < bankOffersList.length; j++) {
    const bo = bankOffersList[j];
    if (bo.calculatedDiscount > highestDiscount) {
      highestDiscount = bo.calculatedDiscount;
      bestBankOfferIndex = j;
    }
    if (bo.effectivePrice < bestPrice) {
      bestPrice = bo.effectivePrice;
    }
  }

  if (bestBankOfferIndex >= 0 && highestDiscount > 0) {
    bankOffersList[bestBankOfferIndex].isBestOffer = true;
    bankOffersList[bestBankOfferIndex].badge = "Best Offer";
  }

  // --- BEST DEAL (EMI OFFERS) ---
  // Mark the lowest monthly installment or No-Cost EMI tenure with a "Best Deal" badge
  let bestEmiIndex = -1;
  if (emiOffersList.length > 0) {
    // Check if any of the preview offers (top 3) is No-Cost EMI
    const previewNoCost = emiOffersList.slice(0, 3).findIndex((eo) => eo.isNoCost);
    if (previewNoCost >= 0) {
      bestEmiIndex = previewNoCost;
    } else {
      // Find lowest monthly installment among the top preview offers
      let minInstallment = Infinity;
      const previewLimit = Math.min(3, emiOffersList.length);
      for (let k = 0; k < previewLimit; k++) {
        if (emiOffersList[k].monthlyEmi < minInstallment) {
          minInstallment = emiOffersList[k].monthlyEmi;
          bestEmiIndex = k;
        }
      }
    }

    if (bestEmiIndex >= 0) {
      emiOffersList[bestEmiIndex].isBestDeal = true;
      emiOffersList[bestEmiIndex].badge = "Best Deal";
    }
  }

  const bestBankOffer =
    bestBankOfferIndex >= 0 ? bankOffersList[bestBankOfferIndex] : bankOffersList[0] || null;
  const bestEmiOffer =
    bestEmiIndex >= 0 ? emiOffersList[bestEmiIndex] : emiOffersList[0] || null;

  return {
    bestPrice: roundToTwoDecimals(bestPrice),
    basePrice: roundToTwoDecimals(price),
    emiOffers: emiOffersList,
    bankOffers: bankOffersList,
    bestBankOffer,
    bestEmiOffer,
  };
}
