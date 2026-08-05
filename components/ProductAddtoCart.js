"use client";
import { FaPhoneAlt, FaEnvelope, FaTimes, FaShareAlt } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa";
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useModal } from '@/context/ModalContext';
import { useHeaderdetails } from '@/context/HeaderContext';
import { ToastContainer, toast } from 'react-toastify';
import { trackAddToCart } from "@/utils/nextjs-event-tracking.js";

import { FaShoppingCart} from "react-icons/fa";

import { v4 as uuidv4 } from "uuid";

const AddToCartButton = ({ productId, quantity = 1, warranty, additionalProducts = [], extendedWarranty, selectedFrequentProducts = [], stockQuantity = 1, special_price, onSuccess,buttonLabel, buttonClassName, movement, productName, productSlug, warrantyData }) => { const { openAuthModal } = useModal();
  const { updateHeaderdetails, setIsLoggedIn, setUserData, setIsAdmin } = useHeaderdetails();
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  // const [showAuthModal, setShowAuthModal] = useState(false);
  // const [authError, setAuthError] = useState('');
  const [cartSuccess, setCartSuccess] = useState(false);
  const [showOpenBoxPopup, setShowOpenBoxPopup] = useState(false);
  const isOutOfStock = stockQuantity <= 0;
  const isprice = special_price <= 0;
  const isOpenBox = (movement === "FOCUS" || movement === "EOL") && stockQuantity < 10; 
  const { cartCount, updateCartCount } = useCart();
  const handleAddToCart = async () => {
     if (isOutOfStock) return;

     if(isprice){
      return;
     }
      if (isOpenBox) {
  if (productSlug) {
    // Check if we're already on the product detail page
    const isOnProductPage = window.location.pathname === `/product/${productSlug}`;
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
      setIsLoading(true);
      // setAuthError('');
      setCartSuccess(false);
      
      try {
        const token = localStorage.getItem('token');

        let isLoggedIn = false;
        let userData = null;


        // Check authentication
        /*
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          }
        });
        
        const data = await response.json();
        
         if (!data.loggedIn) {
          openAuthModal({
            error: 'Please log in to continue.',
            onSuccess: () => handleAddToCart(), // retry on success
          });
          return;
        }

      
        if (data.loggedIn) {
          updateHeaderdetails({ user: data.user });
            setIsLoggedIn(true);
            const role = data.role;
          if(role == 'admin'){
            setIsAdmin(true);
          }
        }
          */

        if (token) {
          const response = await fetch("/api/auth/check", {
            method: "GET",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          isLoggedIn = data.loggedIn;
          userData = data.user;
          updateHeaderdetails({ user: data.user });
          setIsLoggedIn(true);
          const role = data.role;
          if(role == 'admin'){
            setIsAdmin(true);
          }
        }

        // ✅ If not logged in → use guestCartId
        let guestCartId = null;

        if (!isLoggedIn) {
          guestCartId = localStorage.getItem("guestCartId") || uuidv4();
          localStorage.setItem("guestCartId", guestCartId);
        }

        const proresponse = await fetch(`/api/product/get/${productId}`);
       
        if (!proresponse.ok) {
          throw new Error(`HTTP error! status: ${proresponse.status}`);
        }
        
        const productData = await proresponse.json();
        const original_prod_quantity = productData.data.quantity;
  
        // Add main product to cart
        /*
        const cartResponse = await fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId, quantity, 
          selectedWarranty: warranty,
          selectedExtendedWarranty: extendedWarranty,}),
        }); */

        // ✅ Add main product to cart
        const cartResponse = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(isLoggedIn && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            productId,
            original_prod_quantity,
            quantity,
            selectedWarranty: warranty,
            selectedExtendedWarranty: extendedWarranty,
            warrantyData: warrantyData || null,
            ...(guestCartId && { guestCartId }), 
          }),
        });

        if(cartResponse.ok) {
          toast.success("Product added!");
        }

        if(cartResponse.status == 409) {
          toast.error("Stock limit exceeded!");
          return;
        }
    
        if (!cartResponse.ok) {
          throw new Error('Failed to add to cart');
        }
        
        // console.log(cartResponse);
        // Add additional products if any
        /*
        if (additionalProducts.length > 0) {
          await Promise.all(
            additionalProducts.map(async (additionalId) => {
              const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: additionalId, quantity: 1 }),
              });
              if (!res.ok) throw new Error('Failed to add additional product');
            })
          );
        }
          */

        if (additionalProducts.length > 0) {
          await Promise.all(
            additionalProducts.map(async (additionalId) => {
              const res = await fetch("/api/cart", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(isLoggedIn && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                  productId: additionalId,
                  quantity: 1,
                  ...(guestCartId && { guestCartId }),
                }),
              });
              if (!res.ok) throw new Error("Failed to add additional product");
            })
          );
        }
  
        const responseData = await cartResponse.json();
        updateCartCount(responseData.cart.totalItems + additionalProducts.length);

        // ✅ Track events (skip if guest)
        if (isLoggedIn) {
          trackAddToCart({
            user: {
              name: userData?.name,
              phone: userData?.phone,
              email: userData?.email,
            },
            product: {
              id: productId,
              name: responseData.cart.items[0].name,
              price: responseData.cart.items[0].price,
              link: `${apiUrl}/product/${productData.data.slug}`,
              image: `${apiUrl}/uploads/products/${responseData.cart.items[0].image}`,
              qty: responseData.cart.items[0].quantity,
              currency: "INR",
            },
          });
        }
        
        // ✅ Store selected product IDs for persistence
        if (selectedFrequentProducts?.length > 0) {
          const ids = selectedFrequentProducts.map(p => p._id);
          localStorage.setItem("selectedFrequentProductIds", JSON.stringify(ids));
        } else {
          localStorage.removeItem("selectedFrequentProductIds");
        }
  
        setCartSuccess(true);
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error('Add to cart error:', error);
        setAuthError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
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
    {stockQuantity > 0 && (
<button
  onClick={handleAddToCart}
  disabled={isLoading || isOutOfStock || isprice}
  className={`w-full px-4 py-2.5 rounded-md transition duration-300 flex items-center justify-center gap-2 text-center
    ${buttonClassName
      ? 'font-medium text-sm'
      : 'shadow-md text-md gap-x-3 font-semibold'}
    ${isOutOfStock
      ? 'bg-gray-400 cursor-not-allowed text-white'
      : isLoading
        ? 'bg-blue-700 cursor-not-allowed opacity-75 text-white'
        : cartSuccess
          ? 'bg-green-500 text-white hover:bg-green-600'
: buttonClassName || 'bg-white hover:bg-customBlue hover:text-white text-customBlue border border-blue-200'    }
    active:scale-95 disabled:active:scale-100`}
>
  {isOutOfStock ? (
    <span>Out of Stock</span>
  ) : isLoading ? (
    <>
      <svg
        className="animate-spin h-5 w-5"
        viewBox="0 0 24 24"
      >
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>
    <span>{buttonLabel || "Add to Cart"}</span>
    </>
  )}
</button>
)}


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
  const email = "customercare@bharathelectronics.in";
  const whatsappNumber = "919842344323";

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in this product: ${productName}\n${productUrl}`)}`;
  const mailUrl = `mailto:${email}?subject=${encodeURIComponent(`Enquiry: ${productName}`)}&body=${encodeURIComponent(`Hi,\n\nI'm interested in the following product:\n\nProduct: ${productName}\nLink: ${productUrl}\n\nPlease assist me.`)}`;

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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.55)" }}>
     <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-sm relative px-5 py-3 md:py-4">

        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10">
          <FaTimes size={15} />
        </button>

       {/* Box Image - small */}
        <div className="hidden md:flex justify-center mb-1 md:mb-2">
          <img src="/uploads/openBoxPopUp.png" alt="Open Box" className="w-9 h-9 md:w-12 md:h-12 object-contain" />
        </div>

        {/* Title */}
        <h3 className="text-center text-[15px] md:text-[16px] font-bold text-gray-900 mb-2">Open Box Product</h3>

        {/* Stock Badge */}
        <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-3">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="text-[12px] font-semibold text-amber-700">
            Limited Stock Available (Only {stockQuantity} units left!)
          </span>
        </div>

        {/* Description */}
        <p className="text-center text-[12px] text-gray-600 leading-relaxed mb-0.5">
          This is an <span className="font-bold text-orange-500">Open Box / Clearance Sale</span> item with limited stock availability.
        </p>
        <p className="text-center text-[11.5px] text-gray-500 leading-relaxed mb-3">
          <span className="font-semibold text-gray-700">Home delivery may not be available</span> for this product. Please contact our team to check store availability, condition, price and pickup options.
        </p>

        {/* 3 Feature Icons */}
       
{/* 3 Feature Icons */}
{/* 3 Feature Icons */}
<div className="hidden md:grid grid-cols-3 gap-2 mb-2 md:mb-3">
  <div className="flex flex-col items-center gap-1">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
    <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">Store Pickup<br/>Recommended</span>
  </div>
  <div className="flex flex-col items-center gap-1">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
    <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">Limited Stock<br/>Available</span>
  </div>
  <div className="flex flex-col items-center gap-1">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
    <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">Quality Checked<br/>by BEA Team</span>
  </div>
</div>

        {/* Info Note */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1 md:py-1.5 mb-2 md:mb-3">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span className="text-[11px] text-blue-700 font-medium">Final price & availability will be confirmed by BEA team.</span>
        </div>

        {/* 3 Contact Buttons */}
        <div className="flex flex-col gap-1.5 md:gap-2 mb-2 md:mb-3">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-2 md:py-2.5 transition-colors">
            <FaWhatsapp size={20} />
            <div>
              <div className="text-[12px] font-semibold leading-tight">WhatsApp Us</div>
              <div className="text-[10.5px] opacity-80 leading-tight">Chat with our team</div>
            </div>
          </a>
          {/* <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 md:py-2.5 transition-colors w-full"
          >
            <FaShareAlt size={18} />
            <div className="text-left">
              <div className="text-[12px] font-semibold leading-tight">Share</div>
              <div className="text-[10.5px] opacity-80 leading-tight">Share this product</div>
            </div>
          </button> */}
          <a href={`tel:${phone}`}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 transition-colors">
            <FaPhoneAlt size={16} />
            <div>
              <div className="text-[12px] font-semibold leading-tight">Call Us</div>
              <div className="text-[10.5px] opacity-80 leading-tight">98423 44323</div>
            </div>
          </a>
          <a href={mailUrl}
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl px-4 py-2.5 transition-colors">
            <FaEnvelope size={16} />
            <div>
              <div className="text-[12px] font-semibold leading-tight">Email Us</div>
              <div className="text-[10.5px] opacity-80 leading-tight">customercare@bharathelectronics.in</div>
            </div>
          </a>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#9ca3af" stroke="none">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          <span className="text-[10px] text-gray-400">Your details are safe with us. We respect your privacy.</span>
        </div>

      </div>
    </div>
  );
}
export default AddToCartButton;