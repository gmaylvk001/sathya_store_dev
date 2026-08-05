"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from '@/context/CartContext';
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { MdSecurity, MdLoop, MdVerified, MdCardMembership, MdLocalShipping, MdLock } from "react-icons/md";
import { useWishlist } from '@/context/WishlistContext';
import ProductAddtoCart from "@/components/ProductAddtoCart";


const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

const features = [
  { icon: "🚗", title: "Free Shipping", description: "Free shipping all over the US" },
  { icon: "🔒", title: "100% Satisfaction", description: "Guaranteed satisfaction with every order" },
  { icon: "💼", title: "Secure Payments", description: "We ensure secure transactions" },
  { icon: "💬", title: "24/7 Support", description: "We're here to help anytime" },
];

const ConfirmModal = ({ show, onClose, onConfirm }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Remove item?</h3>
          <p className="text-gray-500 mb-4">Are you sure you want to delete this item from your cart?</p>
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={onConfirm}
            >
              Yes, Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const SuccessModal = ({ show, message, onClose }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-green-600 mb-2">Success!</h3>
          <p className="text-gray-500 mb-4">{message}</p>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={onClose}
          >
            OK
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ErrorModal = ({ show, message, onClose }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-red-600 mb-2">Warning!</h3>
          <p className="text-gray-500 mb-4">{message}</p>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={onClose}
          >
            OK
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// NEW: deep-compare helpers (avoid re-renders/flicker)
const normalizeOffersList = (offers = []) =>
  offers
    .filter(o => o && o.code)
    .map(o => ({
      code: String(o.code),
      percentage: Number(o.percentage || 0) || 0,
      fixed_price: Number(o.fixed_price || 0) || 0,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

const isSameOffers = (a, b) => {
  try {
    const na = normalizeOffersList(a);
    const nb = normalizeOffersList(b);
    return JSON.stringify(na) === JSON.stringify(nb);
  } catch {
    return false;
  }
};

function CompleteYourPurchase({ products, scrollRef, updateCartCount }) {
  if (!products?.length) return null;

  const scrollBy = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[17px] font-bold text-[#0f3cc9]">Complete Your Purchase</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scrollBy(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-blue-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-blue-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4">Frequently bought together with this item</p>

      {/* Scrollable Cards */}
<div
  ref={scrollRef}
  className="flex gap-3 pb-2 scrollbar-hide flex-wrap justify-center overflow-x-auto"
  style={{ scrollSnapType: "x mandatory" }}
>
        {products.map((product) => {
          const price =
            product.special_price > 0 && product.special_price < product.price
              ? product.special_price
              : product.price;
          const image = product.images?.[0]
            ? product.images[0].startsWith("http")
              ? product.images[0]
              : `/uploads/products/${product.images[0]}`
            : "";
          const subtitle =
            product.key_specifications?.[0]?.split(":")?.[1]?.trim() ||
            product.model_number ||
            "";

          return (
           <div
  key={product._id}
  className="flex-shrink-0 w-[220px] border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3 bg-white"
  style={{ scrollSnapAlign: "start" }}
>
  {/* Image */}
  <div className="w-[140px] h-[140px] flex items-center justify-center">
    <img
      src={image}
      alt={product.name}
      className="w-full h-full object-contain"
      onError={(e) => { e.target.style.display = "none"; }}
    />
  </div>

  {/* Name */}
  <p className="text-[14px] font-semibold text-gray-800 text-center line-clamp-2 leading-snug min-h-[40px]">
    {product.name}
  </p>

  {/* Subtitle */}
  {subtitle && (
    <p className="text-[12px] text-gray-500 text-center line-clamp-1">{subtitle}</p>
  )}

  {/* Price */}
  <p className="text-[15px] font-bold text-gray-900">
    ₹{Number(price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
  </p>

  {/* Add Button */}
  <div className="w-full">
    <ProductAddtoCart
      productId={product._id}
      stockQuantity={product.quantity}
      quantity={1}
      additionalProducts={[]}
      extendedWarranty={0}
      selectedFrequentProducts={[]}
      selectedRelatedProducts={[]}
      buttonLabel="Add"
      buttonClassName="bg-white border border-[#0f3cc9] text-[#0f3cc9] hover:bg-blue-50 text-sm py-2 w-full rounded-md font-semibold"
      movement={product.movement}        
      productName={product.name}          
      productSlug={product.slug}    
      onSuccess={()=>window.location.reload()}
    />
  </div>
</div>
          );
        })}
      </div>
    </div>
  );
}

export default function CartComponent() {
  const router = useRouter();
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { cartCount, updateCartCount } = useCart();
const { updateWishlist } = useWishlist();
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [trucoCouponApplied, setTrucoCouponApplied] = useState(false);
  const [trucoCouponDiscount, setTrucoCouponDiscount] = useState(0);
  const [trucoCouponCode, setTrucoCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState(""); // inline success text

  const [completeYourPurchase, setCompleteYourPurchase] = useState([]);
   const completeScrollRef = useRef(null);

  // Coupon feature toggle state (shared)
  const [couponFeatureEnabled, setCouponFeatureEnabled] = useState(true);
  const [hasActiveOfferProduct, setHasActiveOfferProduct] = useState(false);

  // New: active offer codes now store objects: { code, percentage, fixed_price }
  const [activeOfferCodes, setActiveOfferCodes] = useState([]);
  // NEW: loading state for initial render (no flicker on background refresh)
  const [isOffersLoading, setIsOffersLoading] = useState(true);
  // NEW: track which coupon was just copied to show ✅ temporarily
  const [copiedCode, setCopiedCode] = useState(null);
  // NEW: refs for live updates and cleanup
  const offersAbortRef = useRef(null);
  const offersIntervalRef = useRef(null);
  const offersSSERef = useRef(null);

  // Copy coupon to clipboard and reflect UI
  const handleCopyCoupon = async (code) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch (_) {
      // no-op
    }
    // Update input and focus
    setCouponCode(code);
    setCouponError("");
    setCouponSuccess("");
    const inputEl = document.getElementById("coupon_input");
    if (inputEl) {
      inputEl.focus();
      try {
        const end = code.length;
        inputEl.setSelectionRange(end, end);
      } catch {}
    }
    // Show copied indicator briefly
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // NEW: helper to robustly check coupon validity using optional from/to dates
  const isCouponValid = (coupon) => {
    try {
      // Accept multiple possible field names
      const fromRaw = coupon?.from_date ?? coupon?.fromDate ?? coupon?.valid_from ?? null;
      const toRaw = coupon?.to_date ?? coupon?.toDate ?? coupon?.valid_to ?? null;

      // If neither date is provided, coupon is valid by date constraints
      if (!fromRaw && !toRaw) return true;

      // Helper to parse various inputs into a valid Date or null
      const parseDate = (raw) => {
        if (raw === null || raw === undefined || raw === "") return null;
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
      };

      const from = parseDate(fromRaw);
      const to = parseDate(toRaw);

      // If both parsed dates are invalid, treat as no date constraints
      if (!from && !to) return true;

      // Compute UTC start-of-day (00:00 UTC) for robust date-only comparisons
      const utcStartOfDay = (d) =>
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

      const now = new Date();
      const todayUTC = utcStartOfDay(now);

      if (from) {
        const fromUTC = utcStartOfDay(from);
        // today must be same or after from date
        if (todayUTC < fromUTC) return false;
      }

      if (to) {
        const toUTC = utcStartOfDay(to);
        // today must be same or before to date
        if (todayUTC > toUTC) return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  // NEW: shared fetcher for active offer codes (used by SSE triggers, polling, focus/visibility)
  const fetchActiveCodes = useCallback(async (opts = { silent: false }) => {
    try {
      if (!opts.silent) setIsOffersLoading(true);
      // Abort previous in-flight fetch
      if (offersAbortRef.current) {
        try { offersAbortRef.current.abort(); } catch {}
      }
      const ac = new AbortController();
      offersAbortRef.current = ac;

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const resp = await fetch("/api/offers/offer-products?listActiveCodes=1", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: ac.signal,
        cache: "no-store",
      });

      const json = await resp.json().catch(() => null);
      const offers = Array.isArray(json?.offers)
        ? json.offers.map(o => ({
            // preserve date fields for client-side validity checks
            code: o.code || o.offer_code || o.offerCode || "",
            percentage: Number(o.percentage || 0) || 0,
            fixed_price: Number(o.fixed_price || 0) || 0,
            from_date: o.from_date ?? o.fromDate ?? o.valid_from ?? null,
            to_date: o.to_date ?? o.toDate ?? o.valid_to ?? null,
          })).filter(o => o.code)
        : Array.isArray(json?.codes)
          ? json.codes.map(c => ({ code: c, percentage: 0, fixed_price: 0, from_date: null, to_date: null }))
          : [];

      // Update state only if changed to avoid flicker
      if (!isSameOffers(activeOfferCodes, offers)) {
        setActiveOfferCodes(offers);
      }
    } catch {
      // keep current offers on error to avoid flicker
    } finally {
      setIsOffersLoading(false);
    }
  }, [activeOfferCodes]);

  // Sync helpers and storage listener
  const isSameCart = (a, b) => {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  };
  const saveCartState = (cart) => {
    try {
      localStorage.setItem('cartData', JSON.stringify(cart));
      if (typeof cart?.totalItems === 'number') {
        localStorage.setItem('cartCount', String(cart.totalItems));
      }
    } catch {}
  };
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'cartData') {
        const next = e.newValue ? JSON.parse(e.newValue) : null;
        // Only update state; do not write back to localStorage here to avoid loops
        if (!isSameCart(next, cartData)) {
          setCartData(next);
          updateCartCount(next?.totalItems ?? 0);
        }
      }
      if (e.key === 'appliedCoupon') {
        const nextCoupon = e.newValue ? JSON.parse(e.newValue) : null;
        setAppliedCoupon(nextCoupon);
      }
      // Listen to coupon feature toggle
      if (e.key === 'couponFeatureEnabled') {
        try {
          const next = e.newValue ? JSON.parse(e.newValue) : true;
          setCouponFeatureEnabled(next);
        } catch {
          setCouponFeatureEnabled(true);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [cartData, updateCartCount]);

  // Initialize coupon feature toggle and subscribe to BroadcastChannel
  useEffect(() => {
    try {
      const saved = localStorage.getItem('couponFeatureEnabled');
      setCouponFeatureEnabled(saved === null ? true : JSON.parse(saved));
    } catch {
      setCouponFeatureEnabled(true);
    }

    let bc;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('couponFeature');
      bc.onmessage = (ev) => setCouponFeatureEnabled(Boolean(ev.data));
    }
    return () => {
      if (bc) bc.close();
    };
  }, []);

  // Fetch and set hasActiveOfferProduct from API (fallback to false on errors)
  const fetchOfferProductsActive = async (signal) => {
    try {
      const token = (typeof window !== "undefined") ? localStorage.getItem("token") : null;
      const resp = await fetch("/api/offers/offer-products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal,
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json) {
        setHasActiveOfferProduct(false);
        return;
      }
      const bool =
        typeof json.hasActiveOfferProduct === "boolean"
          ? json.hasActiveOfferProduct
          : (Array.isArray(json?.data) ? json.data.length > 0 : false);
      setHasActiveOfferProduct(Boolean(bool));
    } catch (e) {
      if (e?.name !== "AbortError") setHasActiveOfferProduct(false);
    }
  };

  // Re-check on mount and when cart items length changes
  useEffect(() => {
    const controller = new AbortController();
    fetchOfferProductsActive(controller.signal);
    return () => controller.abort();
  }, [cartData?.items?.length]);

  // Re-check on window focus
  useEffect(() => {
    const onFocus = () => fetchOfferProductsActive();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const token = localStorage.getItem('token');
        let response = '';
        
        if(token)
        {
          response = await fetch('/api/cart', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            method: "GET"
          });
        }
        else
        {
          const guestCartId = localStorage.getItem("guestCartId") || uuidv4();
          response = await fetch('/api/cart', {
            headers: {
              'guestCartId': guestCartId
            },
            method: "GET"
          });
        }

        if (!response.ok) {
          const datares = await response.json();
          if (
            datares.error === "Token has expired" ||
            datares.error === "Invalid token" ||
            datares.error === "Authorization token required"
          ) {
            localStorage.removeItem("token");
            window.location.reload();
            return;
          }
        }

        const data = await response.json();
        const itemsWithDiscount = data.cart.items.map(item => ({
          ...item,
          discount: 0
        }));

        // Persist and set state
        const nextCart = { ...data.cart, items: itemsWithDiscount };
        setCartData(nextCart);
        saveCartState(nextCart);

        // Apply saved coupon if present and persist
        const savedCoupon = localStorage.getItem('appliedCoupon');
        if (savedCoupon) {
          const coupon = JSON.parse(savedCoupon);
          setAppliedCoupon(coupon);
          const discountedItems = applyDiscountToItems(coupon, nextCart.items);
          const discountedCart = { ...nextCart, items: discountedItems };
          setCartData(discountedCart);
          saveCartState(discountedCart);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [router]);

  useEffect(() => {
  const fetchCompleteYourPurchase = async () => {
    if (!cartData?.items?.length) return;

    
    const firstProductId = cartData.items[0]?.productId;
     console.log("1. firstProductId:", firstProductId);
    if (!firstProductId) return;

    try {
     
      const res = await fetch(`/api/product/get/${firstProductId}`);
      const data = await res.json();
      console.log("2. product data:", data);
     const addOnIds = data?.add_ons || data?.data?.add_ons || [];
console.log("3. addOnIds:", addOnIds);
if (!addOnIds.length) return;

const featRes = await fetch("/api/product/addons", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ids: addOnIds }),
});
const featData = await featRes.json();
const featDataArr = featData?.products || featData || [];
      console.log("4. featData:", featData); 
      const cartProductIds = cartData.items.map(i => i.productId);
     const filtered = (featDataArr || []).filter(
  p => !cartProductIds.includes(p._id?.toString())
);
      
      setCompleteYourPurchase(filtered);
    } catch (e) {
      console.error("Complete your purchase fetch error:", e);
    }
  };

  fetchCompleteYourPurchase();
}, [cartData?.items?.length]);

  
  const applyDiscountToItems = (coupon, items) => {
    if (!coupon || !items) return items;

    // Determine eligible items: if offer_product provided, restrict to those; else all items
    const eligibleItems = Array.isArray(coupon.offer_product) && coupon.offer_product.length
      ? items.filter(i => coupon.offer_product.includes(i.productId))
      : items;

    if (!eligibleItems.length) {
      // No eligible items; clear discounts
      return items.map(i => ({ ...i, discount: 0, coupondetails: [] }));
    }

    const lineTotal = (i) => (Number(i.price) || 0) * (Number(i.quantity) || 0);
    const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + lineTotal(i), 0);

    // Compute cart-level discount according to rules
    let totalDiscount = 0;
    if (coupon.offer_type === "percentage" && Number(coupon.percentage) > 0) {
      totalDiscount = eligibleSubtotal * (Number(coupon.percentage) / 100);
    } else if (coupon.offer_type === "fixed_price" && Number(coupon.fixed_price) > 0) {
      totalDiscount = Number(coupon.fixed_price);
    }

    // Cap discount so it never exceeds the eligible subtotal
    totalDiscount = Math.min(totalDiscount, eligibleSubtotal);
    totalDiscount = Number(totalDiscount.toFixed(2));

    // Distribute proportionally across eligible items
    const isEligible = (pid) => eligibleItems.some(e => e.productId === pid);
    let distributed = 0;
    const distributedItems = items.map((item, idx, arr) => {
      if (!isEligible(item.productId) || eligibleSubtotal === 0 || totalDiscount === 0) {
        return { ...item, discount: 0, coupondetails: [] };
      }
      const base = lineTotal(item);
      // Proportional share
      let share = (base / eligibleSubtotal) * totalDiscount;
      let discount = Number(share.toFixed(2));
      distributed += discount;
      return {
        ...item,
        discount,
        coupondetails: discount > 0 ? [coupon] : []
      };
    });

    // Fix rounding drift on the last eligible item to match totalDiscount exactly
    const eligibleIndexes = distributedItems
      .map((it, idx) => (isEligible(it.productId) ? idx : -1))
      .filter(idx => idx !== -1);
    const drift = Number((totalDiscount - distributed).toFixed(2));
    if (eligibleIndexes.length && Math.abs(drift) >= 0.01) {
      const lastIdx = eligibleIndexes[eligibleIndexes.length - 1];
      distributedItems[lastIdx] = {
        ...distributedItems[lastIdx],
        discount: Number((distributedItems[lastIdx].discount + drift).toFixed(2))
      };
    }

    return distributedItems;
  };

  // Normalize offer object to client coupon shape (decide type from non-zero values)
  const normalizeOfferToCoupon = (offer) => {
    const code =
      offer.offer_code || offer.code || offer.couponCode || offer.offerCode || "";

    const status =
      (offer.status ||
       offer.fest_offer_status || // include fest_offer_status
       offer.offer_status ||
       offer.state ||
       "").toLowerCase();

    const typeRaw =
      (offer.offer_type || offer.type || offer.discount_type || "").toLowerCase();

    const percentage =
      Number(offer.percentage ?? offer.percent ?? (typeRaw.includes("percent") ? offer.discountValue : 0) ?? 0) || 0;

    const fixed =
      Number(offer.fixed_price ?? offer.amount ?? (!typeRaw.includes("percent") ? offer.discountValue : 0) ?? 0) || 0;

    const products =
      offer.offer_product ||
      offer.products ||
      offer.productIds ||
      offer.product_ids ||
      [];

    // Decide type from values
    const offer_type = percentage > 0 ? "percentage" : (fixed > 0 ? "fixed_price" : "");

    return {
      offer_code: code,
      offer_type,
      percentage: percentage > 0 ? percentage : 0,
      fixed_price: fixed > 0 ? fixed : 0,
      offer_product: Array.isArray(products) ? products : [],
      status
    };
  };


  const updateQuantity = async (productId, newQuantity, original_quantity = null) => {
    try {
      if (original_quantity !== null && newQuantity > original_quantity) {
        setErrorMessage("Requested quantity exceeds available stock.");
        setShowErrorModal(true);
        return;
      }
      let response = '';
      const token = localStorage.getItem('token');
      if(token)
      {
        response = await fetch('/api/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId, quantity: newQuantity })
        });
      }
      else
      {
        const guestCartId = localStorage.getItem("guestCartId") || uuidv4();
        response = await fetch('/api/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'guestCartId': guestCartId
          },
          body: JSON.stringify({ productId, quantity: newQuantity })
        });
      }

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

const updatedCart = await response.json();

      // Merge existing details
      const itemsMerged = updatedCart.cart.items.map(item => {
        const existingItem = cartData.items.find(i => i.productId === item.productId);
        return {
          ...existingItem,
          ...item,
          discount: 0
        };
      });

      // Reapply coupon if exists
      let finalItems = itemsMerged;
      if (appliedCoupon) {
        finalItems = applyDiscountToItems(appliedCoupon, itemsMerged);
      }
      const finalCart = { ...updatedCart.cart, items: finalItems };
      setCartData(finalCart);
      updateCartCount(finalCart.totalItems);
      saveCartState(finalCart);

      setSuccessMessage("Quantity updated successfully");
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Update quantity error:', err);
      setError(err.message);
    }
  };


  const confirmRemoveItem = (productId) => {
    setProductToDelete(productId);
    setShowConfirmModal(true);
  };

  const removeItem = async () => {
    try {
      let response = '';
      const token = localStorage.getItem('token');
      if(token)
      {
        response = await fetch('/api/cart', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId: productToDelete })
        });
      }
      else
      {
        const guestCartId = localStorage.getItem("guestCartId") || uuidv4();
        response = await fetch('/api/cart', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'guestCartId': guestCartId
          },
          body: JSON.stringify({ productId: productToDelete })
        });
      }

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const updatedCart = await response.json();

      // Merge existing details
      const itemsMerged = updatedCart.cart.items.map(item => {
        const existingItem = cartData.items.find(i => i.productId === item.productId);
        return {
          ...item,
          discount: existingItem ? existingItem.discount : 0
        };
      });

      // Reapply coupon if exists
      let finalItems = itemsMerged;
      if (appliedCoupon) {
        finalItems = applyDiscountToItems(appliedCoupon, itemsMerged);
      }

let nextCartObj = { ...updatedCart.cart, items: finalItems };

      // If product-specific coupon no longer applicable, clear it and discounts
      if (appliedCoupon && appliedCoupon.offer_product && appliedCoupon.offer_product.includes(productToDelete)) {
        setAppliedCoupon(null);
        localStorage.removeItem('appliedCoupon');
        nextCartObj = {
          ...nextCartObj,
          items: nextCartObj.items.map(item => ({ ...item, discount: 0 }))
        };
      }

      // Re-fetch cart fresh from API to avoid stale data
      const token3 = localStorage.getItem('token');
      const freshRes = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token3}` },
        method: 'GET'
      });
      if (freshRes.ok) {
        const freshData = await freshRes.json();
        const freshItems = freshData.cart.items.map(item => ({ ...item, discount: 0 }));
        let freshFinal = freshItems;
        if (appliedCoupon) {
          freshFinal = applyDiscountToItems(appliedCoupon, freshItems);
        }
        nextCartObj = { ...freshData.cart, items: freshFinal };
      }

      setCartData(nextCartObj);
      updateCartCount(nextCartObj.totalItems);
      saveCartState(nextCartObj);
      setSuccessMessage("Item removed from cart");
      setShowSuccessModal(true);
      // setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error('Remove item error:', err);
      setError(err.message);
    } finally {
      setShowConfirmModal(false);
      setProductToDelete(null);
    }
  };
const validateCoupon = async () => {
  if (!couponFeatureEnabled) {
    setCouponError("Coupons are currently disabled");
    setCouponSuccess("");
    return;
  }
 
  const code = couponCode.trim();
  if (!code) {
    setCouponError("Please enter a coupon code");
    setCouponSuccess("");
    return;
  }
 
  setIsValidatingCoupon(true);
  setCouponError("");
  setCouponSuccess("");
 

  let dbCouponValid = false;
 
  try {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({ code });
 
    const resp = await fetch(`/api/offers/offer-products?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
 
    const data = await resp.json();
 
    if (resp.ok && data?.coupon) {
      const normalized = normalizeOfferToCoupon(data.coupon);
 
      // Active check
      const isActive = (normalized.status || "").toLowerCase() === "active";
      // Discount value check
      const hasDiscount = (normalized.percentage ?? 0) > 0 || (normalized.fixed_price ?? 0) > 0;
      // Cart product check
      const cartProductIds = cartData?.items?.map((i) => i.productId) || [];
      const isApplicable =
        !Array.isArray(normalized.offer_product) ||
        normalized.offer_product.length === 0 ||
        normalized.offer_product.some((id) => cartProductIds.includes(id));
 
      if (isActive && hasDiscount && isApplicable) {
        // ✅ DB coupon valid — existing flow exactly same
        const itemsWithDiscount = applyDiscountToItems(normalized, cartData.items);
        const newCart = { ...cartData, items: itemsWithDiscount };
 
        setAppliedCoupon(normalized);
        localStorage.setItem("appliedCoupon", JSON.stringify(normalized));
        setCartData(newCart);
        saveCartState(newCart);
 
        // Truco state clear pannurom — DB coupon use pannurom
        setTrucoCouponApplied(false);
        setTrucoCouponDiscount(0);
        setTrucoCouponCode("");
 
        setCouponSuccess(`${normalized.offer_code} is applied`);
        setCouponError("");
        dbCouponValid = true;
      }
    }
  } catch (_) {
    
  }
 
  if (dbCouponValid) {
    setIsValidatingCoupon(false);
    return;
  }
 
  
  try {
  
    const statusRes = await fetch("/api/truco-promo-code?action=status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
 
    const statusData = await statusRes.json();
 
    if (!statusData.found || !statusData.isValid || statusData.isExpired) {
      setCouponError("The coupon code entered is not valid.");
      setCouponSuccess("");
      setIsValidatingCoupon(false);
      return;
    }
 
    
    const token = localStorage.getItem("token");
    const authRes = await fetch("/api/auth/check", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authData = await authRes.json();
    
 
    const validateRes = await fetch("/api/truco-promo-code?action=validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        phoneNumber: authData.phone || "",
        cartTotal: calculateSubtotal(),
       
        cartItems: cartData?.items?.map((item) => ({
          sku: item.item_code || String(item.productId),
          brand: item.brand || "",
          category: item.category || "",
          price: item.price > 0 ? item.price : item.actual_price,
          quantity: item.quantity,
        })) || [],
        paymentMethod: "CARD",
        channel: "ONLINE",
        storeId: "ECOM",
      }),
    });
 
    const validateData = await validateRes.json();
 
    if (!validateData.valid) {
    
      const errorMessages = {
        PROMOTION_NOT_FOUND: "Coupon code does not exist.",
        PROMOTION_EXPIRED: "This coupon has expired.",
        PROMOTION_INACTIVE: "This coupon is no longer active.",
        MAX_USES_REACHED: "This coupon has reached its usage limit.",
        CUSTOMER_ALREADY_REDEEMED: "You have already used this coupon.",
        MINIMUM_AMOUNT_NOT_MET: "Your cart total is below the minimum required amount.",
        MIN_CART_VALUE_NOT_MET: "Your cart total is below the minimum required amount.",
        BRAND_NOT_FOUND: "This coupon is not applicable for items in your cart.",
        CATEGORY_NOT_FOUND: "This coupon is not applicable for items in your cart.",
        BUDGET_EXHAUSTED: "This coupon's budget has been exhausted.",
      };
 
      const msg =
        errorMessages[validateData.errorCode] ||
        validateData.errorMessage ||
        "The coupon code entered is not valid.";
 
      setCouponError(msg);
      setCouponSuccess("");
      setIsValidatingCoupon(false);
      return;
    }
 

    const discountAmount = validateData.benefitPreview?.discountAmount || 0;
 
    
    const trucoCouponShape = {
      offer_code: code,
      offer_type: "fixed_price",        
      fixed_price: discountAmount,
      percentage: 0,
      offer_product: [],              
      status: "active",
    };
 
    const itemsWithDiscount = applyDiscountToItems(trucoCouponShape, cartData.items);
    const newCart = { ...cartData, items: itemsWithDiscount };
 
   
    setTrucoCouponApplied(true);
    setTrucoCouponDiscount(discountAmount);
    setTrucoCouponCode(code);
 
   
    setAppliedCoupon(trucoCouponShape);
    localStorage.setItem("appliedCoupon", JSON.stringify(trucoCouponShape));
    setCartData(newCart);
    saveCartState(newCart);
 
    const offerDesc = validateData.benefitPreview?.offerDescription || "";
    setCouponSuccess(
      `${code} applied! ${offerDesc ? `— ${offerDesc}` : `₹${discountAmount} discount`}`
    );
    setCouponError("");
 
  } catch (err) {
    console.error("Truco promo validate error:", err);
    setCouponError("The coupon code entered is not valid.");
    setCouponSuccess("");
  } finally {
    setIsValidatingCoupon(false);
  }
};
 

  const removeCoupon = () => {
    const newCart = {
      ...cartData,
      items: cartData.items.map((item) => ({ ...item, discount: 0 })),
    };
    setCartData(newCart);
    saveCartState(newCart);

    setAppliedCoupon(null);
    localStorage.removeItem("appliedCoupon");
    setTrucoCouponApplied(false);
    setTrucoCouponDiscount(0);
    setTrucoCouponCode("");
    setCouponSuccess(""); 
    setSuccessMessage("Coupon removed successfully");
    setCouponCode("");
    setShowSuccessModal(true);
  };

 const moveToWishlist = async (productId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Please login to add items to wishlist');
      setShowErrorModal(true);
      return;
    }

    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId })
    });

    if (!res.ok) throw new Error('Failed to add to wishlist');
    const wishlistData = await res.json();
updateWishlist(wishlistData.items, wishlistData.count);

    // wishlist success → directly remove from cart (no confirm modal)
    const token2 = localStorage.getItem('token');
    const response = await fetch('/api/cart', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({ productId })
    });

    if (!response.ok) throw new Error('Failed to remove from cart');

    const updatedCart = await response.json();
    const itemsMerged = updatedCart.cart.items.map(item => {
      const existingItem = cartData.items.find(i => i.productId === item.productId);
      return { ...item, discount: existingItem ? existingItem.discount : 0 };
    });

    let finalItems = itemsMerged;
    if (appliedCoupon) {
      finalItems = applyDiscountToItems(appliedCoupon, itemsMerged);
    }

    const nextCart = { ...updatedCart.cart, items: finalItems };
    setCartData(nextCart);
    updateCartCount(nextCart.totalItems);
    saveCartState(nextCart);

    setSuccessMessage("Item moved to wishlist successfully");
    setShowSuccessModal(true);

  } catch (err) {
    console.error('Move to wishlist error:', err);
    setErrorMessage('Failed to move to wishlist. Try again.');
    setShowErrorModal(true);
  }
};   
const checkDelivery = (pincode) => {
  const pin = parseInt(pincode.trim());
  if (!pincode.trim() || pincode.trim().length !== 6 || isNaN(pin)) {
    return { available: false, message: "Please enter a valid 6-digit pincode" };
  }
  // Tamil Nadu pincode range: 600000 - 643999
  if (pin >= 600000 && pin <= 643999) {
    return { available: true, message: "✓ Delivery available to this location" };
  }
  return { available: false, message: "✗ Delivery not available for this pincode" };
};
const calculateMRP = () => {
  if (!cartData) return 0;
  return cartData.items.reduce((sum, item) => {
    return sum + ((item.actual_price ?? item.price ?? 0) * item.quantity);
  }, 0);
};

const calculateItemDiscount = () => {
  if (!cartData) return 0;
  return cartData.items.reduce((sum, item) => {
    const mrp = (item.actual_price ?? item.price ?? 0) * item.quantity;
    const selling = (item.price > 0 ? item.price : item.actual_price) * item.quantity;
    return sum + (mrp - selling);
  }, 0);
};

const calculateSubtotal = () => {
  if (!cartData) return 0;
  return cartData.items.reduce((sum, item) => {
    const itemPrice = item.price > 0 ? item.price : item.actual_price;
    return sum + (itemPrice * item.quantity) + (item.warranty || 0) + (item.extendedWarranty || 0);
  }, 0);
};

  const calculateDiscount = () => {
    if (!appliedCoupon || !cartData) return 0;
    
    return cartData.items.reduce((sum, item) => sum + (item.discount || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return subtotal - discount;
  };

  const proceedToCheckout = () => {
  
  if (!cartData) return;
  console.log("DEBUG appliedCoupon at checkout click:", appliedCoupon);

  // Calculate totals

  const subtotal = calculateSubtotal();

  const discount = calculateDiscount();

  const total = calculateTotal();

  // Save cart and coupon data to localStorage for checkout page

  localStorage.setItem('checkoutData', JSON.stringify({

    cart: {

      ...cartData,

      items: cartData.items.map(item => ({

        ...item,

        // Ensure all relevant fields are included

        productId: item.productId,

        name: item.name,

        price: item.price,

        quantity: item.quantity,

        warranty: item.warranty || 0,

        extendedWarranty: item.extendedWarranty || 0,

        discount: item.discount || 0,

        image: item.image,
         warrantyData: item.warrantyData || null,

      }))

    },

    coupon: appliedCoupon,

    discount,

    subtotal,

    total,
    trucoCouponApplied,
    trucoCouponCode: trucoCouponApplied ? trucoCouponCode : "",
    trucoCouponDiscount: trucoCouponApplied ? trucoCouponDiscount : 0,

  }));

  router.push('/checkout');

};
 

  useEffect(() => {
    // Fetch active offer codes from DB (fest_offer_status2 and fest_offer_status are "active")
    const fetchActiveCodes = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const resp = await fetch("/api/offers/offer-products?listActiveCodes=1", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await resp.json().catch(() => null);
        // Prefer detailed offers; fallback to codes-only
        const offers = Array.isArray(json?.offers)
          ? json.offers.map(o => ({
              code: o.code || o.offer_code || o.offerCode || "",
              percentage: Number(o.percentage || 0) || 0,
              fixed_price: Number(o.fixed_price || 0) || 0,
              from_date: o.from_date ?? o.fromDate ?? o.valid_from ?? null,
              to_date: o.to_date ?? o.toDate ?? o.valid_to ?? null,
            })).filter(o => o.code)
          : Array.isArray(json?.codes)
            ? json.codes.map(c => ({ code: c, percentage: 0, fixed_price: 0, from_date: null, to_date: null }))
            : [];
        // console.log(offers);
        setActiveOfferCodes(offers);
      } catch {
        setActiveOfferCodes([]);
      }
    };
    fetchActiveCodes();
  }, []);

  // REPLACE old "fetch active codes" effect with live updates (SSE + polling + focus/visibility + BroadcastChannel)
  useEffect(() => {
    // initial fetch
    fetchActiveCodes({ silent: false });

    // SSE subscription (if backend supports SSE at this path)
    if (typeof window !== "undefined" && "EventSource" in window) {
      try {
        const es = new EventSource("/api/offers/offer-products/stream", { withCredentials: false });
        offersSSERef.current = es;

        es.onmessage = (ev) => {
          // Try to parse payload; if it contains offers/codes, use them; else trigger a re-fetch
          try {
            const data = JSON.parse(ev.data);
            if (Array.isArray(data?.offers) || Array.isArray(data?.codes)) {
              const offers = Array.isArray(data?.offers)
                ? data.offers.map(o => ({
                    code: o.code || o.offer_code || o.offerCode || "",
                    percentage: Number(o.percentage || 0) || 0,
                    fixed_price: Number(o.fixed_price || 0) || 0,
                    from_date: o.from_date ?? o.fromDate ?? o.valid_from ?? null,
                    to_date: o.to_date ?? o.toDate ?? o.valid_to ?? null,
                  })).filter(o => o.code)
                : data.codes.map(c => ({ code: c, percentage: 0, fixed_price: 0, from_date: null, to_date: null }));
              if (!isSameOffers(activeOfferCodes, offers)) {
                setActiveOfferCodes(offers);
              }
            } else if (data?.type === "offersUpdated") {
              // generic update signal
              fetchActiveCodes({ silent: true });
            } else {
              // unknown payload -> refresh
              fetchActiveCodes({ silent: true });
            }
          } catch {
            // non-JSON payload -> refresh
            fetchActiveCodes({ silent: true });
          }
        };

        es.onerror = () => {
          // On SSE error, close and rely on polling
          try { es.close(); } catch {}
          if (offersSSERef.current === es) offersSSERef.current = null;
        };
      } catch {
        // ignore SSE failures
      }
    }

    // Polling (paused when tab hidden)
    const startPolling = () => {
      if (offersIntervalRef.current) return;
      offersIntervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchActiveCodes({ silent: true });
        }
      }, 15000); // 15s
    };
    const stopPolling = () => {
      if (offersIntervalRef.current) {
        clearInterval(offersIntervalRef.current);
        offersIntervalRef.current = null;
      }
    };
    startPolling();

    // Refetch on visibility/focus
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchActiveCodes({ silent: true });
        startPolling();
      } else {
        stopPolling();
      }
    };
    const onFocus = () => fetchActiveCodes({ silent: true });

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    // BroadcastChannel fallback (if admin notifies via channel)
    let bc;
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel("offersUpdates");
      bc.onmessage = () => fetchActiveCodes({ silent: true });
    }

    return () => {
      // cleanup
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      stopPolling();
      if (offersSSERef.current) {
        try { offersSSERef.current.close(); } catch {}
        offersSSERef.current = null;
      }
      if (offersAbortRef.current) {
        try { offersAbortRef.current.abort(); } catch {}
        offersAbortRef.current = null;
      }
      if (bc) bc.close();
    };
  }, [fetchActiveCodes]);

  // Derived lists/flags used for rendering
  const validActiveOfferCodes = Array.isArray(activeOfferCodes) ? activeOfferCodes.filter(isCouponValid) : [];
  const expiredActiveOfferCodes = Array.isArray(activeOfferCodes) ? activeOfferCodes.filter((c) => !isCouponValid(c)) : [];
  const hasAnyValidActiveOffer = validActiveOfferCodes.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-blue-50 rounded-lg max-w-md mx-4">
          <p className="text-blue-500 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }
return (
  <div className="bg-white min-h-screen">
    {/* Modals */}
    <ConfirmModal
      show={showConfirmModal}
      onClose={() => {
        setShowConfirmModal(false);
        setProductToDelete(null);
      }}
      onConfirm={removeItem}
    />
    <SuccessModal
      show={showSuccessModal}
      message={successMessage}
      onClose={() => setShowSuccessModal(false)}
    />
    <ErrorModal
      show={showErrorModal}
      message={errorMessage}
      onClose={() => setShowErrorModal(false)}
    />

    <div className="w-full max-w-full sm:max-w-[680px] md:max-w-[860px] lg:max-w-[1180px] xl:max-w-[1360px] 2xl:max-w-[1480px] mx-auto px-4 md:px-6 lg:px-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[#0069c6] mb-5">
        My Cart{" "}
        <span className="text-gray-500 font-medium text-lg">
          ({cartData.items.length} Item{cartData.items.length > 1 ? "s" : ""})
        </span>
      </h1>

      {/* Main Grid: Left content + Right sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Cart items */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {cartData.items.map((item, itemIndex) => (
                   <div key={item.productId}>

              {/* ── DESKTOP VIEW (lg+) ── */}
              <div className="hidden lg:block border border-[#e5e7eb] rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="grid grid-cols-1 lg:grid-cols-[140px_1fr_220px] gap-6 items-start">

                  {/* Image */}
                  <div className="w-40 h-40 flex items-center justify-center border rounded-md overflow-hidden mx-auto sm:mx-0">
                    <Link href={`/product/${slugify(item.name)}`}>
                      <Image
                        src={`/uploads/products/${item.image}`}
                        alt={item.name}
                        width={160}
                        height={220}
                        className="object-contain w-full h-full"
                      />
                    </Link>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="text-[12px] text-gray-500 mb-1">{item.item_code}</h3>
                    <Link href={`/product/${slugify(item.name)}`}>
                      <p className="text-[20px] font-semibold text-[#0f3cc9] leading-6 mb-2">
                        {item.name}
                      </p>
                    </Link>
                    {item.specs?.length > 0 && (
                      <ul className="flex flex-col gap-1 mt-2">
                        {item.specs.slice(0, 3).map((spec, i) => {
                          const parts = spec.split(":");
                          const displayText = parts[1]?.trim()
                            ? `${parts[0]?.trim()}: ${parts[1]?.trim()}`
                            : parts[0]?.trim();
                          return (
                            <li key={i} className="flex items-center gap-1.5 text-[12px] text-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                              <span>{displayText}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                     {/* Warranty Display — Desktop */}
{item.warrantyData?.year > 0 && item.warrantyData?.price > 0 && (
  <div className="flex items-center gap-2 mt-2 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
    <span className="text-blue-600 text-sm">🛡️</span>
    <div>
     <p className="text-xs font-semibold text-blue-700">
                {item.warrantyData.name || `${item.warrantyData.year} Year Extended Warranty`}
              </p>
              <p className="text-xs text-gray-500">
                ₹{item.warrantyData.price?.toLocaleString("en-IN")}
              </p>
    </div>
  </div>
)}
                  </div>

                  {/* Price + Qty */}
                 <div className="flex flex-col items-end min-w-[180px] ">
  <h2 className="text-[28px] font-bold text-red-600 text-right mr-6">
    ₹{(item.price ?? 0).toFixed(2)}
  </h2>
  <p className="text-xs text-gray-400 line-through text-right mr-16">
    MRP ₹{(item.actual_price ?? item.price ?? 0).toFixed(2)}
  </p>
  {(item.actual_price > 0 && item.actual_price > item.price) && (
  <p className="text-xs mr-3 font-medium mb-5 text-right mt-1">
    <span className="text-gray-400">You Save </span> <span className="text-green-600">₹{(item.actual_price - item.price).toFixed(2)}
    ({Math.round(((item.actual_price - item.price) / item.actual_price) * 100)}%)</span>
  </p>
)}
   {item.warrantyData?.year > 0 && item.warrantyData?.price > 0 && (
  <p className="text-xs mr-8 mb-1 text-blue-600 font-medium mt-1 text-right">
    + ₹{item.warrantyData.price?.toLocaleString("en-IN")} (Warranty)
  </p>
)}
                    <div className="border rounded-md overflow-hidden flex items-center mr-8 h-[40px] w-[120px]">
                      <button
                        className="w-10 h-full text-lg disabled:opacity-40"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, null)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="w-9 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        className="w-10 h-full text-lg"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.original_quantity)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => confirmRemoveItem(item.productId)}
                      className="text-gray-500 text-sm mt-3 mr-14"
                    >
                      🗑 Remove
                    </button>
                  </div>

                  {/* Row 2 - Wishlist & Remove + Delivery */}
                  <div className="col-span-full mt-4 flex items-start justify-between">
                    <div className="flex gap-3 mt-4">
                 <button
  className="border border-[#d7def8] text-[#0f3cc9] px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center gap-1.5"
  onClick={() => moveToWishlist(item.productId)}
>
  ♡ Move to Wishlist
</button>
                      <button
                        onClick={() => confirmRemoveItem(item.productId)}
                        className="border border-[#d7def8] text-[#0f3cc9] px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                      >
                        🗑 Remove
                      </button>
                    </div>
    {itemIndex === 0 && <div className="bg-[#f6f8fc] border rounded-lg p-3 w-[380px]">
  <p className="font-medium text-sm mb-3 flex items-center gap-1.5">
    <MdLocalShipping className="text-[18px] text-[#0f3cc9]" />
    Check delivery availability
  </p>
  <div className="flex">
    <input
      type="text"
      placeholder="Enter Pincode"
      maxLength={6}
      id={`pincode-desktop-${item.productId}`}
      className="flex-1 border rounded-l-md px-3 h-8 text-sm"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const val = e.target.value;
          const result = checkDelivery(val);
          const msgEl = document.getElementById(`pinmsg-desktop-${item.productId}`);
          if (msgEl) {
            msgEl.textContent = result.message;
            msgEl.className = `text-xs mt-1 ${result.available ? 'text-green-600' : 'text-red-500'}`;
          }
        }
      }}
    />
    <button
      className="bg-[#0f3cc9] text-white px-5 h-8 rounded-r-md text-sm"
      onClick={() => {
        const val = document.getElementById(`pincode-desktop-${item.productId}`)?.value || '';
        const result = checkDelivery(val);
        const msgEl = document.getElementById(`pinmsg-desktop-${item.productId}`);
        if (msgEl) {
          msgEl.textContent = result.message;
          msgEl.className = `text-xs mt-1 ${result.available ? 'text-green-600' : 'text-red-500'}`;
        }
      }}
    >
      Check
    </button>
  </div>
<p id={`pinmsg-desktop-${item.productId}`} className="text-xs mt-1"></p>
</div>}
                  </div>

                </div>
              </div>
              {/* ── END DESKTOP CARD ── */}

              {/* ── MOBILE / TABLET VIEW (< lg) ── */}
              <div className="lg:hidden border border-[#e5e7eb] rounded-xl bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

                {/* 1. Image */}
                <div className="flex justify-center items-center bg-gray-50 py-5 border-b border-gray-100">
                  <Link href={`/product/${slugify(item.name)}`}>
                    <Image
                      src={`/uploads/products/${item.image}`}
                      alt={item.name}
                      width={160}
                      height={160}
                      className="object-contain w-[140px] h-[140px]"
                    />
                  </Link>
                </div>

                {/* 2. Name + Specs */}
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[11px] text-gray-400 mb-1">{item.item_code}</p>
                  <Link href={`/product/${slugify(item.name)}`}>
                    <p className="text-[16px] font-semibold text-[#0f3cc9] leading-snug mb-2">
                      {item.name}
                    </p>
                  </Link>
                  {item.specs?.length > 0 && (
                    <ul className="flex flex-col gap-1 mt-1">
                      {item.specs.slice(0, 3).map((spec, i) => {
                        const parts = spec.split(":");
                        const displayText = parts[1]?.trim()
                          ? `${parts[0]?.trim()}: ${parts[1]?.trim()}`
                          : parts[0]?.trim();
                        return (
                          <li key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                            <span>{displayText}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* 3. Price */}
                <div className="px-4 py-3 border-t  border-gray-100">
                  <p className="text-[22px] mr-5 font-bold text-red-600">
                    ₹{(item.price ?? 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 line-through">
                    MRP ₹{(item.actual_price ?? item.price ?? 0).toFixed(2)}
                  </p>
                {(item.actual_price > 0 && item.actual_price > item.price) && (
  <p className="text-xs text-green-600 font-medium">
    You Save ₹{(item.actual_price - item.price).toFixed(2)}
    ({Math.round(((item.actual_price - item.price) / item.actual_price) * 100)}%)
  </p>
)}
                  {item.discount > 0 && (
                    <p className="text-xs text-green-700 font-semibold mt-1">
                      Coupon Discount: -₹{item.discount.toFixed(2)}
                    </p>
                  )}
                  {/* Mobile — Warranty Display */}
{item.warrantyData?.year > 0 && item.warrantyData?.price > 0 && (
  <div className="flex items-center gap-2 mt-2 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
    <span className="text-blue-600 text-sm">🛡️</span>
    <div>
     <p className="text-xs font-semibold text-blue-700">
        {item.warrantyData.name || `${item.warrantyData.year} Year Extended Warranty`}
      </p>
      <p className="text-xs text-gray-500">
        + ₹{item.warrantyData.price?.toLocaleString("en-IN")}
      </p>
    </div>
  </div>
)}
                </div>

                {/* 4. Quantity + Wishlist + Remove */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="border rounded-md overflow-hidden flex items-center h-[36px]">
                    <button
                      className="w-9 h-full text-lg text-gray-600 disabled:opacity-40"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1, null)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      className="w-9 h-full text-lg text-gray-600"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1, item.original_quantity)}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex gap-2">
                  <button
  className="border border-[#d7def8] text-[#0f3cc9] px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
  onClick={() => moveToWishlist(item.productId)}
>
  ♡ Wishlist
</button>
                    <button
                      onClick={() => confirmRemoveItem(item.productId)}
                      className="border border-[#d7def8] text-[#0f3cc9] px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap"
                    >
                      🗑 Remove
                    </button>
                  </div>
                </div>

                {/* 5. Delivery check */}
             {itemIndex === 0 && <div className="px-4 py-3 border-t border-gray-100 bg-[#f6f8fc]">
  <p className="font-medium text-xs mb-2 flex items-center gap-1.5">
    <MdLocalShipping className="text-[16px] text-[#0f3cc9]" />
    Check delivery availability
  </p>
  <div className="flex">
    <input
      type="text"
      placeholder="Enter Pincode"
      maxLength={6}
      id={`pincode-mobile-${item.productId}`}
      className="flex-1 border rounded-l-md px-3 h-8 text-xs"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const val = e.target.value;
          const result = checkDelivery(val);
          const msgEl = document.getElementById(`pinmsg-mobile-${item.productId}`);
          if (msgEl) {
            msgEl.textContent = result.message;
            msgEl.className = `text-xs mt-1 ${result.available ? 'text-green-600' : 'text-red-500'}`;
          }
        }
      }}
    />
    <button
      className="bg-[#0f3cc9] text-white px-4 h-8 rounded-r-md text-xs"
      onClick={() => {
        const val = document.getElementById(`pincode-mobile-${item.productId}`)?.value || '';
        const result = checkDelivery(val);
        const msgEl = document.getElementById(`pinmsg-mobile-${item.productId}`);
        if (msgEl) {
          msgEl.textContent = result.message;
          msgEl.className = `text-xs mt-1 ${result.available ? 'text-green-600' : 'text-red-500'}`;
        }
      }}
    >
      Check
    </button>
  </div>
  <p id={`pinmsg-mobile-${item.productId}`} className="text-xs mt-1"></p>
</div>}

              </div>
              {/* ── END MOBILE CARD ── */} 

            </div>
          ))}

          {/* ── MOBILE PRICE SUMMARY (below all items, only < lg) ── */}
          <div className="lg:hidden mt-2 border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
            <h3 className="text-sm font-bold text-gray-700 tracking-wide">PRICE DETAILS</h3>

       <div className="flex flex-col gap-3 text-sm text-gray-700">
  <div className="flex justify-between">
    <span>Product Price</span>
    <span className="font-semibold text-gray-900">₹{calculateMRP().toFixed(2)}</span>
  </div>
  <div className="flex justify-between">
    <span className="text-green-600">Discount</span>
    <span className="font-semibold text-green-600">-₹{calculateItemDiscount().toFixed(2)}</span>
  </div>
  <hr className="border-gray-200" />
  {cartData.items.some(item => item.warrantyData) && (
    <div className="flex justify-between items-center">
      <span>Extended Warranty</span>
      <span className="font-semibold text-blue-600">
        + ₹{cartData.items
          .reduce((sum, item) => sum + (item.warrantyData?.price || 0), 0)
          .toLocaleString("en-IN")}
      </span>
    </div>
  )}
  <div className="flex justify-between">
    <span>Subtotal</span>
    <span className="font-semibold text-gray-900">₹{calculateSubtotal().toFixed(2)}</span>
  </div>
</div>

            {/* Coupon input */}
            <div>

                  {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
{couponSuccess && <p className="text-green-600 text-sm mt-2">{couponSuccess}</p>}
{!couponFeatureEnabled && (
  <p className="text-xs text-gray-500 mt-2">Coupons are currently disabled</p>
)}
{validActiveOfferCodes.length > 0 && (
  <div className="mt-3 flex flex-col gap-2">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Available Offers</p>
    {validActiveOfferCodes.map((offer) => (
      <div key={offer.code} className="flex items-center justify-between border border-dashed border-blue-300 rounded-lg px-3 py-2 bg-blue-50">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#0f3cc9]">{offer.code}</span>
          <span className="text-xs text-gray-500">
            {offer.percentage > 0
              ? `${offer.percentage}% off`
              : offer.fixed_price > 0
              ? `₹${offer.fixed_price} off`
              : "Special offer"}
          </span>
        </div>
        <button
          onClick={() => {
            setCouponCode(offer.code);
            setCouponError("");
            setCouponSuccess("");
          }}
          className="text-xs text-[#0f3cc9] font-semibold border border-[#0f3cc9] px-2 py-1 rounded hover:bg-blue-100 transition"
        >
          Apply
        </button>
      </div>
    ))}
    
     <a href="https://truco.avaniko.com/api/api/download.html?tid=019acf86-5371-447f-a6f7-eeca624972ad&source=web&medium=web&campaign=truco"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 mt-1 py-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 transition group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#0f3cc9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
      </svg>
      <span className="text-[11px] font-bold text-[#0f3cc9] group-hover:underline">Download Truco App</span>
      <span className="text-[11px] text-gray-500">— Exclusive Offers & Coupons Await!</span>
    </a>
  </div>
)}
              <div className="flex mt-4 items-center">
                <input
                  id="coupon_input_mobile"
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError("");
                    setCouponSuccess("");
                  }}
                  placeholder="Enter coupon code"
                  disabled={!couponFeatureEnabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm"
                />
                <button
                  onClick={validateCoupon}
                  disabled={isValidatingCoupon || !couponFeatureEnabled}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-r-lg"
                >
                  {isValidatingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>
        
            </div>

            {appliedCoupon && calculateDiscount() > 0 && (
  <div className="flex justify-between items-center text-sm">
    <div className="flex items-center gap-2">
      <span className="text-green-700">Coupon ({appliedCoupon.offer_code})</span>
      <button
        onClick={removeCoupon}
        className="text-red-500 text-xs underline hover:text-red-600"
      >
        Remove
      </button>
    </div>
    <span className="font-semibold text-green-600">-₹{calculateDiscount().toFixed(2)}</span>
  </div>
)}

            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <div>
                <p className="font-bold text-gray-900">Total Payable</p>
                <p className="text-xs text-gray-400">(Inclusive of all taxes)</p>
              </div>
              <span className="text-xl font-bold text-gray-900">₹{calculateTotal().toFixed(2)}</span>
            </div>

            <button
              onClick={proceedToCheckout}
              className="w-full py-3 rounded-md text-white font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              style={{ backgroundColor: "#2453D3" }}
            >
              <MdLock className="text-[16px]" /> Proceed Securely
            </button>

            {/* Trust badges */}
<div className="grid grid-cols-4 gap-2 pt-2 text-center">
  <div className="flex flex-col items-center gap-1">
    <MdSecurity className="text-[22px] text-blue-600" />
    <span className="text-[10px] text-gray-500 leading-tight">Secure Payments</span>
  </div>
  <div className="flex flex-col items-center gap-1">
    <MdLoop className="text-[22px] text-green-500" />
    <span className="text-[10px] text-gray-500 leading-tight">Easy Returns</span>
  </div>
  <div className="flex flex-col items-center gap-1">
    <MdVerified className="text-[22px] text-blue-500" />
    <span className="text-[10px] text-gray-500 leading-tight">100% Original Products</span>
  </div>
  <div className="flex flex-col items-center gap-1">
    <MdCardMembership className="text-[22px] text-purple-500" />
    <span className="text-[10px] text-gray-500 leading-tight">Brand Warranty</span>
  </div>
</div>
          </div>
          {/* ── END MOBILE PRICE SUMMARY ── */}

        </div>
        {/* END LEFT COLUMN */}

        {/* RIGHT: Price Details sidebar — desktop only */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="border border-gray-200 rounded-lg p-4 lg:sticky lg:top-4 space-y-4">
            <h3 className="text-sm font-bold text-gray-700 tracking-wide">PRICE DETAILS</h3>

           <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
  <div className="flex justify-between items-center">
    <span>Product Price</span>
    <span className="font-semibold text-gray-900">₹{calculateMRP().toFixed(2)}</span>
  </div>
  <div className="flex justify-between items-center">
    <span className="text-green-600">Discount</span>
    <span className="font-semibold text-green-600">-₹{calculateItemDiscount().toFixed(2)}</span>
  </div>
  <hr className="border-gray-200" />
  
  {cartData.items.some(item => item.warrantyData?.year > 0 && item.warrantyData?.price > 0) && (
    <div className="flex justify-between items-center">
      <span>Extended Warranty</span>
      <span className="font-semibold text-blue-600">
        + ₹{cartData.items
          .reduce((sum, item) => sum + (item.warrantyData?.price || 0), 0)
          .toLocaleString("en-IN")}
      </span>
    </div>
  )}
  <div className="flex justify-between items-center">
    <span>Subtotal</span>
    <span className="font-semibold text-gray-900">₹{calculateSubtotal().toFixed(2)}</span>
  </div>
</div>
            <div className="mt-3">
                           {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
{couponSuccess && <p className="text-green-600 text-sm mt-2">{couponSuccess}</p>}
{!couponFeatureEnabled && (
  <p className="text-xs text-gray-500 mt-2">Coupons are currently disabled</p>
)}
{validActiveOfferCodes.length > 0 && (
  <div className="mt-3 flex flex-col gap-2">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Available Offers</p>
    {validActiveOfferCodes.map((offer) => (
      <div key={offer.code} className="flex items-center justify-between border border-dashed border-blue-300 rounded-lg px-3 py-2 bg-blue-50">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#0f3cc9]">{offer.code}</span>
          <span className="text-xs text-gray-500">
            {offer.percentage > 0
              ? `${offer.percentage}% off`
              : offer.fixed_price > 0
              ? `₹${offer.fixed_price} off`
              : "Special offer"}
          </span>
        </div>
        <button
          onClick={() => {
            setCouponCode(offer.code);
            setCouponError("");
            setCouponSuccess("");
          }}
          className="text-xs text-[#0f3cc9] font-semibold border border-[#0f3cc9] px-2 py-1 rounded hover:bg-blue-100 transition"
        >
          Apply
        </button>
      </div>
    ))}  
    
     <a href="https://truco.avaniko.com/api/api/download.html?tid=019acf86-5371-447f-a6f7-eeca624972ad&source=web&medium=web&campaign=truco"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 mt-1 py-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 transition group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#0f3cc9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
      </svg>
      <span className="text-[11px] font-bold text-[#0f3cc9] group-hover:underline">Download Truco App</span>
      <span className="text-[11px] text-gray-500">— Exclusive Offers & Coupons Await!</span>
    </a>
  </div>
)}
              <div className="flex mt-4 items-center">
                <input
                  id="coupon_input"
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError("");
                    setCouponSuccess("");
                  }}
                  placeholder="Enter coupon code"
                  disabled={!couponFeatureEnabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm"
                />
                <button
                  onClick={validateCoupon}
                  disabled={isValidatingCoupon || !couponFeatureEnabled}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-r-lg"
                >
                  {isValidatingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>

            </div>

            {appliedCoupon && calculateDiscount() > 0 && (
  <div className="flex justify-between items-center text-sm">
    <div className="flex items-center gap-2">
      <span className="text-green-700">Coupon ({appliedCoupon.offer_code})</span>
      <button
        onClick={removeCoupon}
        className="text-red-500 text-xs underline hover:text-red-600"
      >
        Remove
      </button>
    </div>
    <span className="font-semibold text-green-600">-₹{calculateDiscount().toFixed(2)}</span>
  </div>
)}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <div>
                <p className="font-bold text-gray-900">Total Payable</p>
                <p className="text-xs text-gray-400">(Inclusive of all taxes)</p>
              </div>
              <span className="text-xl font-bold text-gray-900">₹{calculateTotal().toFixed(2)}</span>
            </div>

            <button
              onClick={proceedToCheckout}
              className="w-full py-3 rounded-md text-white font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              style={{ backgroundColor: "#2453D3" }}
            >
             <MdLock className="text-[16px]" /> Proceed Securely
            </button>

           {/* Trust badges */}
<div className="grid grid-cols-4 gap-2 pt-2 text-center">
  <div className="flex flex-col items-center gap-1">
    <MdSecurity className="text-[22px] text-blue-600" />
    <span className="text-[10px] text-gray-500 leading-tight">Secure Payments</span>
  </div>
  <div className="flex flex-col items-center gap-1">
    <MdLoop className="text-[22px] text-green-500" />
    <span className="text-[10px] text-gray-500 leading-tight">Easy Returns</span>
  </div>
  <div className="flex flex-col items-center gap-1">
    <MdVerified className="text-[22px] text-blue-500" />
    <span className="text-[10px] text-gray-500 leading-tight">100% Original Products</span>
  </div>
  <div className="flex flex-col items-center gap-1">
    <MdCardMembership className="text-[22px] text-purple-500" />
    <span className="text-[10px] text-gray-500 leading-tight">Brand Warranty</span>
  </div>
</div>
          </div>
        </div>
        {/* END RIGHT SIDEBAR */}

      </div>
      {/* Complete Your Purchase */}
         <CompleteYourPurchase
                  products={completeYourPurchase}
                  scrollRef={completeScrollRef}
                 updateCartCount={updateCartCount}
                 onAddSuccess={() => window.location.reload()}
                 />
    </div>

  </div>
);
}