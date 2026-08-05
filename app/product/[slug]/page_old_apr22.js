'use client';
import ProductDetailsSection from "@/components/ProductDetailsSection";
import RelatedProducts from "@/components/RelatedProducts";
import {  useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { FaShoppingCart, FaHeart, FaShareAlt, FaBell } from "react-icons/fa";
import { TbTruckDelivery } from "react-icons/tb";
import { IoFastFoodOutline, IoReload, IoCardOutline, IoShieldCheckmark, IoStorefront } from "react-icons/io5";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";
export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0, visible: false });
  const imgRef = useRef(null);
  const zoomContainerRef = useRef(null);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [showWarrantyModal, setshowWarrantyModal] = useState(false);
  const [showGstInvoiceModal, setshowGstInvoiceModal] = useState(false);
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/product/${slug}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
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
  

  const handleThumbnailClick = (imageIndex) => {
    setSelectedImage(`/uploads/products/${product.images[imageIndex]}`);
  };

  const handleMouseMove = (e) => {
    if (!imgRef.current || !zoomContainerRef.current) return;
  
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
  
    setZoomPosition({ x, y, visible: true });
  };
  
  const handleMouseLeave = () => {
    setZoomPosition((prev) => ({ ...prev, visible: false }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">{error}</h2>
          <Link href="/" className="mt-4 inline-flex items-center text-blue-600">
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
          <Link href="/" className="mt-4 inline-flex items-center text-blue-600">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      {/* 🟠 Wishlist Header Bar */}
      <div className="bg-blue-50 py-6 px-8 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Shop Details</h2>
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-gray-600 hover:text-blue-600">🏠 Home</Link>
          <span className="text-gray-500">›</span>
          <span className="text-blue-600 font-semibold">Shop Details</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Section - Product Image with Zoom */}
          <div className="md:col-span-1 relative">
            <div className="sticky top-20">
              <div 
                className="relative border border-gray-400 rounded-lg p-4 overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* Main Image */}
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full rounded-lg object-cover"
                  ref={imgRef}
                //   onError={(e) => {
                //     e.target.onerror = null;
                //     e.target.src = "none";
                //   }}
                />

                {/* Zoom Box */}
                {zoomPosition.visible && (
                  <div
                    className="absolute left-full top-0 ml-4 w-[250px] h-[250px] border border-gray-300 bg-white shadow-lg overflow-hidden"
                    ref={zoomContainerRef}
                  >
                    <img
                      src={selectedImage}
                      alt="Zoomed"
                      className="absolute w-[400%] h-[400%] object-cover"
                      style={{
                        left: `-${zoomPosition.x * 3}%`,
                        top: `-${zoomPosition.y * 3}%`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 mt-3">
                {product.images?.map((image, index) => (
                  <img
                    key={index}
                    src={`/uploads/products/${image}`}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-16 h-16 border border-gray-400 rounded-lg cursor-pointer hover:scale-110 transition-transform duration-300"
                    onClick={() => handleThumbnailClick(index)}
                    // onError={(e) => {
                    //   e.target.onerror = null;
                    //   e.target.src = "none";
                    // }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Middle Section */}
          <div className="md:col-span-2">
            <h1 className="text-1xl font-semibold">{product.name}</h1>
            <div className="mt-2 pb-3 border-b border-gray-400">
              <div className="flex items-center space-x-2 text-yellow-500 text-sm">
                ⭐⭐⭐⭐⭐ <span className="text-gray-500 text-xs">{product.stock_status} | {product.reviews || 0} Reviews</span>
              </div>
            </div>
            {/* <p className="text-gray-700 text-sm mt-3 font-medium">
              {product.sku || "N/A"}
            </p> */}
            <p className="text-gray-700 text-sm mt-3 font-medium">
              {product.description ? 
                product.description.split(' ').slice(0, 50).join(' ') + (product.description.split(' ').length > 50 ? '...' : '') 
                : "N/A"
              }
            </p>

            <div className="flex items-center mt-2 pb-3 border-b border-gray-400">
              <div className="flex items-center space-x-3">
                <span className="text-2-5xl font-bold text-gray-900">Rs.{product.special_price || product.price}</span>
                {product.special_price && (
                  <span className="text-gray-500 line-through text-xl">Rs.{product.price}</span>
                )}
              </div>
              {/* <button className="ml-6 bg-customBlue text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 text-lg">
                Order on WhatsApp
              </button> */}
            <button 
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check this out: ${product.slug}`)}`, '_blank')} 
              className="ml-6 bg-customBlue text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 text-sm flex items-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
              </svg><span>Order on WhatsApp</span>
            </button>



            </div>

            {/* Color Variant Section */}
            {/* <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Colour Variant:</h3>
              <div className="flex gap-[10px] mt-1">
              {product.variants && product.variants.length > 0 ? (
                  product.variants.slice(0, 3).map((variant, index) => (
                    <div key={index} className="w-[80px] h-[80px] flex items-center justify-center">
                      <img 
                        src={variant.image} 
                        alt={`Variant ${index + 1}`} 
                        className="w-full h-full object-cover border border-gray-300 rounded-md"
                        
                      />
                    </div>
                  ))
                ) : (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="w-[80px] h-[80px] bg-gray-200 rounded-md" />
                  ))
                )}
              </div>
            </div> */}

            {product.variants && product.variants.length > 0 && (
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Colour Variant:</h3>
                <div className="flex gap-[10px] mt-1">
                  {product.variants.slice(0, 3).map((variant, index) => (
                    <div key={index} className="w-[80px] h-[80px] flex items-center justify-center">
                      <img 
                        src={variant.image} 
                        alt={`Variant ${index + 1}`} 
                        className="w-full h-full object-cover border border-gray-300 rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Stock Alert */}
            <div className="mt-4">
              {/* <p className="font-semibold">⚠ Products are almost sold out</p> */}

              {product.quantity < 5 ? (
                <p className="font-semibold text-red-600">⚠ Products are almost sold out</p>
              ) : (
                <p className="font-semibold text-green-600">✅ In stock. Order anytime.</p>
              )}



              <div className="h-2 bg-gray-300 rounded-full mt-1">
                <div 
                  className="h-2 bg-orange-500 rounded-full" 
                  style={{ width: `${Math.min(100, (product.stock / 10) * 100)}%` }}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-1">Available only: <span className="font-bold">{product.quantity}</span></p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="mt-3 flex items-end w-full">
              <div className="flex flex-col">
                <p className="text-gray-700 text-sm font-semibold mb-2">Quantity</p>
                <div className="flex items-center border border-gray-300 rounded-full w-26 h-10">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="px-3 py-2 border-r hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-2">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="px-3 py-2 border-l hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
              <Addtocart productId={product._id} />
              <div className="flex-grow"></div>
              <div className="flex items-center space-x-3">
                <button className="w-10 h-10 flex items-center justify-center rounded-full transition duration-300 ease-in-out bg-gray-200 hover:bg-blue-600 text-blue-600 hover:text-white">
                  <FaHeart />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full transition duration-300 ease-in-out bg-gray-200 hover:bg-blue-600 text-blue-600 hover:text-white">
                  <FaShareAlt />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full transition duration-300 ease-in-out bg-gray-200 hover:bg-blue-600 text-blue-600 hover:text-white">
                  <FaBell />
                </button>
              </div>
            </div>

            <div className="border-b border-gray-400 mt-4"></div>

            {/* Coupons */}
            {/* <div className="mt-4">
              <div className="flex items-center justify-between border border-blue-400 rounded-md p-2 mb-3">
                <div className="flex items-center gap-1">
                  //  <span className="text-gray-600 text-sm">➕</span> 
                  <span className="inline-flex items-center justify-center w-4 h-4 text-white bg-gray-600 rounded-full text-lg">+</span>

                  <span className="text-gray-700 text-xs">Mfr. coupon. $3.00 off 5</span>
                </div>
                <button className="text-blue-500 text-xs font-semibold hover:underline">
                  View Details
                </button>
              </div>
              <div className="mt-1 text-gray-900 text-xs font-medium">
                <p>Buy 1, Get 1 FREE</p>
                <p>Buy 1, Get 1 FREE</p>
              </div>
            </div> */}

<div className="mt-4">
      {/* Horizontal 3 Boxes Section */}
      <div className="mt-3 flex justify-between gap-2">
        {/* Replacement Box */}
        <div
          className="flex items-start bg-blue-50 border border-blue-200 rounded-md p-4 w-1/3 shadow-sm cursor-pointer"
          onClick={() => setShowReplacementModal(true)}
        >
          <span className="text-blue-500 text-xl mr-3 mt-1">🔁</span>
          <div>
            <div className="text-sm font-semibold text-blue-800">Replacement</div>
            <div className="text-xs text-blue-600">in 7 days</div>
          </div>
        </div>

        {/* Warranty Box */}
        <div className="flex items-start bg-blue-50 border border-blue-200 rounded-md p-4 w-1/3 shadow-sm cursor-pointer"
          onClick={() => setshowWarrantyModal(true)}>
          <span className="text-green-500 text-xl mr-3 mt-1">🛡️</span>
          <div>
            <div className="text-sm font-semibold text-blue-800">Warranty</div>
            <div className="text-xs text-blue-600">in 1 Year</div>
          </div>
        </div>

        {/* GST Invoice Box */}
        <div className="flex items-start bg-blue-50 border border-blue-200 rounded-md p-4 w-1/3 shadow-sm cursor-pointer"
          onClick={() => setshowGstInvoiceModal(true)}>
          <span className="text-yellow-500 text-xl mr-3 mt-1">📄</span>
          <div>
            <div className="text-sm font-semibold text-blue-800">GST Invoice</div>
            <div className="text-xs text-blue-600">Available</div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showReplacementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-semibold text-blue-800">Replacement</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setShowReplacementModal(false)}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="mt-4 text-sm text-gray-700 space-y-2 max-h-[60vh] scrollbar-hide overflow-y-auto">
              <p>Please go through the mentioned Replacement policy before placing an order.</p>
              <p>
                Should you receive an item with physical damages, please note that you should
                contact us within 48 hours, (In the case of Brands like Apple, 24 hours), without
                using the product and without breaching Poorvika's Online Replacement Policy. If
                you fail to follow these, the replacement claim will become void.
              </p>
              <p>
                Products you purchased from Poorvika Online are only eligible for Replacement, under
                the following conditions during delivery:
              </p>
              <ul className="list-disc pl-6">
                <li>Physical Damage to the Product</li>
                <li>Defective Product</li>
                <li>Wrong product received</li>
                <li>Broken Seal</li>
              </ul>
              <p className="font-semibold">Replacement of Mobile Phone:</p>
              <p>
                In case you receive an item that is not in perfect condition, please contact us
                immediately. Important - DO NOT INSERT THE SIM and DO NOT CONNECT TO WIFI (Adhering
                to Poorvika's Online Replacement Policy).
              </p>
              <p className="font-semibold">Void Claim:</p>
              <p>
                Please note that if you do not abide by Poorvika Online's Replacement Policy and/or
                on ignoring your duties as stated above, you agree that your claim for replacement
                will become a VOID CLAIM.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end border-t pt-3">
              <a
                href="/cancellation-refund-policy"
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Know More
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showWarrantyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-semibold text-blue-800">Warranty</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setshowWarrantyModal(false)}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="mt-4 text-sm text-gray-700 space-y-2 max-h-[60vh] scrollbar-hide overflow-y-auto">
              <p>1 Year manufacturer warranty for device and 6 months manufacturer warranty for in-box accessories.</p>
            </div>



            {/* Modal Footer */}
            <div className="mt-6 flex justify-end border-t pt-3">
              <a
                href="/privacypolicy"
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Know More
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showGstInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-semibold text-blue-800">GST Invoice</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setshowGstInvoiceModal(false)}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="mt-4 text-sm text-gray-700 space-y-2 max-h-[60vh] scrollbar-hide overflow-y-auto">
              <p>Click here to know more about our T & C</p>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end border-t pt-3">
              <a
                href="/shipping"
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Know More
              </a>
            </div>
          </div>
        </div>
      )}



    </div>







          </div>

          {/* Right Section - Seller Info */}
          <div className="md:col-span-1 border border-gray-300 rounded-lg shadow-md bg-white mb-14 w-full max-w-sm max-h-[490px] overflow-y-scroll scrollbar-hide">
            <div className="px-4 py-4">
              <h3 className="font-semibold text-sm text-gray-800 underline mb-4">Frequently Bought Together:</h3>

              {/* Product 1 */}
              <div className="flex items-start mb-4">
                <input type="checkbox" className="mt-2 mr-3" />
                <div className="flex items-start gap-3">
                  <img src="../uploads/products/1741764239334-aa.jpg" alt="Mixie" className="w-16 h-16 object-contain" />
                  <div className="text-sm">
                    <div className="text-gray-800 font-medium">Apple AirPods Pro 2</div>
                    <div className="text-gray-500">White</div>
                    <div className="text-orange-600 font-medium">Buy Together for</div>
                    <div className="text-gray-800 font-semibold">₹ 24,900</div>
                  </div>
                </div>
              </div>

            
            </div>

            {/* Protection Plan */}
            <div className="border-t border-gray-300 px-4 py-4">
              <h4 className="text-sm font-semibold text-orange-600 mb-2">Want to protect your product?</h4>
              <p className="text-sm font-bold text-gray-800 underline mb-2">Accidental and Liquid Damage Protection Plan</p>

              <div className="text-sm text-gray-800 space-y-2 mb-4">
                <div className="flex items-center">
                  <input type="radio" name="protection" className="mr-2" />
                  <label>1 Year Accidental And Liquid Damage <span className="text-green-600 font-bold ml-2">₹  {product.warranty}</span></label>
                </div>
                
              </div>

              <p className="text-sm font-bold text-gray-800 underline mb-2">Extended Warranty</p>
              <div className="text-sm text-gray-800">
                <div className="flex items-center">
                  <input type="radio" name="warranty" className="mr-2" />
                  <label>1 Year Extended Warranty Protection <span className="text-green-600 font-bold ml-2">₹ {product.extended_warranty} </span></label>
                </div>
              </div>
            </div>
            {/* <div className="mt-4 px-4">
              <div className="flex items-center justify-between bg-customBlue text-white px-3 py-2 rounded-full">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1.5 rounded-full flex items-center justify-center w-8 h-8">
                    <IoStorefront className="text-blue-600 text-lg" />
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">By {product.brand || "Marketpro"}</span>
                </div>
                <div className="flex-shrink-0">
                  <button className="bg-white text-blue-600 text-xs font-medium px-3 py-1 rounded-full border border-white whitespace-nowrap">
                    View Store
                  </button>
                </div>
              </div>
            </div> */}

            <div className="mt-4 px-4">
              <div className="flex items-center justify-between bg-customBlue text-white px-3 py-2 rounded-full">
                
                {/* Left - Icon + Text */}
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1.5 rounded-full flex items-center justify-center w-8 h-8">
                    <IoStorefront className="text-blue-600 text-lg" />
                  </div>
                  <div className="text-sm font-medium leading-tight">
                    <div>By</div>
                    <div className="truncate max-w-[100px]">
                      {product.brand || "Estore"}
                    </div>
                  </div>
                </div>

                {/* Right - Button */}
                <button className="bg-white text-blue-600 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                  View Store
                </button>

              </div>
            </div>

            <div className="border-b border-gray-300 w-full mt-4"></div>

            <div className="rounded-b-lg w-full bg-gray-100">
              {[
                { icon: TbTruckDelivery, title: "Fast Delivery", desc: "Lightning-fast shipping, guaranteed." },
                { icon: IoReload, title: "Free 90-day returns", desc: "Shop risk-free with easy returns." },
                { icon: IoStorefront, title: "Pickup available", desc: "Usually ready in 24 hours" },
                { icon: IoCardOutline, title: "Payment", desc: "Secure online and cash payments." },
                { icon: IoShieldCheckmark, title: "Warranty", desc: product.warranty || "Guaranteed product quality." },
              ].map(({ icon: Icon, title, desc }, index) => (
                <div key={index}>
                  {index !== 0 && <div className="border-b border-gray-400 w-full mt-1"></div>}
                  <div className="flex items-center gap-4 px-6 py-4 w-full">
                    <div className="bg-white p-3 rounded-full border border-gray-300 shadow-sm flex items-center justify-center">
                      <Icon className="text-lg text-blue-600" />
                    </div>
                    <div className="flex-1 w-full min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 break-words">{title}</h4>  
                      <p className="text-sm text-gray-700 break-words">{desc}</p>  
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ProductDetailsSection product={product} />
            <RelatedProducts 
              currentProductId={product._id} 
              categoryId={product.category?._id || product.category} 
            />
      </div>
    </div>
  );
}