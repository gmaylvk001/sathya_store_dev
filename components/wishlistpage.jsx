"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { v4 as uuidv4 } from "uuid";
import { useCart } from "@/context/CartContext";
import { useModal } from "@/context/ModalContext";
import { useHeaderdetails } from "@/context/HeaderContext";
import { trackAddToCart, ga4AddToCart } from "@/utils/nextjs-event-tracking";

function formatPrice(n) {
  return new Intl.NumberFormat("en-IN").format(n);
}

async function addProductToCart({ productId, quantity = 1, updateCartCount, apiUrl }) {
  const token = localStorage.getItem("token");
  let isLoggedIn = false;
  let userData = null;
  let guestCartId = null;

  if (token) {
    const authRes = await fetch("/api/auth/check", {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const authData = await authRes.json();
    isLoggedIn = authData.loggedIn;
    userData = authData.user;
  }

  if (!isLoggedIn) {
    guestCartId = localStorage.getItem("guestCartId") || uuidv4();
    localStorage.setItem("guestCartId", guestCartId);
  }

  const proRes = await fetch(`/api/product/get/${productId}`);
  if (!proRes.ok) throw new Error(`Product fetch failed: ${proRes.status}`);
  const productData = await proRes.json();
  const original_prod_quantity = productData.data.quantity;

  const cartRes = await fetch("/api/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(isLoggedIn && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      productId,
      original_prod_quantity,
      quantity,
      ...(guestCartId && { guestCartId }),
    }),
  });

  if (cartRes.status === 409) {
    toast.error("Stock limit exceeded!");
    return null;
  }
  if (!cartRes.ok) throw new Error("Failed to add to cart");

  const responseData = await cartRes.json();
  updateCartCount(responseData.cart.totalItems);

  ga4AddToCart({
    product: {
      id: productId,
      name: productData.data.name,
      price:
        productData.data.special_price > 0
          ? productData.data.special_price
          : productData.data.price,
      qty: quantity,
    },
  });

  if (isLoggedIn && userData) {
    trackAddToCart({
      user_info: {
        user_name: userData?.name,
        phone: userData?.mobile,
        email: userData?.email,
      },
      product_info: {
        product_id: productId,
        product_link: `${apiUrl}/product/${productData.data.slug}`,
        product_name: responseData.cart.items[0]?.name,
        price: responseData.cart.items[0]?.price,
        image: `${apiUrl}/uploads/products/${responseData.cart.items[0]?.image}`,
        qty: responseData.cart.items[0]?.quantity,
        currency: "INR",
      },
    });
  }

  return responseData;
}

// ─── Banner ───────────────────────────────────────────────────────────────────
function WishlistBanner({ count }) {
  return (
    <div className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-0 sm:px-3 md:px-6 lg:px-8">
      <div
        className="relative bg-white rounded-2xl shadow-sm overflow-hidden"
        style={{ minHeight: "clamp(100px, 20vw, 290px)" }}
      >
        <Image
          src="/wishlist/wishlistBanner1.png"
          alt="wishlist banner"
          fill
          style={{ objectFit: "cover", objectPosition: "right center" }}
          priority
        />
        <div className="hidden lg:flex absolute bottom-5 left-[-1px] flex-row gap-3 flex-nowrap z-10">
          <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-2.5 shadow bg-white/80 backdrop-blur-sm">
            <Image src="/wishlist/heart.webp" className="w-[40px] h-[40px]" alt="saved" width={40} height={40} />
            <div className="flex flex-col">
              <strong className="text-base font-bold text-pink-500 leading-none">{count}</strong>
              <span className="text-xs text-gray-600 whitespace-nowrap">Saved Products</span>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-2.5 shadow bg-white/80 backdrop-blur-sm">
            <Image src="/wishlist/across.webp" className="w-[40px] h-[40px]" alt="stores" width={40} height={40} />
            <div className="flex flex-col">
              <strong className="text-sm font-bold text-gray-900 whitespace-nowrap">Available Across</strong>
              <span className="text-xs text-gray-600 whitespace-nowrap">Sathya Stores</span>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-2.5 shadow bg-white/80 backdrop-blur-sm">
            <Image src="/wishlist/fastDelivery.webp" className="w-[40px] h-[40px]" alt="delivery" width={40} height={40} />
            <div className="flex flex-col">
              <strong className="text-sm font-bold text-gray-900 whitespace-nowrap">Fast Delivery</strong>
              <span className="text-xs text-gray-600 whitespace-nowrap">Across Tamil Nadu</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex lg:hidden flex-row gap-2 mt-3 flex-nowrap overflow-x-auto pb-1">
        <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2 shadow-sm bg-white flex-shrink-0">
<Image src="/wishlist/heart.webp" loading="eager" className="w-[36px] h-[36px] flex-shrink-0" alt="saved" width={36} height={36} />
          <div className="flex flex-col">
            <strong className="text-sm font-bold text-pink-500 leading-none">{count}</strong>
            <span className="text-[11px] text-gray-600 whitespace-nowrap">Saved Products</span>
          </div>
        </div>
        <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2 shadow-sm bg-white flex-shrink-0">
<Image src="/wishlist/across.webp" loading="eager" className="w-[36px] h-[36px] flex-shrink-0" alt="stores" width={36} height={36} />
          <div className="flex flex-col">
            <strong className="text-xs font-bold text-gray-900 whitespace-nowrap">Available Across</strong>
            <span className="text-[11px] text-gray-600 whitespace-nowrap">Sathya Stores</span>
          </div>
        </div>
        <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2 shadow-sm bg-white flex-shrink-0">
<Image src="/wishlist/fastDelivery.webp" loading="eager" className="w-[36px] h-[36px] flex-shrink-0" alt="delivery" width={36} height={36} />
          <div className="flex flex-col">
            <strong className="text-xs font-bold text-gray-900 whitespace-nowrap">Fast Delivery</strong>
            <span className="text-[11px] text-gray-600 whitespace-nowrap">Across Tamil Nadu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function WishlistToolbar({ total, selectedIds, onSelectAll, onClear, onMoveToCart }) {
  const allSelected = total > 0 && selectedIds.length === total;
  const someSelected = selectedIds.length > 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-xl px-4 py-3.5 shadow-sm mb-4">
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => onSelectAll(e.target.checked)}
          className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
        />
        <span className="text-sm font-semibold text-gray-800">Select All ({total})</span>
      </label>
      {someSelected && (
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onClear}
            className="flex items-center justify-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
            Clear Wishlist
          </button>
          <button
            onClick={onMoveToCart}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
            </svg>
            Move All to Cart
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function WishlistProductCard({ item, selected, onSelect, onRemove, onAddToCart, brandMap }) {
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const brandData = brandMap?.[item.brand] || null;
  const brandName = brandData?.brand_name || item.brand || "";
  const brandImage = brandData?.image ? `/uploads/Brands/${brandData.image}` : null;

  const handleCartClick = async () => {
    if (item.stockStatus !== "In Stock") return;
    setAddingToCart(true);
    try {
      await onAddToCart(item);
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2500);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const CartButton = ({ fullWidth = false }) => (
    <button
      onClick={handleCartClick}
      disabled={addingToCart || item.stockStatus !== "In Stock"}
      className={`flex items-center justify-center gap-1.5 rounded-lg font-bold transition-colors
        ${fullWidth ? "w-full py-2 text-xs" : "py-2.5 px-4 text-sm"}
        ${item.stockStatus !== "In Stock"
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : cartAdded
          ? "bg-green-500 text-white"
          : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
    >
      {addingToCart ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : cartAdded ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Added!
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
          </svg>
          Add to Cart
        </>
      )}
    </button>
  );

  return (
    <>
      {/* DESKTOP (lg+) */}
      <div
        className={`hidden lg:grid lg:grid-cols-[auto_200px_1fr_auto_auto] gap-4 items-start px-5 py-5 border-b border-gray-100 transition-colors
          ${selected ? "bg-blue-50 border-l-4 border-l-blue-500" : "bg-white border-l-4 border-l-transparent"}`}
      >
        <div className="pt-2">
          <input type="checkbox" checked={selected} onChange={(e) => onSelect(item.id, e.target.checked)}
            className="w-5 h-5 accent-blue-600 cursor-pointer" />
        </div>
        <div className="relative w-[200px] h-[160px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
          <Link href={`/product/${item.slug}`}>
            {item.image && item.image.startsWith("/") ? (
              <Image src={item.image} alt={item.name} fill style={{ objectFit: "contain" }} sizes="200px" className="p-3" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
          </Link>
        </div>
        <div className="flex flex-col gap-2 min-w-0 py-1">
          <div className="flex items-center gap-1.5 border border-gray-300 rounded px-2 py-1 w-fit bg-white">
            {brandImage && (
              <div className="w-8 h-5 relative flex-shrink-0">
                <Image src={brandImage} alt={brandName} fill style={{ objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            )}
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">{brandName}</span>
          </div>
          <Link href={`/product/${item.slug}`} className="text-[15px] font-bold text-gray-900 hover:text-blue-600 leading-snug line-clamp-2">
            {item.name}
          </Link>
          <p className="text-xs text-gray-500 font-medium">{item.model_number}</p>
          {item.specs?.length > 0 && (
            <ul className="flex flex-col gap-1 mt-1">
              {item.specs.slice(0, 3).map((spec, i) => {
                const parts = spec.split(":");
                const displayText = parts[1]?.trim() ? `${parts[0]?.trim()}: ${parts[1]?.trim()}` : parts[0]?.trim();
                return (
                  <li key={i} className="flex items-center gap-1.5 text-[12px] text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="truncate max-w-[260px]">{displayText}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex flex-wrap gap-4 mt-1">
            <span className="text-xs font-medium text-gray-800"><span className="text-green-500">✔</span> 100% Original</span>
            <span className="text-xs font-medium text-gray-800"><span className="text-green-500">✔</span> Authorized Warranty</span>
            <span className="text-xs font-medium text-gray-800"><span className="text-green-500">✔</span> Easy EMI Available</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[180px] py-1 border-l border-gray-100 pl-4">
          <p className="text-2xl font-extrabold text-gray-900">₹ {formatPrice(item.price)}</p>
         <div className="flex items-center gap-2">
            <s className="text-sm text-gray-400">₹ {formatPrice(item.original_price)}</s>
            <span className="text-xs font-bold text-green-700">{item.discount_percent}% OFF</span>
          </div>
          {item.savings_amount > 0 && (
            <span className="text-sm font-bold text-green-700 px-1 py-1 w-fit">You Save ₹ {formatPrice(item.savings_amount)}</span>
          )}
          {item.stockStatus === "In Stock" ? (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-green-600">In Stock</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-red-500">Out of Stock</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 relative flex-shrink-0">
              <Image src="/wishlist/truck.png" alt="delivery" fill style={{ objectFit: "contain" }} />
            </div>
            <span className="text-xs text-gray-600 font-medium">Fast Delivery Available</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
            <div className="w-5 h-5 relative flex-shrink-0">
              <Image src="/wishlist/card.png" alt="emi" fill style={{ objectFit: "contain" }} />
            </div>
            <span className="text-xs font-semibold text-amber-800">EMI from ₹ {formatPrice(Math.round(item.price / 24))}/month</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 min-w-[160px] py-1 border-l border-gray-100 pl-4">
          <CartButton />
          <button
            onClick={() => onRemove(item.id)}
            className="flex items-center justify-center gap-2 text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50 rounded-lg py-2 px-4 text-xs font-semibold transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            </svg>
            Remove
          </button>
        </div>
      </div>

      {/* MOBILE / TABLET (< lg) — 1 col mobile, 2 col tablet */}
      <div
        className={`lg:hidden flex flex-col rounded-xl overflow-hidden border transition-colors
          ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
      >
        <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
          <div className="absolute top-2 left-2 z-10">
            <input type="checkbox" checked={selected} onChange={(e) => onSelect(item.id, e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer" />
          </div>
          {item.discount_percent > 0 && (
            <span className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{item.discount_percent}%
            </span>
          )}
          <Link href={`/product/${item.slug}`}>
            {item.image && item.image.startsWith("/") ? (
              <Image src={item.image} alt={item.name} fill style={{ objectFit: "contain" }} sizes="250px" className="p-3 hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
          </Link>
        </div>
        <div className="flex flex-col gap-1.5 p-2.5 flex-1">
          <Link href={`/product/${item.slug}`} className="text-[12px] font-semibold text-gray-900 hover:text-blue-600 leading-snug line-clamp-2 min-h-[32px]">
            {item.name}
          </Link>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-extrabold text-gray-900">₹ {formatPrice(item.price)}</span>
            {item.original_price > item.price && (
              <s className="text-[10px] text-gray-400">₹ {formatPrice(item.original_price)}</s>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.stockStatus === "In Stock" ? "bg-green-500" : "bg-red-400"}`} />
            <span className={`text-[10px] font-semibold ${item.stockStatus === "In Stock" ? "text-green-600" : "text-red-500"}`}>
              {item.stockStatus}
            </span>
          </div>
          <div className="mt-auto pt-1.5">
            <CartButton fullWidth />
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 border-t border-gray-100 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
          Remove
        </button>
      </div>
    </>
  );
}

// ─── You May Also Like ────────────────────────────────────────────────────────
function YouMayLike({ relatedProducts }) {
  const scrollRef = useRef(null);
  const { updateCartCount } = useCart();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;



  const scrollByAmount = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-700">You May Also Like</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollByAmount(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 transition-colors shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => scrollByAmount(1)}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 transition-colors shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <Link href="/products" className="text-sm text-blue-700 font-semibold hover:underline ml-1">View All →</Link>
        </div>
      </div>

{!relatedProducts || relatedProducts.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
              <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3" />
              <div className="h-2 bg-gray-100 rounded w-11/12 mb-2" />
              <div className="h-2 bg-gray-100 rounded w-8/12 mb-3" />
              <div className="h-7 bg-blue-50 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:gap-3 lg:overflow-x-auto lg:pb-2 lg:scrollbar-hide gap-3"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {relatedProducts.map((product) => (
            <YouMayLikeCard
              key={product._id}
              product={product}
              updateCartCount={updateCartCount}
              apiUrl={apiUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function YouMayLikeCard({ product, updateCartCount, apiUrl }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (product.quantity === 0) return;
    setAdding(true);
    try {
      await addProductToCart({ productId: product._id, quantity: 1, updateCartCount, apiUrl });
      toast.success("Product added!");
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all lg:flex-shrink-0 lg:w-[165px] flex flex-col overflow-hidden"  >
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        {product.discount_percent > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            -{product.discount_percent}%
          </span>
        )}
        <Link href={`/product/${product.slug || product._id}`}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            style={{ objectFit: "contain" }}
            className="p-3 hover:scale-105 transition-transform duration-300"
            unoptimized
            onError={(e) => { e.target.src = ""; }}
          />
        </Link>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/product/${product.slug || product._id}`}>
          <p className="text-xs font-medium text-gray-900 hover:text-blue-500 line-clamp-2 leading-snug mb-2 min-h-[32px]">
            {product.name}
          </p>
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-gray-900">₹ {Number(product.price).toLocaleString("en-IN")}</span>
          {product.discount_percent > 0 && (
            <span className="text-xs text-gray-400 line-through">₹ {Number(product.original_price).toLocaleString("en-IN")}</span>
          )}
        </div>
        <div className="flex items-center gap-1 mb-3">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${product.quantity > 0 ? "bg-green-500" : "bg-red-400"}`} />
          <span className={`text-[10px] font-semibold ${product.quantity > 0 ? "text-green-600" : "text-red-500"}`}>
            {product.quantity > 0 ? "In Stock" : "Out of Stock"}
          </span>
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || product.quantity === 0}
          className={`mt-auto w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors
            ${product.quantity === 0
              ? "border border-gray-200 text-gray-400 cursor-not-allowed"
              : added
              ? "bg-green-500 text-white border border-green-500"
              : "border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
            }`}
        >
          {adding ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : added ? (
            "Added ✓"
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
              </svg>
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Recently Viewed ──────────────────────────────────────────────────────────
function RecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const fetchRecent = async () => {
      setIsLoading(true);
      const storedString = localStorage.getItem("recentlyViewed");
      let stored = [];
      try { stored = JSON.parse(storedString) || []; } catch { stored = []; }
      if (!Array.isArray(stored)) stored = [];
      stored = stored.filter((p) => p.quantity > 0);
      if (stored.length === 0) { setIsLoading(false); return; }
      try {
        const response = await fetch("/api/brand");
        const result = await response.json();
        const brandMap = {};
        (result.data || []).forEach((b) => { brandMap[b._id] = b.brand_name; });
        setRecentProducts(stored.map((p) => ({ ...p, brand: brandMap[p.brand] || p.brand })).slice(0, 6));
      } catch {
        setRecentProducts(stored.slice(0, 6));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const handleClick = (product) => {
    if (navigating) return;
    setNavigating(true);
    const stored = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    const updated = stored.filter((p) => p._id !== product._id);
    updated.unshift(product);
    localStorage.setItem("recentlyViewed", JSON.stringify(updated.slice(0, 10)));
    router.push(`/product/${product.slug || product._id}`);
  };

  if (isLoading) {
    return (
      <div className="w-full lg:w-[380px] flex-shrink-0">
        <h2 className="text-xl font-bold text-blue-700 mb-4">Recently Viewed</h2>
        {/* mobile: 1 col, sm+: 2 col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100 animate-pulse">
              <div className="w-[70px] h-[70px] bg-gray-100 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-2 bg-gray-100 rounded w-full mb-1.5" />
                <div className="h-2 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentProducts.length === 0) return null;

  return (
    <>
      {navigating && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-black bg-opacity-30">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
        </div>
      )}
      <div className="w-full lg:w-[380px] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-700">Recently Viewed</h2>
          <Link href="/products" className="text-sm text-blue-700 font-semibold hover:underline">View All →</Link>
        </div>
        {/* mobile: 1 col, sm+: 2 col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recentProducts.map((product) => {
            const specialPrice = Number(product.special_price);
            const originalPrice = Number(product.price);
            const price = specialPrice > 0 && specialPrice < originalPrice ? specialPrice : originalPrice;
            const imageUrl = product.images?.[0]
              ? product.images[0].startsWith("http") ? product.images[0] : `/uploads/products/${product.images[0]}`
              : null;
            return (
              <div
                key={product._id}
                onClick={() => handleClick(product)}
                className="flex flex-row items-center gap-3 bg-white rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all cursor-pointer"
              >
                <div className="relative w-[70px] h-[70px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={product.name} fill style={{ objectFit: "contain" }} className="p-1" unoptimized onError={(e) => { e.target.src = ""; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug mb-1">{product.name}</p>
                  <p className="text-sm font-bold text-gray-900">₹ {price.toLocaleString("en-IN")}</p>
                  {specialPrice > 0 && specialPrice < originalPrice && (
                    <p className="text-[10px] text-gray-400 line-through">₹ {originalPrice.toLocaleString("en-IN")}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Empty / Login / Loading states ──────────────────────────────────────────
function EmptyWishlist() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto">
      <span className="text-6xl mb-4">💔</span>
      <h2 className="text-xl font-bold text-blue-700 mb-2">Your wishlist is empty</h2>
      <p className="text-gray-500 text-sm mb-6">Save products you love and find them here anytime.</p>
      <Link href="/products" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors">
        Start Shopping
      </Link>
    </div>
  );
}
function LoginPrompt() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto">
      <span className="text-6xl mb-4">🔐</span>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Login to view your Wishlist</h2>
      <p className="text-gray-500 text-sm mb-6">Sign in to access your saved products across devices.</p>
      <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors">
        Login / Sign Up
      </Link>
    </div>
  );
}
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Loading your wishlist...</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_OUTER_CLASS =
  "w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-0 sm:px-3 md:px-6 lg:px-8 py-5 pb-16";
const PAGE_CONTENT_CLASS = "max-w-7xl mx-auto px-4 md:px-6 lg:px-8";

function WishlistPageShell({ children }) {
  return (
    <>
      <div className="bg-blue-50 py-4 px-4 md:px-8 lg:px-10">
        <nav className="flex items-center gap-2 text-sm text-gray-500 max-w-7xl mx-auto">
          <Link href="/" className="text-gray-600 hover:text-blue-600">
            Home
          </Link>
          <span>›</span>
          <span className="text-blue-600 font-semibold">Wishlist</span>
        </nav>
      </div>
      <section className={PAGE_OUTER_CLASS}>
        <div className={PAGE_CONTENT_CLASS}>{children}</div>
      </section>
    </>
  );
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [brandMap, setBrandMap] = useState({});
  const { updateCartCount } = useCart();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) { setIsLoggedIn(false); setLoading(false); return; }
    setIsLoggedIn(true);
    try {
      const res = await fetch("/api/wishlist/get", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setItems(data.items || []);
      setRelatedProducts(data.relatedProducts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  useEffect(() => {
    fetch("/api/brand/get")
      .then((r) => r.json())
      .then((result) => {
        const map = {};
        (result.brands || []).forEach((b) => { map[b.id] = b; });
        setBrandMap(map);
      })
      .catch(console.error);
  }, []);

  const handleSelectItem = (id, checked) =>
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));
  const handleSelectAll = (checked) =>
    setSelectedIds(checked ? items.map((i) => i.id) : []);

 const handleRemove = async (wishlistEntryId) => {
    const token = localStorage.getItem("token");
    const item = items.find((i) => i.id === wishlistEntryId);
    if (!item) return;
    console.log("ITEM OBJECT:", item);
    try {
      const res = await fetch(`/api/wishlist/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: item.productId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to remove item");
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== wishlistEntryId));
      setSelectedIds((prev) => prev.filter((x) => x !== wishlistEntryId));
    } catch (e) {
      console.error(e);
      toast.error("Failed to remove item");
    }
  };

 const handleClear = async () => {
    const token = localStorage.getItem("token");
    try {
      const selectedItems = items.filter((i) => selectedIds.includes(i.id));
      await Promise.all(
        selectedItems.map((item) =>
          fetch(`/api/wishlist/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ productId: item.productId }),
          })
        )
      );
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
      toast.success("Wishlist cleared");
    } catch (e) {
      console.error(e);
      toast.error("Failed to clear wishlist");
    }
  };

  const handleAddToCart = async (item) => {
    await addProductToCart({
      productId: item.productId,
      quantity: 1,
      updateCartCount,
      apiUrl,
    });
    toast.success("Product added!");
  };

 const handleMoveToCart = async () => {
    const selectedItems = items.filter((i) => selectedIds.includes(i.id));
    try {
      await Promise.all(selectedItems.map((item) => handleAddToCart(item)));
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedItems.map((item) =>
          fetch(`/api/wishlist/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ productId: item.productId }),
          })
        )
      );
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
      router.push("/cart");
    } catch (e) {
      console.error(e);
      toast.error("Failed to move items to cart");
    }
  };

  if (loading) {
    return (
      <WishlistPageShell>
        <LoadingState />
      </WishlistPageShell>
    );
  }
  if (!isLoggedIn) {
    return (
      <WishlistPageShell>
        <LoginPrompt />
      </WishlistPageShell>
    );
  }

  return (
    <WishlistPageShell>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} />

      <WishlistBanner count={items.length} />

      {items.length === 0 ? (
        <EmptyWishlist />
      ) : (
        <>
          <WishlistToolbar
            total={items.length}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onClear={handleClear}
            onMoveToCart={handleMoveToCart}
          />
          {/* Desktop (lg+) */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
            {items.map((item) => (
              <WishlistProductCard
                key={item.id}
                item={item}
                brandMap={brandMap}
                selected={selectedIds.includes(item.id)}
                onSelect={handleSelectItem}
                onRemove={handleRemove}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {/* Mobile: 1 col, Tablet (sm+): 2 col, never 3 col */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <WishlistProductCard
                key={item.id}
                item={item}
                brandMap={brandMap}
                selected={selectedIds.includes(item.id)}
                onSelect={handleSelectItem}
                onRemove={handleRemove}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </>
      )}

      <section className="mt-12 flex flex-col lg:flex-row gap-6 items-start overflow-hidden">
        <YouMayLike relatedProducts={relatedProducts} />
        <RecentlyViewed />
      </section>
    </WishlistPageShell>
  );
}