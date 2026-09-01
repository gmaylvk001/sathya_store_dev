"use client";
import {
  FaShoppingCart,
  FaPhoneAlt,
  FaEnvelope,
  FaTimes,
  FaShareAlt,
} from "react-icons/fa";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useModal } from "@/context/ModalContext";
import { ToastContainer, toast } from "react-toastify";
import { useHeaderdetails } from "@/context/HeaderContext";
import { trackAddToCart, ga4AddToCart } from "@/utils/nextjs-event-tracking";

import { v4 as uuidv4 } from "uuid";

const AddToCartButton = ({
  productId,
  quantity = 1,
  warranty,
  additionalProducts = [],
  extendedWarranty,
  selectedFrequentProducts = [],
  stockQuantity = 1,
  special_price,
  movement,
  productName,
  productSlug,
  className = "",
}) => {
  const { openAuthModal } = useModal();
  const { updateHeaderdetails, setIsLoggedIn, setUserData, setIsAdmin } =
    useHeaderdetails();
  const [isLoading, setIsLoading] = useState(false);
  // const [showAuthModal, setShowAuthModal] = useState(false);
  // const [authError, setAuthError] = useState('');
  const [cartSuccess, setCartSuccess] = useState(false);
  const isOutOfStock = stockQuantity <= 0;
  const isOpenBox =
    (movement === "FOCUS" || movement === "EOL") && stockQuantity < 10;
  const [showOpenBoxPopup, setShowOpenBoxPopup] = useState(false);
  // const isprice = special_price <= 0;
  const { cartCount, updateCartCount } = useCart();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    if (isOpenBox) {
      if (productSlug) {
        // Check if we're already on the product detail page
        const isOnProductPage =
          window.location.pathname === `/product/${productSlug}`;
        if (isOnProductPage) {
          setShowOpenBoxPopup(true);
        } else {
          window.location.href = `/product/${productSlug}`;
        }
      } else {
        setShowOpenBoxPopup(true);
      }
      return;
    }
    //  if(isprice){
    //   return;
    //  }
    setIsLoading(true);
    // setAuthError('');
    setCartSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const isLoggedIn = Boolean(token);
      let guestCartId = null;
      if (!token) {
        guestCartId = localStorage.getItem("guestCartId") || uuidv4();
        localStorage.setItem("guestCartId", guestCartId);
      }

      // ✅ Add main product to cart in a single direct API request
      const effectiveGuestCartId = guestCartId || (typeof window !== "undefined" ? localStorage.getItem("guestCartId") : null);
      const cartResponse = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(effectiveGuestCartId && { guestCartId: effectiveGuestCartId }),
        },
        body: JSON.stringify({
          productId,
          original_prod_quantity: stockQuantity,
          quantity,
          selectedWarranty: warranty,
          selectedExtendedWarranty: extendedWarranty,
          guestCartId: effectiveGuestCartId || undefined,
        }),
      });

      if (cartResponse.status == 409) {
        toast.error("Stock limit exceeded!");
        return;
      }

      if (!cartResponse.ok) {
        const errData = await cartResponse.json().catch(() => ({}));
        const errMsg = errData.error || "Failed to add to cart";
        toast.error(errMsg);
        throw new Error(errMsg);
      }

      toast.success("Product added!");

      // ✅ Add additional products (if any)
      if (additionalProducts.length > 0) {
        await Promise.all(
          additionalProducts.map(async (additionalId) => {
            const res = await fetch("/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
                ...(effectiveGuestCartId && { guestCartId: effectiveGuestCartId }),
              },
              body: JSON.stringify({
                productId: additionalId,
                quantity: 1,
                guestCartId: effectiveGuestCartId || undefined,
              }),
            });
            if (!res.ok) throw new Error("Failed to add additional product");
          }),
        );
      }

      const responseData = await cartResponse.json();
      if (responseData.guestCartId && typeof window !== "undefined") {
        localStorage.setItem("guestCartId", responseData.guestCartId);
      }
      console.log("📦 responseData:", responseData);
      updateCartCount(responseData.cart.totalItems + additionalProducts.length);
      console.log("🔔 About to call ga4AddToCart");

      // ✅ GA4 add_to_cart (fires for all users, logged in or guest)
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

      // ✅ Email marketing track (logged-in only)
      if (isLoggedIn) {
        trackAddToCart({
          user_info: {
            user_name: userData?.name,
            phone: userData?.mobile,
            email: userData?.email,
          },
          product_info: {
            product_id: productId,
            product_link: `${apiUrl}/product/${productData.data.slug}`,
            product_name: responseData.cart.items[0].name,
            price: responseData.cart.items[0].price,
            image: `${apiUrl}/uploads/products/${responseData.cart.items[0].image}`,
            qty: responseData.cart.items[0].quantity,
            currency: "INR",
          },
        });
      }

      // ✅ Store frequently bought together
      if (selectedFrequentProducts?.length > 0) {
        const ids = selectedFrequentProducts.map((p) => p._id);
        localStorage.setItem("selectedFrequentProductIds", JSON.stringify(ids));
      } else {
        localStorage.removeItem("selectedFrequentProductIds");
      }

      setCartSuccess(true);
    } catch (error) {
      console.error("Add to cart error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const trackAddToCart = ({ user_info, product_info }) => {
    if (
      typeof window !== "undefined" &&
      window._em_event &&
      typeof window._em_event.track === "function"
    ) {
      window._em_event.track({
        event: "btnClick",
        action: "addToCart",
        user_info,
        product_info,
      });
    } else {
      console.warn("Adtarbo not loaded yet");
    }
  };
  const sizeClass = className || "w-full min-[1400px]:w-[185px]";

  return (
    <>
      {showOpenBoxPopup && (
        <OpenBoxPopup
          onClose={() => setShowOpenBoxPopup(false)}
          productName={productName}
          productSlug={productSlug}
          stockQuantity={stockQuantity}
        />
      )}
      <button
        onClick={handleAddToCart}
        disabled={isLoading || isOutOfStock}
        className={`px-2 py-2 md:px-2 md:py-2 mr-1 rounded-md shadow-md transition duration-300 text-md flex items-center justify-center gap-x-1
    ${
      isOutOfStock
        ? "bg-gray-400 cursor-not-allowed text-white"
        : isLoading
        ? "bg-[#d72828] cursor-not-allowed opacity-75"
        : cartSuccess
        ? "bg-green-500 text-white hover:bg-green-600"
        : "bg-white text-[#d72828] hover:bg-[#d72828] hover:text-white"
    }
    active:scale-95 disabled:active:scale-100
    ${sizeClass}`}
        style={{
          boxShadow:
            "rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgb(209, 213, 219) 0px 0px 0px 1px inset",
        }}
      >
        {isOutOfStock ? (
          <span>Out of Stock</span>
        ) : isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="hidden sm:inline">Adding...</span>
          </>
        ) : cartSuccess ? (
          <>
            <FaShoppingCart />
            <span className="hidden sm:inline">Added to Cart</span>
            <span className="sm:hidden">Added</span>
          </>
        ) : (
          <>
            {/* <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>  */}

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 32 32"
              fill="currentColor"
            >
              <defs></defs>
              <g id="cart">
                <path
                  className="cls-1"
                  d="M29.46 10.14A2.94 2.94 0 0 0 27.1 9H10.22L8.76 6.35A2.67 2.67 0 0 0 6.41 5H3a1 1 0 0 0 0 2h3.41a.68.68 0 0 1 .6.31l1.65 3 .86 9.32a3.84 3.84 0 0 0 4 3.38h10.37a3.92 3.92 0 0 0 3.85-2.78l2.17-7.82a2.58 2.58 0 0 0-.45-2.27zM28 11.86l-2.17 7.83A1.93 1.93 0 0 1 23.89 21H13.48a1.89 1.89 0 0 1-2-1.56L10.73 11H27.1a1 1 0 0 1 .77.35.59.59 0 0 1 .13.51z"
                />
                <circle className="cls-1" cx="14" cy="26" r="2" />
                <circle className="cls-1" cx="24" cy="26" r="2" />
              </g>
            </svg>

            <span className="hidden sm:inline">Add to Cart</span>
            <span className="sm:hidden">Add</span>
          </>
        )}
      </button>
      {/* 
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            handleAddToCart();
          }}
          error={authError}
        />
      )} */}
    </>
  );
};

// Auth Modal Component

function OpenBoxPopup({ onClose, productName, productSlug, stockQuantity }) {
  const productUrl = `${process.env.NEXT_PUBLIC_API_URL}/product/${productSlug}`;
  const phone = "9842344323";
  const email = "customercare@sathya.store";

  const mailUrl = `mailto:${email}?subject=${encodeURIComponent(
    `Enquiry: ${productName}`,
  )}&body=${encodeURIComponent(
    `Hi,\n\nI'm interested in the following product:\n\nProduct: ${productName}\nLink: ${productUrl}\n\nPlease assist me.`,
  )}`;

  const handleShare = async () => {
    const shareText = `Hi, I'm interested in this product: ${productName}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: productName,
          text: shareText,
          url: productUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${productUrl}`);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-sm relative px-5 py-3 md:py-4">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
        >
          <FaTimes size={15} />
        </button>

        {/* Box Image - small */}
        <div className="hidden md:flex justify-center mb-1 md:mb-2">
          <img
            src="/uploads/openBoxPopUp.png"
            alt="Open Box"
            className="w-9 h-9 md:w-12 md:h-12 object-contain"
          />
        </div>

        {/* Title */}
        <h3 className="text-center text-[15px] md:text-[16px] font-bold text-gray-900 mb-2">
          Open Box Product
        </h3>

        {/* Stock Badge */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1 md:py-1.5 mb-2 md:mb-3">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-[12px] font-semibold text-amber-700">
            Limited Stock Available (Only {stockQuantity} units left!)
          </span>
        </div>

        {/* Description */}
        <p className="text-center text-[12px] text-gray-600 leading-relaxed mb-1">
          This is an{" "}
          <span className="font-bold text-orange-500">
            Open Box / Clearance Sale
          </span>{" "}
          item with limited stock availability.
        </p>
        <p className="text-center text-[11.5px] text-gray-500 leading-relaxed mb-2 sm:mb-3">
          <span className="font-semibold text-gray-700">
            Home delivery may not be available
          </span>{" "}
          for this product. Please contact our team to check store availability,
          condition, price and pickup options.
        </p>

        {/* 3 Feature Icons */}
        {/* 3 Feature Icons */}
        <div className="hidden md:grid grid-cols-3 gap-2 mb-2 md:mb-3">
          <div className="flex flex-col items-center gap-1">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">
              Store Pickup
              <br />
              Recommended
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">
              Limited Stock
              <br />
              Available
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">
              Quality Checked
              <br />
              by Sathya Stores Team
            </span>
          </div>
        </div>

        {/* Info Note */}
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 mb-3">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d72828"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-[11px] text-[#d72828] font-medium">
            Final price & availability will be confirmed by Sathya Stores team.
          </span>
        </div>

        {/* Contact Buttons */}
        <div className="flex flex-col gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-3 bg-[#d72828] hover:bg-[#c02020] text-white rounded-xl px-4 py-2.5 transition-colors"
          >
            <FaPhoneAlt size={16} />
            <div>
              <div className="text-[12px] font-semibold leading-tight">
                Call Us
              </div>
              <div className="text-[10.5px] opacity-80 leading-tight">
                98423 44323
              </div>
            </div>
          </a>
          <a
            href={mailUrl}
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl px-4 py-2.5 transition-colors"
          >
            <FaEnvelope size={16} />
            <div>
              <div className="text-[12px] font-semibold leading-tight">
                Email Us
              </div>
              <div className="text-[10.5px] opacity-80 leading-tight">
                customercare@sathya.store
              </div>
            </div>
          </a>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-1.5">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="#9ca3af"
            stroke="none"
          >
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
          </svg>
          <span className="text-[10px] text-gray-400">
            Your details are safe with us. We respect your privacy.
          </span>
        </div>
      </div>
    </div>
  );
}

export default AddToCartButton;
