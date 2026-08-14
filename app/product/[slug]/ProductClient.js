'use client';


import ProductDetailsSection from "@/components/ProductDetailsSection";
// import RelatedProducts from "@/components/RelatedProducts";
import {  useEffect, useState, useRef,useMemo, useCallback } from "react";

import { ShieldHalf } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { FaStore } from "react-icons/fa";
import { FaShield } from "react-icons/fa6";
import { FaShoppingCart, FaHeart, FaShareAlt, FaRupeeSign, FaCartPlus, FaBell } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { TbTruckDelivery } from "react-icons/tb";
import { IoFastFoodOutline, IoReload, IoCardOutline, IoShieldCheckmark, IoStorefront } from "react-icons/io5";
import Link from "next/link";
import { useCart } from '@/context/CartContext';
import { useModal } from '@/context/ModalContext';
import ProductCard from "@/components/ProductCard";
import ProductAddtoCart from "@/components/ProductAddtoCart"
import AddToWishlistButton from "@/components/ProductCard";

import ProductBreadcrumb from "@/components/ProductBreadcrumb";
import RecentlyViewedProducts from '@/components/RecentlyViewedProducts';
import RelatedProducts from "@/components/RelatedProducts";
import RazorpayOffers from "@/components/RazorpayOffers";
import { v4 as uuidv4 } from "uuid";


function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
      >
        <span className="text-sm text-gray-700 pr-4">{question}</span>
        <span className={`text-gray-400 text-xl transition-transform duration-200 flex-shrink-0 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-gray-500 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}



export default function ProductClient() {
  const router = useRouter(); 
  const { slug } = useParams();
  const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [brand, setBrand] = useState([]);
   const [selectedRelatedProducts, setSelectedRelatedProducts] = useState([]);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showEMIModal, setShowEMIModal] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [selectedWarrantyAmount, setSelectedWarrantyAmount] = useState(0);
  const [showNoWarrantyModal, setShowNoWarrantyModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [faqs, setFaqs] = useState([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState([]);
  const [isDesktop, setIsDesktop] = useState(false);
const [addOnProducts, setAddOnProducts] = useState([]);
 const [warranties, setWarranties] = useState([]);
const [selectedWarrantyData, setSelectedWarrantyData] = useState(null);

const outlineActionBtnClass =
  "flex items-center justify-center gap-2 border border-gray-300 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#d72828] hover:border-red-400 hover:bg-red-50 transition-colors whitespace-nowrap";
const addToCartOutlineClass =
  "w-full border border-gray-300 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-[#d72828] hover:border-red-400 hover:bg-red-50 transition-colors shadow-none";

const addOnIds = Array.isArray(product?.add_ons)
  ? product.add_ons.map(id => id.toString())
  : [];


  useEffect(() => {
  console.log("useEffect triggered", product?._id, addOnIds);
}, [product?._id]);

useEffect(() => {
  if (!product?._id) return;
  // FAQs are stored on the product document; no separate FAQ API route exists
  setFaqs(Array.isArray(product.faqs) ? product.faqs : []);
}, [product?._id, product?.faqs]); 

useEffect(() => {
  if (!Array.isArray(product?.add_ons) || product.add_ons.length === 0) return;

  const ids = product.add_ons.map(id => id.toString());

  const fetchAddOnProducts = async () => {
    try {
      const res = await fetch("/api/product/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      const data = await res.json();
      setAddOnProducts(data.products || []);
    } catch (e) {
      setAddOnProducts([]);
    }
  };

  fetchAddOnProducts();
}, [product?.add_ons]);

useEffect(() => {
  const fetchRecentlyViewed = async () => {
    // Step 1: localStorage safe read
    const storedString = localStorage.getItem("recentlyViewed");
    let stored = [];
    try {
      stored = JSON.parse(storedString) || [];
    } catch {
      stored = [];
    }

    // Step 2: array check + quantity filter
    if (!Array.isArray(stored)) stored = [];
    stored = stored.filter((p) => p.quantity > 0);

    if (stored.length === 0) return;

    // Step 3: fetch brands and map
    try {
      const response = await fetch("/api/brand");
      const result = await response.json();

      if (!result.error) {
        const brandMap = {};
        result.data.forEach((b) => {
          brandMap[b._id] = b.brand_name;
        });

        const productsWithBrands = stored.map((p) => ({
          ...p,
          brand: brandMap[p.brand] || p.brand,
        }));

        setRecentlyViewedProducts(productsWithBrands);
      } else {
        setRecentlyViewedProducts(stored);
      }
    } catch {
      setRecentlyViewedProducts(stored);
    }
  };

  fetchRecentlyViewed();
}, []);
 useEffect(() => {
  const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
  handleResize(); // run initial check
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

useEffect(() => {
  if (!product?.warranty_ids || product.warranty_ids.length === 0) return;

 
  fetch(`/api/warranties/by-item-nos?item_nos=${product.warranty_ids.join(",")}`)
    .then((r) => r.json())
    .then((d) => setWarranties(d.warranties || []));
}, [product?.warranty_ids]);
const handleDecrease = () => {
  setQuantity(Math.max(1, quantity - 1));
  setQuantityWarning(false); // clear warning when decreasing
};
const handleIncrease = () => {
  if (quantity < product.quantity) {
    setQuantity(quantity + 1);
    setQuantityWarning(false); // clear warning if under limit
  } else {
    setQuantityWarning(true); // show warning if exceeding
  }
};




// // Function to fetch category products
//   useEffect(() => {
//     const fetchCategoryProducts = async () => {
//       try {
//         const res = await fetch(`/api/product/category/${categoryId}?limit=5`);
//         const data = await res.json();
//         if (data.success) {
//           setCategoryProducts(data.products);
//         }
//       } catch (error) {
//         console.error("Error fetching category products:", error);
//       }
//     };

//     if (categoryId) fetchCategoryProducts();
//   }, [categoryId]);



const { updateCartCount } = useCart();
  const { openAuthModal } = useModal();
const handleBuyNow = async () => {
  console.log("Buying now with warranty:", selectedWarranty, selectedExtendedWarranty);
  try {
    const token = localStorage.getItem("token");

    let isLoggedIn = false;
    let userData = null;

    /*

    // ✅ Check authentication
    const response = await fetch("/api/auth/check", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    const data = await response.json();
    if (!data.loggedIn) {
      openAuthModal({
        error: "Please log in to continue.",
        onSuccess: () => handleBuyNow(), // retry on success
      });
      return;
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

          //updateHeaderdetails({ user: data.user });
          //setIsLoggedIn(true);
          //const role = data.role;
          //if(role == 'admin'){
            //setIsAdmin(true);
          //}
        }

        // ✅ If not logged in → use guestCartId
        let guestCartId = null;
        if (!isLoggedIn) {
          guestCartId = localStorage.getItem("guestCartId") || uuidv4();
          localStorage.setItem("guestCartId", guestCartId);
        }

    // ✅ Add main product

    /*
    const cartResponse = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: product._id,
        quantity,
        selectedWarranty: selectedWarranty,
        selectedExtendedWarranty: selectedExtendedWarranty,
      }),
    });

    */

     // ✅ Add main product to cart
    const cartResponse = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(isLoggedIn && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        productId: product._id,
        quantity,
        selectedWarranty: selectedWarranty,
        selectedExtendedWarranty: selectedExtendedWarranty,
        warrantyData: selectedWarrantyData,
        ...(guestCartId && { guestCartId }),
      }),
    });

    if (!cartResponse.ok) {
      throw new Error("Failed to add main product to cart");
    }

    // ✅ Add frequent & related products
    const additionalProducts = [
      ...selectedFrequentProducts.map((p) => p._id),
      ...selectedRelatedProducts.map((p) => p._id),
    ];
    
    /*
    if (additionalProducts.length > 0) {
      await Promise.all(
        additionalProducts.map(async (id) => {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productId: id, quantity: 1 }),
          });
          if (!res.ok) throw new Error("Failed to add extra product");
        })
      );
    } */

    
    // ✅ Add additional products (if any)
    if (additionalProducts.length > 0) {
      await Promise.all(
        additionalProducts.map(async (id) => {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(isLoggedIn && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              productId: id,
              quantity: 1,
              ...(guestCartId && { guestCartId }),
            }),
          });
          if (!res.ok) throw new Error("Failed to add additional product");
        })
      );
    }

    const cartData = await cartResponse.json();
    updateCartCount(cartData.cart.totalItems + additionalProducts.length);

    // ✅ Build Buy Now items — use actual selling price in the price field
    const resolvePrice = (p) =>
      p.special_price && Number(p.special_price) > 0
        ? Number(p.special_price)
        : Number(p.price);

    const items = [
      {
        ...product,
        price: resolvePrice(product),           // actual selling price for checkout subtotal
        quantity,
        warranty: selectedWarranty || 0,
        extendedWarranty: selectedWarrantyAmount || 0, 
          warrantyData: selectedWarrantyData || null,
       
      },
      ...selectedFrequentProducts.map((p) => ({
        ...p,
        price: resolvePrice(p),
        quantity: 1,
      })),
      ...selectedRelatedProducts.map((p) => ({
        ...p,
        price: resolvePrice(p),
        quantity: 1,
      })),
    ];

    const total = items.reduce((sum, item) => {
  const basePrice = item.price * item.quantity;
  const warrantyCost = (item.warranty || 0) * item.quantity;
  const extendedCost = (item.extendedWarranty || 0) * item.quantity;
  const warrantyDataCost = (item.warrantyData?.price || 0) * item.quantity;
  return sum + basePrice + warrantyCost + extendedCost + warrantyDataCost;
}, 0);
    // ✅ Save Buy Now state so checkout can read the correct price
    localStorage.setItem(
      "buyNowData",
      JSON.stringify({ cart: { items }, total })
    );

    // ✅ Redirect
    window.location.href = "/checkout";
  } catch (err) {
    console.error("Buy Now error:", err);
  }
};

const handleShareProduct = useCallback(async () => {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({
        title: product?.name,
        url,
      });
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }
}, [product?.name]);




// const warranties = product?.extend_warranty || [];



  // In your ProductPage component, add these state variables near the top:
const [selectedFrequentProducts, setSelectedFrequentProducts] = useState([]);
const [cartTotal, setCartTotal] = useState(0);
const [selectedWarranty, setSelectedWarranty] = useState(null);
const [selectedExtendedWarranty, setSelectedExtendedWarranty] = useState(null);

  const [quantityWarning, setQuantityWarning] = useState(false);

// Add this function to handle frequent product selection
const toggleFrequentProduct = (product) => {
  setSelectedFrequentProducts(prev => {
    const existingIndex = prev.findIndex(p => p._id === product._id);
    if (existingIndex >= 0) {
      return prev.filter(p => p._id !== product._id);
    } else {
      return [...prev, product];
    }
  });
};

 // Fetch related products
  // // Fetch related products
  // const fetchRelatedProducts = async () => {
  //   try {
  //     setLoading(true);
  //     const res = await fetch(`/api/product/related?productId=${product._id}`);
  //     const data = await res.json();
      
  //     if (!res.ok) {
  //       throw new Error(`API error: ${res.status} ${res.statusText}`);
  //     }

  //     if (res.ok && data.success) {
  //       setRelatedProducts(data.products || []);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching related products:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if (product?._id) {
  //     fetchRelatedProducts(product._id);
  //   }
  // }, [product]);

  


  const categoryId = product?.category;
  const currentProductId = product?._id;
  const brandId = product?.brand;
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const res = await fetch(
          `/api/product/relatedpro?category=${categoryId}&brand=${brandId}&exclude=${currentProductId}&limit=5`
        );
        const data = await res.json();
        console.log("current related products is:", data);

        if (res.ok) {
          if (data.success && data.products) {
            setRelatedProducts(data.products);
          } else if (data.relatedProducts) {
            setRelatedProducts(data.relatedProducts);
          } else {
            setRelatedProducts([]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (categoryId && brandId) fetchRelatedProducts();
  }, [categoryId, brandId, currentProductId]);


  const toggleRelatedProduct = (product) => {
    setSelectedRelatedProducts(prev => {
      const existingIndex = prev.findIndex(p => p._id === product._id);
      if (existingIndex >= 0) {
        return prev.filter(p => p._id !== product._id);
      } else {
        return [...prev, product];
      }
    });
  };

//  Add this useEffect to calculate the cart total whenever selected products change
 // Calculate cart total
  useEffect(() => {
    let total = product ? (product.special_price || product.price) * quantity : 0;

    selectedFrequentProducts.forEach(item => {
      total += (item.special_price || item.price);
    });
    
    // NEW: Add selected related products to total
    selectedRelatedProducts.forEach(item => {
      total += (item.special_price || item.price);
    });

    if (selectedWarranty) total += selectedWarranty;
    if (selectedExtendedWarranty) total += selectedExtendedWarranty;

    setCartTotal(total);
  }, [selectedFrequentProducts, selectedRelatedProducts, product, quantity, selectedWarranty, selectedExtendedWarranty]);

useEffect(() => {
  const fetchFeaturedProducts = async () => {
    if (!product) return;
    const ids = product?.featured_products?.length ? product.featured_products : [];
    try {
      const res = await fetch('/api/product/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids, 
          category: product?.category, 
          brand: product?.brand, 
          limit: 2 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const fbtList = Array.isArray(data) ? data.slice(0, 2) : [];
        setFeaturedProducts(fbtList);
      }
    } catch (err) {
      console.error("FBT fetch error:", err);
    }
  };

  fetchFeaturedProducts();
}, [product]);
// derived main image
const mainImage = product?.images?.[selectedImageIndex] || "/no-image.jpg";
const matchedBrandForManufacturer = (() => {
  if (!product?.brand || !Array.isArray(brand)) return null;
  const brandId =
    typeof product.brand === "object"
      ? String(product.brand._id || product.brand.id || "")
      : String(product.brand);
  return brand.find((b) => String(b.value) === brandId) || null;
})();

// helper to resolve full path
const resolveImagePath = (image) => {
  if (!image) return "/uploads/sathyalogo.webp";
  if (
    image.startsWith("http") ||
    image.startsWith("blob:") ||
    image.startsWith("data:") ||
    image.startsWith("/")
  ) return image;
  return `/uploads/products/${image}`;
};


  const [selectedImage, setSelectedImage] = useState(null);

      useEffect(() => {
        if (product?.images?.[0]) {
          // setSelectedImage(`/uploads/products/${product.images[0]}`);
           setSelectedImage(product.images[0]);
        }
      }, [product]);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0, visible: false });
  const imgRef = useRef(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const zoomContainerRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");     // <-- declare this
  const [showGoHome, setShowGoHome] = useState(false);
  const [showZoomLens, setShowZoomLens] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
   const zoomLensRef = useRef(null);
   const zoomResultRef = useRef(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [showWarrantyModal, setshowWarrantyModal] = useState(false);
  const [showGstInvoiceModal, setshowGstInvoiceModal] = useState(false);

  // ###### Show Customer Reviews ###### //
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/product/${slug}`);
        
        // if (!response.ok) {
        //   throw new Error(`HTTP error! status: ${response.status}`);
        // }

        if (!response.ok) {
    // Instead of throwing an error, handle it gracefully
    setErrorMessage("Content not loading. Please try again later.");
    setShowGoHome(true);
    return;
  }
        
        const data = await response.json();
         // ✅ Final client-side check
        if (data.status !== "Active") {
          router.push("/404");
          return;
        }
        // console.log(data);
        
        // If API returns an array, find the product with matching slug
        if (Array.isArray(data)) {
          const foundProduct = data.find(p => p.slug === slug);
          if (!foundProduct) {
            throw new Error("Product not found");
          }
          setProduct(foundProduct);
        } 
        // If API returns a single product object
        else if (data && data.slug) {
          setProduct(data);
          // ###### Fetch Customer Reviews ###### //
          try {
            // fetch reviews
            const reviewsRes = await fetch(`/api/reviews/${data._id}`);
            const reviewsData = await reviewsRes.json();
 
            if (reviewsData.success) {
              setReviews(reviewsData.reviews);
              setAvgRating(reviewsData.avgRating);
              setReviewCount(reviewsData.count);
            }
          } catch (error) {
            console.error("Error fetching product or reviews:", error);
          }
 
        }
        else {
          throw new Error("Invalid product data");
        }
  
        if (product?.images?.length > 0) {
          setSelectedImage(`/uploads/products/${product.images[0]}`);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Something went wrong");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
  
    if (slug) {
      fetchProduct();
    }
  }, [slug]);




const fetchBrand = async () => {
    try {
      const response = await fetch("/api/brand");
      const result = await response.json();
      if (result.error) {
      console.error(result.error);
      } else {
        const data = result.data;
  
        // Format for react-select
        const brandOptions = data.map((b) => ({
          value: b._id,
          label: b.brand_name,
          manufacturer_name: b.manufacturer_name || "",
          manufacturer_address: b.manufacturer_address || "",
        }));
  
        setBrand(brandOptions);
        // 👉 If you already have the ID and want to get the label (e.g., when editing)
        if (product?.brand) {
  const matched = brandOptions.find((b) => b.value === product.brand);
  // if (matched) console.log("Selected Brand Name:", matched.label);
}

      }
    } catch (error) {
  console.error(error.message);
    }
  };

  useEffect(() => {
      fetchBrand();
    }, []);



  const handleThumbnailClick = (index) => {
  const imagePath = product.images?.[index];

  if (imagePath) {
    // Use same logic as main image src
    const finalSrc =
      imagePath.startsWith("http") ||
      imagePath.startsWith("blob:") ||
      imagePath.startsWith("data:")
        ? imagePath
        : `/uploads/products/${imagePath}`;

    setSelectedImage(finalSrc);
  }
};

  // Handle mouse movement for zoom lens
  const handleMouseMove = (e) => {
    if (!imgRef.current || !zoomLensRef.current || !zoomResultRef.current) return;
    
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    // Keep position within bounds
    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));
    
    setZoomPosition({ x: boundedX, y: boundedY });
    
    // Position the lens
    zoomLensRef.current.style.left = `calc(${boundedX}% - 75px)`;
    zoomLensRef.current.style.top = `calc(${boundedY}% - 75px)`;
    
    // Update the zoom result
    zoomResultRef.current.style.backgroundPosition = `${boundedX}% ${boundedY}%`;
  };

  const handleMouseEnter = () => {
    setShowZoomLens(true);
  };

  const handleMouseLeave = () => {
    setShowZoomLens(false);
  };

  const openLightbox = (index = 0) => {
  if (product?.images && product.images.length > 0) {
    setLightboxIndex(index);
    setLightboxOpen(true);
    setSelectedImage(product.images[index]);
  }
};


  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const navigateLightbox = (direction) => {
  if (!product?.images || product.images.length === 0) return;

  let newIndex;
  if (direction === "prev") {
    newIndex =
      (selectedImageIndex - 1 + product.images.length) % product.images.length;
  } else {
    newIndex = (selectedImageIndex + 1) % product.images.length;
  }

  setSelectedImageIndex(newIndex);
};

  // Handle keyboard events for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxOpen) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox('prev');
        if (e.key === 'ArrowRight') navigateLightbox('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d72828]"></div>
      </div>
    );
  }

  

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#d72828]">{error}</h2>
          <Link href="/" className="mt-4 inline-flex items-center text-[#d72828] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!product || !product.name ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Product not found</h2>
          <Link href="/" className="mt-4 inline-flex items-center text-[#d72828] hover:underline">
            ← Back to Homee
          </Link>
        </div>
      </div>
    );
  }

  if (!product || !product.images) {
    return null; // or return a skeleton/loading spinner
  }
  

  return (
    <div className="bg-white min-h-screen">
      {errorMessage && (
  <div className="text-center mt-10">
    <p className="text-red-600 text-lg mb-3">{errorMessage}</p>
    {showGoHome && (
      <a
        href="/"
        className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
      >
        Go to Home Page
      </a>
    )}
  </div>
)}


       <div className="container mx-auto px-2 md:px-4 pt-2 pb-8">
        
{/* ===== MOBILE & TABLET VIEW (hidden on desktop) ===== */}
<div className="block lg:hidden w-full">
  {/* Mobile Breadcrumb */}
  <ProductBreadcrumb product={product} className="mb-3 text-xs" />

  {/* 1. Product Image */}
  <div className="w-full relative">
    <div className="border border-gray-400 rounded-lg">
      <div
        className="relative aspect-square w-full px-4"
        onClick={() => openLightbox(0)}
        ref={zoomContainerRef}
      >
        <img
          src={resolveImagePath(mainImage) || "/uploads/sathyalogo.webp"}
          alt={product?.name || "Product"}
          className="w-full h-full object-contain rounded-xl"
          ref={imgRef}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/uploads/sathyalogo.webp"; }}
        />
      </div>
    </div>

    {/* Thumbnails */}
    {product.images && product.images.filter(img => img && img.trim() !== "").length > 0 && (
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
        {product.images.filter(img => img && img.trim() !== "").map((image, index) => (
          <div key={index} className="flex-shrink-0">
            <img
              src={resolveImagePath(image)}
              alt={`Thumbnail ${index + 1}`}
              className="w-16 h-16 border border-gray-400 rounded-lg cursor-pointer object-cover"
              onClick={() => setSelectedImageIndex(index)}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        ))}
      </div>
    )}


  </div>

  {/* 2. Brand + Name + Price */}
  <div className="mt-4">
    <div className="flex items-center justify-between">
      <p className="text-[#d72828] font-semibold text-sm uppercase tracking-wide">
        {brand.find((b) => b.value === product.brand)?.label || ""}
      </p>
     
    </div>
    <h1 className="text-lg font-bold text-gray-900 leading-snug mt-1">{product.name}</h1>
    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
      {product.model_number && <span>Model: {product.model_number}</span>}
      {product.model_number && product.item_code && <span className="text-gray-300">|</span>}
      {product.item_code && <span>SKU: {product.item_code}</span>}
    </div>
    {avgRating > 0 && (
      <div className="flex items-center gap-1 mt-2">
        <span className="text-yellow-400 text-sm">★</span>
        <span className="text-sm font-semibold text-gray-800">{avgRating}</span>
        <span className="text-xs text-[#d72828] underline">({reviewCount} Reviews)</span>
      </div>
    )}

    {/* Price */}
    <div className="mt-3 border-t border-gray-200 pt-3">
<div className="flex flex-col leading-tight">
  <span className="text-2xl font-bold text-[#d72828]">
    ₹ {Number(product.special_price > 0 ? product.special_price : product.price).toLocaleString('en-IN')}
  </span>
  {product.special_price > 0 && (
    <span className="text-xs text-gray-500 mt-0.5">Special Price</span>
  )}
</div>

{product.special_price > 0 && product.price > product.special_price && (
  <div className="flex w-full items-start justify-between gap-4 sm:gap-6 mt-3">
    <div className="flex flex-col leading-tight flex-1 min-w-0 pr-3 border-r border-gray-200">
      <span className="text-sm text-gray-500 line-through whitespace-nowrap">
        MRP ₹ {Number(product.price).toLocaleString('en-IN')}
      </span>
      <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
        (Inclusive of all taxes)
      </span>
    </div>

    <div className="flex flex-col leading-tight flex-1 min-w-0 px-3 border-r border-gray-200">
      <p className="text-green-600 font-semibold text-sm flex items-center gap-1 whitespace-nowrap">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        You Save ₹ {Number(product.price - product.special_price).toLocaleString('en-IN')}
      </p>
      <span className="text-xs text-gray-400 mt-1">
        Price includes all applicable taxes
      </span>
    </div>

    <div className="flex flex-col items-end justify-start flex-shrink-0 pl-3">
      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">
        {Math.round(((product.price - product.special_price) / product.price) * 100)}% OFF
      </span>
    </div>
  </div>
)}

{!(product.special_price > 0 && product.price > product.special_price) && (
  <p className="text-xs text-gray-400 mt-0.5">Price includes all applicable taxes</p>
)}
    </div>

    {/* Stock */}
    <div className="mt-2">
    {product.stock_status === "In Stock" && product.quantity > 0 ? (
  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
    <span className="flex items-center justify-center w-3 h-3 rounded-full bg-green-600 flex-shrink-0">
      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
    In Stock ({product.quantity} units)
  </span>
) : (
  <span className="text-red-600 font-semibold text-sm">✗ Out of Stock</span>
)}
      <p className="text-xs text-gray-600 mt-1">
        Sold by <span className="font-semibold">Sathya Stores</span>
      </p>
    </div>

    {/* FlixMedia minisite target */}
    <div className="key-fea"></div>

   {/* Share / Wishlist */}
    <div className="flex items-center gap-2 mt-3">
      <button
        onClick={handleShareProduct}
        className={`flex-1 ${outlineActionBtnClass}`}
        title="Share this product"
      >
        <FaShareAlt className="w-4 h-4 text-[#d72828]" />
        <span>Share</span>
      </button>
     <AddToWishlistButton
        productId={product._id}
        label="Add to Wishlist"
        iconSize={16}
        className={`flex-1 ${outlineActionBtnClass}`}
      />
    </div>

    {/* Quantity + Buy Now + Add to Cart */}
    <div className="mt-3">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center border border-gray-300 rounded px-2 py-1 gap-3">
          <button onClick={handleDecrease} className="text-gray-600 font-bold text-base">−</button>
          <span className="text-sm font-semibold w-5 text-center">{quantity}</span>
          <button onClick={handleIncrease} className="text-gray-600 font-bold text-base">+</button>
        </div>
        {quantityWarning && <p className="text-red-500 text-xs">Max {product.quantity} only</p>}
      </div>

      {product.stock_status === "In Stock" && product.quantity > 0 && (
        <div className="flex gap-3">
         <button
  onClick={handleBuyNow}
  disabled={(product.movement === "EOL" || product.movement === "FOCUS") && product.quantity <= 10}
  className={`flex-1 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm
    ${(product.movement === "EOL" || product.movement === "FOCUS") && product.quantity <= 10
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-[#d72828] hover:bg-[#c02020] text-white cursor-pointer"
    }`}
>
  <FaStore className="w-4 h-4" />
  Buy Now
</button>
          <div className="flex-1">
            <ProductAddtoCart
              productId={product._id}
              stockQuantity={product.quantity}
              quantity={quantity}
              additionalProducts={[...selectedFrequentProducts.map((p) => p._id), ...selectedRelatedProducts.map((p) => p._id)]}
              extendedWarranty={selectedWarrantyAmount}
              selectedFrequentProducts={selectedFrequentProducts}
              selectedRelatedProducts={selectedRelatedProducts}
               warrantyData={selectedWarrantyData}
              buttonLabel="Add to Cart"
              buttonClassName={addToCartOutlineClass}
                movement={product.movement}         
                 productName={product.name}        
                 productSlug={product.slug}  
            />
          </div>
        </div>
      )}
    </div>
  </div>

{/* Standard Mobile/Desktop Shared Wrapper Container */}
<div className="w-full block">
  {!isDesktop && (
  <div className="mt-4 border border-gray-300 rounded-lg p-4 bg-white">
    <h3 className="font-semibold text-gray-800 text-sm mb-3">Available Offers</h3>
    <RazorpayOffers amount={Number(product.special_price) || Number(product.price)} />
  </div>
)}
</div>
  {/* Add Ons — Mobile */}
  {addOnProducts.filter(item => item.quantity > 0 && item.status === "Active").length > 0 && (
    <div className="mt-4 border border-gray-300 rounded-lg bg-white">
      <div className="px-4 py-4">
        <h2 className="text-sm font-bold text-[#d72828] underline mb-2">Add Ons</h2>
        {addOnProducts.filter(item => item.quantity > 0 && item.status === "Active").slice(0, 3).map((item) => (
          <div key={item._id} className="flex items-start mb-4">
            <input type="checkbox" className="mt-2 mr-3"
              checked={selectedRelatedProducts.some(p => p._id === item._id)}
              onChange={() => toggleRelatedProduct(item)} />
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {item.images?.[0] && (
                <img src={`/uploads/products/${item.images[0]}`} alt={item.name} className="w-14 h-14 object-contain" />
              )}
              <div className="text-sm flex-1 min-w-0">
                <Link href={`/product/${item.slug}`}>
                  <h3 className="text-xs font-medium hover:text-[#d72828] line-clamp-2">{item.name}</h3>
                </Link>
                <span className="text-sm font-semibold text-red-600">
                  ₹ {(item.special_price > 0 ? item.special_price : item.price).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
  {/* Extended Warranty — Mobile */}
{warranties.length > 0 && (
  <div className="border border-gray-200 rounded-lg p-4 mt-3">
    <div className="flex items-center gap-2 mb-3">
      <FaShield className="text-[#d72828] w-5 h-5" />
      <h3 className="font-bold text-sm text-gray-800">Add Extended Warranty</h3>
    </div>

    {/* No Warranty option */}
    <label className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer">
      <div className="flex items-center gap-2">
        <input
          type="radio"
          name="warranty_mobile"
          checked={selectedWarrantyData === null}
          onChange={() => {
              setSelectedWarrantyData(null);
              setSelectedWarrantyAmount(0);
          }}
          className="accent-[#d72828]"
        />
        <span className="text-sm text-gray-700">No Extended Warranty</span>
      </div>
    </label>

    {/* Warranty options */}
    {warranties
      .sort((a, b) => a.year - b.year)
     
      .map((w) => (
        <label
          key={w.item_no}
          className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="warranty_mobile"
              checked={selectedWarrantyData?.item_no === w.item_no}
              onChange={() => {
                    setSelectedWarrantyData(w);
                     setSelectedWarrantyAmount(w.price);
                       }}
              className="accent-[#d72828]"
            />
            <span className="text-sm text-gray-700">{w.year} Year Extended Warranty</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">
            ₹ {w.price.toLocaleString("en-IN")}
          </span>
        </label>
      ))}
  </div>
)}
  {/* 4. ProductDetailsSection (Highlights, Overview, Specs, Reviews, FAQ) */}
  <div className="mt-4">
 <ProductDetailsSection
      product={product}
      reviews={reviews}
      avgRating={avgRating}
      reviewCount={reviewCount}
      manufacturerName={matchedBrandForManufacturer?.manufacturer_name}
      manufacturerAddress={matchedBrandForManufacturer?.manufacturer_address}
    />
  </div> 
   
  {/* 5. Frequently Bought Together */}
  {featuredProducts?.filter(item => item.stock_status === "In Stock").length > 0 && (
    <div className="mt-4 border border-gray-300 rounded-lg bg-white p-3">
      <h3 className="font-bold text-xs text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase tracking-wide">Frequently Bought Together:</h3>
      <div className="space-y-3">
        {featuredProducts.slice(0, 2).map((item) => (
          <div key={item._id} className="flex items-start gap-2.5 pb-2.5 border-b border-gray-100 last:border-0">
            <input
              type="checkbox"
              className="mt-1 accent-[#d72828] cursor-pointer w-4 h-4"
              checked={selectedFrequentProducts.some(p => p._id === item._id)}
              onChange={() => toggleFrequentProduct(item)}
            />
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {item.images?.[0] && (
                <img
                  src={item.images[0].startsWith('http') ? item.images[0] : `/uploads/products/${item.images[0]}`}
                  alt={item.name}
                  className="w-12 h-12 object-contain flex-shrink-0 rounded border border-gray-200"
                />
              )}
              <div className="text-xs flex-1 min-w-0">
                <Link href={`/product/${item.slug}`} className="block hover:underline">
                  <h4 className="font-medium text-gray-800 line-clamp-2 text-[11px] leading-snug">{item.name}</h4>
                </Link>
                <div className="flex flex-col mt-1">
                  {item?.special_price > 0 && item?.special_price < item?.price && (
                    <span className="text-[10px] text-gray-400 line-through">
                      ₹ {Number(item?.price).toLocaleString('en-IN')}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-gray-500 font-medium">Buy Together for</span>
                    <span className="font-bold text-[#d72828]">
                      ₹ {Number(item?.special_price > 0 ? item.special_price : item?.price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Similar Products */}
  {relatedProducts.filter(item => item.quantity > 0 && item.status === "Active").length > 0 && (
    <div className="mt-4 border border-gray-300 rounded-lg bg-white">
      <div className="px-4 py-4">
        <h2 className="text-sm font-bold text-[#d72828] underline mb-2">Similar Products</h2>
        {relatedProducts.filter(item => item.quantity > 0 && item.status === "Active").slice(0, 3).map((item) => (
          <div key={item._id} className="flex items-start mb-4">
            <input type="checkbox" className="mt-2 mr-3"
              checked={selectedRelatedProducts.some(p => p._id === item._id)}
              onChange={() => toggleRelatedProduct(item)} />
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {item.images?.[0] && (
                <img src={'/uploads/products/' + item.images[0]} alt={item.name} className="w-14 h-14 object-contain" />
              )}
              <div className="text-sm flex-1 min-w-0">
                <Link href={`/product/${item.slug}`} className="block mb-1">
                  <h3 className="text-xs font-medium hover:text-[#d72828] line-clamp-2">{item.name}</h3>
                </Link>
                <span className="text-sm font-semibold text-red-600">
                  ₹ {(item.special_price && item.special_price > 0 && item.special_price < item.price ? item.special_price : item.price).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* 8. Add Selected to Cart */}
  {(selectedRelatedProducts.length > 0 || selectedFrequentProducts.length > 0) && (
    <div className="mt-4 sticky bottom-0 bg-white border-t border-gray-200 pt-3 pb-3 z-10">
      {(selectedRelatedProducts.length > 0 || selectedFrequentProducts.length > 0) && (
        <div className="w-full bg-[#d72828] text-white font-semibold py-2 rounded-md flex items-center justify-between px-4 mb-2">
          <div className="flex items-center gap-2">
            <FaCartPlus className="text-white w-5 h-5" />
            <span className="text-sm font-semibold">Cart Total</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold">₹{cartTotal.toLocaleString('en-IN')}</span>
            <Link href="/cart" className="text-[11px] text-white hover:underline">View Cart</Link>
          </div>
        </div>
      )}
      <ProductAddtoCart
        productId={product._id}
        stockQuantity={product.quantity}
        quantity={quantity}
        additionalProducts={[...selectedFrequentProducts.map((p) => p._id), ...selectedRelatedProducts.map((p) => p._id)]}
        extendedWarranty={selectedWarrantyAmount}
        selectedFrequentProducts={selectedFrequentProducts}
        selectedRelatedProducts={selectedRelatedProducts}
         warrantyData={selectedWarrantyData}
        buttonLabel="Add Selected to Cart"
        buttonClassName="bg-[#d72828] text-white"
          movement={product.movement}         
          productName={product.name}          
          productSlug={product.slug}  
      />
    </div>
  )}
  
{/* MOBILE VIEW */}
<div className="flex flex-col gap-6 my-8 md:hidden">
  {/* FAQ — Mobile */}
  {faqs.length > 0 && (
    <div>
      <h2 className="text-base font-bold text-[#d72828] mb-3">
        Frequently Asked Questions
      </h2>
      <div className="border border-gray-200 rounded-sm overflow-hidden divide-y divide-gray-200">
        {faqs.map((faq, i) => (
          <FaqItem key={i} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  )}

  {/* Exchange — Mobile */}
  <div className="border border-gray-200 rounded-sm p-4 bg-white">
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-bold text-[#d72828]">Exchange Your Old Appliance</h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        Upgrade to a new product and get the best value for your old one.
      </p>
      <div className="flex items-center gap-3 justify-center my-2">
       <img
  src={
    product.images?.[0]?.startsWith("http")
      ? product.images[0]
      : `/uploads/products/${product.images?.[0]}`
  }
  alt="old product"
  className="w-24 h-32 object-contain opacity-40"
/>
<span className="text-gray-400 text-xl">→</span>
<img
  src={
    product.images?.[0]?.startsWith("http")
      ? product.images[0]
      : `/uploads/products/${product.images?.[0]}`
  }
  alt="new product"
  className="w-24 h-32 object-contain"
/>
      </div>
      <button className="w-fit border border-[#d72828] text-[#d72828] text-sm font-semibold px-4 py-2 rounded hover:bg-red-50 transition">
        Check Exchange Value
      </button>
    </div>
  </div>
</div>
</div>
{/* ===== END MOBILE & TABLET VIEW ===== */}

{/* ===== DESKTOP VIEW (hidden on mobile/tablet) ===== */}
<div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 items-stretch mt-2 w-full relative">

  {/* ==================== COLUMN 1: PRODUCT GALLERY (4 cols / ~33% width) ==================== */}
  <div className="lg:col-span-4 min-w-0 self-stretch">
    <div className="flex flex-col gap-3 sticky top-[118px] z-10">
      {/* Main Image Container with Zoom */}
      <div className="border border-gray-300 rounded-lg p-2 bg-white relative">
        <div
          className="relative aspect-square w-full px-4 flex items-center justify-center cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => openLightbox(0)}
          ref={zoomContainerRef}
        >
          <img
            src={resolveImagePath(mainImage) || "/uploads/sathyalogo.webp"}
            alt={product?.name || "Product"}
            className="w-full h-full object-contain rounded-lg"
            ref={imgRef}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/uploads/sathyalogo.webp"; }}
          />
          {showZoomLens && (
            <div
              className="absolute border-2 border-white bg-white bg-opacity-30 pointer-events-none"
              style={{ width: '150px', height: '150px', left: 0, top: 0, borderRadius: '50%', transform: 'translateZ(0)', zIndex: 10 }}
              ref={zoomLensRef}
            />
          )}
        </div>
        {showZoomLens && (
          <div
            className="absolute hidden md:block left-full ml-4 top-0 bg-no-repeat bg-white border rounded-lg overflow-hidden shadow-2xl"
            style={{
              backgroundImage: `url(${resolveImagePath(product.images[selectedImageIndex])})`,
              backgroundSize: '200%',
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              zIndex: 30, height: '400px', width: '525px'
            }}
            ref={zoomResultRef}
          />
        )}
      </div>

      {/* Thumbnails Strip */}
      {product.images && product.images.filter(img => img && img.trim() !== "").length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {product.images.filter(img => img && img.trim() !== "").map((image, index) => (
            <div key={index} className="flex-shrink-0">
              <img
                src={resolveImagePath(image)}
                alt={`Thumbnail ${index + 1}`}
                className={`w-16 h-16 border rounded-lg cursor-pointer object-cover transition-all duration-200 ${
                  selectedImageIndex === index ? 'border-[#d72828] ring-2 ring-red-500 scale-105' : 'border-gray-300 hover:border-gray-400 opacity-80 hover:opacity-100'
                }`}
                onClick={() => setSelectedImageIndex(index)}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          ))}
        </div>
      )}



      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto" onClick={closeLightbox}>
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md sm:max-w-2xl mx-auto flex flex-col items-center max-h-[80vh] sm:max-h-[70vh] p-3 sm:p-6 mt-[10rem] sm:mt-32" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 z-50" onClick={closeLightbox}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full flex items-center justify-center">
              <img src={resolveImagePath(product.images[selectedImageIndex])} alt={product?.name || "Product"} className="object-contain max-h-[60vh] sm:max-h-[50vh] w-full rounded-md" />
            </div>
            <div className="w-full border-t border-gray-300 my-3"></div>
            {product.images && product.images.filter(img => img && img.trim() !== '' && img.trim().toLowerCase() !== 'null').length > 0 && (
              <div className="flex justify-center flex-wrap gap-2 sm:gap-3">
                {product.images.filter(img => img && img.trim() !== '' && img.trim().toLowerCase() !== 'null').map((image, index) => {
                  const imgPath = image.startsWith('http') || image.startsWith('blob:') || image.startsWith('data:') ? image : `/uploads/products/${image}`;
                  return (
                    <img key={index} src={imgPath} alt={`Thumbnail ${index + 1}`}
                      className={`object-cover w-14 h-14 sm:w-16 sm:h-16 rounded-sm cursor-pointer hover:scale-105 ${selectedImageIndex === index ? 'ring-2 ring-red-500' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                      onError={(e) => e.currentTarget.remove()}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>


  {/* ==================== COLUMN 2: PRODUCT INFORMATION & DETAILS (5 cols / ~42% width, MAIN SCROLLING COLUMN) ==================== */}
  <div className="lg:col-span-5 flex flex-col gap-3 min-w-0 self-stretch">
    {/* 1. BREADCRUMBS AT TOP OF COLUMN 2 */}
    <ProductBreadcrumb product={product} className="mb-1 text-xs w-full overflow-hidden" />

    {/* Brand Link */}
    {brand.find((b) => b.value === product.brand)?.label && (
      <p className="text-[#d72828] font-bold text-xs uppercase tracking-wider">
        From {brand.find((b) => b.value === product.brand)?.label} Store
      </p>
    )}

    {/* Title */}
    <h1 className="text-xl font-bold text-gray-900 leading-snug">{product.name}</h1>

    {/* Stock Status & Product Code / SKU */}
    <div className="flex items-center gap-2 text-xs flex-wrap">
      {product.stock_status === "In Stock" && product.quantity > 0 ? (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
          ✓ In Stock ({product.quantity} units)
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold">
          ✗ Out of Stock
        </span>
      )}
      {(product.item_code || product.model_number) && (
        <span className="text-gray-500 font-medium">
          {product.item_code ? `(Product Code: ${product.item_code})` : ''} {product.model_number ? `| Model: ${product.model_number}` : ''}
        </span>
      )}
    </div>

    {/* Rating & Reviews */}
    {avgRating > 0 && (
      <div className="flex items-center gap-2 text-xs">
        <span className="bg-green-600 text-white font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
          {avgRating} ★
        </span>
        <span className="text-gray-500 font-medium">({reviewCount} Verified Ratings & Reviews)</span>
      </div>
    )}

    {/* Price & Offer Block */}
    <div className="border-t border-b border-gray-200 py-3 my-1">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-black text-[#d72828]">
          ₹ {Number(product.special_price > 0 ? product.special_price : product.price).toLocaleString('en-IN')}
        </span>
        {product.special_price > 0 && product.price > product.special_price && (
          <>
            <span className="text-sm text-gray-400 line-through font-medium">
              M.R.P: ₹ {Number(product.price).toLocaleString('en-IN')}
            </span>
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              {Math.round(((product.price - product.special_price) / product.price) * 100)}% OFF
            </span>
          </>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mt-0.5">Inclusive of all taxes</p>

      {/* Effective Price Cards (Online / Store) */}
      {product.special_price > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="border border-green-500 rounded-lg p-2 bg-green-50/50 text-left">
            <span className="text-xs font-bold text-gray-900 block">
              ₹ {Number(product.special_price).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-gray-600 font-medium">Effective Price @ Online</span>
          </div>
          <div className="border border-green-500 rounded-lg p-2 bg-green-50/50 text-left">
            <span className="text-xs font-bold text-gray-900 block">
              ₹ {Number(product.special_price).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-gray-600 font-medium">Effective Price @ Store</span>
          </div>
        </div>
      )}

      {/* EMI Info Banner */}
      <div className="mt-3 text-xs text-gray-700 flex items-center justify-between bg-gray-50 p-2.5 rounded-md border border-gray-200">
        <span>Standard EMI starts from <strong className="text-[#d72828]">₹ 535/month</strong> for HDFC Bank Cards</span>
        <button onClick={() => setShowEMIModal(true)} className="text-xs font-bold text-[#d72828] hover:underline">
          View Plans
        </button>
      </div>
    </div>

    {/* Available Offers Component */}
    <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
      <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 mb-2">
        <span className="text-[#d72828] font-black">%</span> Available Offers
      </h3>
      <RazorpayOffers amount={Number(product.special_price) || Number(product.price)} />
    </div>

    {/* Delivery Options & Pincode Checker */}
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-800">Delivery Options:</span>
        <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1">
          <TbTruckDelivery className="text-[#d72828] w-4 h-4" />
          <input
            type="text"
            placeholder="Enter Pincode"
            maxLength={6}
            className="w-24 text-xs focus:outline-none"
          />
          <button className="text-xs font-bold text-[#d72828] hover:underline ml-1">Check</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-white border border-gray-200 rounded-md p-2 text-center">
          <span className="text-xs font-bold text-gray-800 block">REGULAR DELIVERY</span>
          <span className="text-[10px] text-green-600 font-medium">Delivery in 2 - 4 Days</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-2 text-center">
          <span className="text-xs font-bold text-gray-800 block">STORE PICKUP</span>
          <span className="text-[10px] text-green-600 font-medium">Reserve & Collect at Store</span>
        </div>
      </div>
    </div>

    {/* GST Invoice & Genuine Badges */}
    <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
      <div className="border border-gray-200 rounded p-2 flex items-center gap-2 bg-white">
        <IoCardOutline className="text-[#d72828] w-4 h-4 flex-shrink-0" />
        <span className="font-medium">GST Invoice Available</span>
      </div>
      <div className="border border-gray-200 rounded p-2 flex items-center gap-2 bg-white">
        <IoShieldCheckmark className="text-green-600 w-4 h-4 flex-shrink-0" />
        <span className="font-medium">100% Genuine Product</span>
      </div>
    </div>

    {/* Key Specifications List */}
    {Array.isArray(product.key_specifications) && product.key_specifications.length > 0 && (
      <div className="mt-2 border-t border-gray-200 pt-3">
        <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Key Specifications</h4>
        <ul className="space-y-1.5 text-xs text-gray-700">
          {product.key_specifications.map((spec, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span>{spec}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

  </div>


  {/* ==================== COLUMN 3: FREQUENTLY BOUGHT TOGETHER & CTAS (3 cols / ~25% width) ==================== */}
  <div className="lg:col-span-3 min-w-0 self-stretch">
    <div className="flex flex-col gap-4">

    {/* 1. FREQUENTLY BOUGHT TOGETHER (EXACTLY 2 PRODUCTS, BACKEND CONTROLLED) */}
    {featuredProducts && featuredProducts.filter(item => item.stock_status === "In Stock").length > 0 && (
      <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-3">
        <h3 className="font-bold text-xs text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase tracking-wide">
          Frequently Bought Together:
        </h3>
        <div className="space-y-3">
          {featuredProducts.slice(0, 2).map((item) => (
            <div key={item._id} className="flex items-start gap-2.5 pb-2.5 border-b border-gray-100 last:border-0">
              <input
                type="checkbox"
                className="mt-1 accent-[#d72828] cursor-pointer w-4 h-4"
                checked={selectedFrequentProducts.some(p => p._id === item._id)}
                onChange={() => toggleFrequentProduct(item)}
              />
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {item.images?.[0] && (
                  <img
                    src={item.images[0].startsWith('http') ? item.images[0] : `/uploads/products/${item.images[0]}`}
                    alt={item.name}
                    className="w-12 h-12 object-contain flex-shrink-0 rounded border border-gray-200"
                  />
                )}
                <div className="text-xs flex-1 min-w-0">
                  <Link href={`/product/${item.slug}`} className="block hover:underline">
                    <h4 className="font-medium text-gray-800 line-clamp-2 text-[11px] leading-snug">{item.name}</h4>
                  </Link>
                  <div className="flex flex-col mt-1">
                    {item?.special_price > 0 && item?.special_price < item?.price && (
                      <span className="text-[10px] text-gray-400 line-through">
                        ₹ {Number(item?.price).toLocaleString('en-IN')}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-gray-500 font-medium">Buy Together for</span>
                      <span className="font-bold text-[#d72828]">
                        ₹ {Number(item?.special_price > 0 ? item.special_price : item?.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* 2. PROTECTION / EXTENDED WARRANTY (MIDDLE OF COLUMN 3) */}
    {warranties.length > 0 && (
      <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-3">
        <div className="flex items-center gap-1.5 mb-2 border-b border-gray-200 pb-2">
          <FaShield className="text-[#d72828] w-4 h-4" />
          <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide">
            Want to protect your product?
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between p-1.5 rounded cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="warranty_desktop_col3"
                checked={selectedWarrantyData === null}
                onChange={() => {
                  setSelectedWarrantyData(null);
                  setSelectedWarrantyAmount(0);
                }}
                className="accent-[#d72828]"
              />
              <span className="text-gray-700">No Protection Plan</span>
            </div>
          </label>

          {warranties
            .sort((a, b) => a.year - b.year)
            .map((w) => (
              <label
                key={w.item_no}
                className="flex items-center justify-between p-1.5 border-t border-gray-100 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="warranty_desktop_col3"
                    checked={selectedWarrantyData?.item_no === w.item_no}
                    onChange={() => {
                      setSelectedWarrantyData(w);
                      setSelectedWarrantyAmount(w.price);
                    }}
                    className="accent-[#d72828]"
                  />
                  <span className="text-gray-800 font-medium">{w.year} Year Warranty</span>
                </div>
                <span className="font-bold text-gray-900">₹ {w.price.toLocaleString("en-IN")}</span>
              </label>
            ))}
        </div>
      </div>
    )}

    {/* 3. PRIMARY ACTION BUTTONS: BUY NOW & ADD TO CART (INSIDE COLUMN 3) */}
    {product.stock_status === "In Stock" && product.quantity > 0 && (
      <div className="flex flex-col gap-2 bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
        {/* Quantity selector */}
        <div className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 rounded p-2 mb-1">
          <span className="font-medium text-gray-700">Quantity:</span>
          <div className="flex items-center border border-gray-300 bg-white rounded px-2 py-0.5 gap-3">
            <button onClick={handleDecrease} className="text-gray-600 font-bold text-sm hover:text-[#d72828]">−</button>
            <span className="text-xs font-bold w-4 text-center">{quantity}</span>
            <button onClick={handleIncrease} className="text-gray-600 font-bold text-sm hover:text-[#d72828]">+</button>
          </div>
        </div>

        {/* BUY NOW Button (Primary Sathya Red) */}
        <button
          onClick={handleBuyNow}
          disabled={(product.movement === "EOL" || product.movement === "FOCUS") && product.quantity <= 10}
          className={`w-full font-extrabold py-3 rounded-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-md transition-all
            ${(product.movement === "EOL" || product.movement === "FOCUS") && product.quantity <= 10
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#d72828] hover:bg-red-700 text-white cursor-pointer active:scale-95"
            }`}
        >
          <FaStore className="w-4 h-4 flex-shrink-0" />
          Buy Now
        </button>

        {/* ADD TO CART Button */}
        <ProductAddtoCart
          productId={product._id}
          stockQuantity={product.quantity}
          quantity={quantity}
          additionalProducts={[...selectedFrequentProducts.map((p) => p._id), ...selectedRelatedProducts.map((p) => p._id)]}
          extendedWarranty={selectedWarrantyAmount}
          selectedFrequentProducts={selectedFrequentProducts}
          selectedRelatedProducts={selectedRelatedProducts}
          warrantyData={selectedWarrantyData}
          buttonLabel="Add To Cart"
          buttonClassName="w-full border-2 border-[#d72828] text-[#d72828] hover:bg-red-50 font-bold py-2.5 rounded-lg text-sm transition-all shadow-none"
          movement={product.movement}
          productName={product.name}
          productSlug={product.slug}
        />
      </div>
    )}

    {/* 4. BOTTOM ACTIONS BAR: Share | Compare | Wishlist */}
    <div className="flex items-center justify-between border-t border-b border-gray-200 py-2.5 px-2 text-xs font-semibold text-gray-700 bg-gray-50 rounded-md">
      <button onClick={handleShareProduct} className="flex items-center gap-1 hover:text-[#d72828] transition">
        <FaShareAlt className="text-gray-500 w-3.5 h-3.5" />
        <span>Share</span>
      </button>
      <span className="text-gray-300">|</span>
      <button onClick={() => alert("Compare feature coming soon")} className="flex items-center gap-1 hover:text-[#d72828] transition">
        <IoReload className="text-gray-500 w-3.5 h-3.5" />
        <span>Compare</span>
      </button>
      <span className="text-gray-300">|</span>
      <AddToWishlistButton
        productId={product._id}
        label="Wishlist"
        iconSize={14}
        className="flex items-center gap-1 hover:text-[#d72828] transition bg-transparent p-0 border-0 shadow-none text-xs text-gray-700 font-semibold"
      />
    </div>

    </div>
  </div>

</div>
{/* END DESKTOP VIEW GRID */}

{/* DESKTOP FULL-WIDTH PRODUCT DETAILS & SPECIFICATIONS SECTION */}
<div className="hidden lg:block w-full mt-8">
  <ProductDetailsSection
    product={product}
    reviews={reviews}
    avgRating={avgRating}
    reviewCount={reviewCount}
    manufacturerName={matchedBrandForManufacturer?.manufacturer_name}
    manufacturerAddress={matchedBrandForManufacturer?.manufacturer_address}
  />
</div>

{/* DESKTOP ONLY — FAQ + EXCHANGE */}
<div className="hidden md:flex gap-8 my-10 items-start">

  {/* LEFT — FAQ (50%) */}
  <div className="w-1/2">
    <h2 className="text-base font-bold text-[#d72828] mb-3">
      Frequently Asked Questions
    </h2>

    {faqs.length > 0 ? (
      <div className="border border-gray-200 rounded-sm overflow-hidden">
        {faqs.map((faq, i) => (
          <FaqItem key={i} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    ) : (
      <div className="border border-gray-200 rounded-sm p-6 text-center text-sm text-gray-400">
        No questions available
      </div>
    )}
  </div>

{/* EXCHANGE BOX */}
<div className="w-1/2 border border-gray-200 rounded-sm p-5 bg-white">
  <div className="flex items-center justify-between h-full gap-4">
    
    {/* LEFT — Title, text, button */}
    <div className="flex flex-col gap-3 flex-1">
      <h3 className="text-base font-bold text-[#d72828]">
        Exchange Your Old Appliance
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        Upgrade to a new {ProductBreadcrumb?.[2]?.name || "product"} and get the best value for your old one.
      </p>
      <button className="w-fit border border-[#d72828] text-[#d72828] text-sm font-semibold px-4 py-2 rounded hover:bg-red-50 transition">
        Check Exchange Value
      </button>
    </div>

    {/* RIGHT — Two images + arrow */}
    <div className="flex items-center gap-3 flex-shrink-0">
     <img
  src={
    product.images?.[0]?.startsWith("http")
      ? product.images[0]
      : `/uploads/products/${product.images?.[0]}`
  }
  alt="old product"
  className="w-28 h-36 object-contain opacity-40"
/>
<span className="text-gray-400 text-xl">→</span>
<img
  src={
    product.images?.[0]?.startsWith("http")
      ? product.images[0]
      : `/uploads/products/${product.images?.[0]}`
  }
  alt="new product"
  className="w-28 h-36 object-contain"
/>
    </div>

  </div>
</div>
</div>


        <RelatedProducts relatedProducts={product.related_products} />
        <RecentlyViewedProducts products={recentlyViewedProducts} />
      </div>
    </div>
  );
}


