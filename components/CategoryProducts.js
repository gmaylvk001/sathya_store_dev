"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Slider from "react-slick";
import Addtocart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaShareAlt } from "react-icons/fa";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/slick-custom.css";
import 'swiper/css';
import 'swiper/css/navigation';
import "swiper/css/pagination";
const CategoryProducts = () => {
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [brandMap, setBrandMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const categoryScrollRefs = useRef({});
  // id → category doc  (to resolve a category's parent slug)
  const [idToCategory, setIdToCategory] = useState({});
  // parentId → active child categories[]
  const [childrenByParentId, setChildrenByParentId] = useState({});

  const priorityCategories = ["air-conditioner", "mobile-phones", "television", "refrigerator", "washing-machine"];
    /* const getSanitizedImage = (img) => {
      if (!img || img.trim() === "") return null;

      // If multiple images separated by commas, pick the last one
      const parts = img.split(",");
      const lastImg = parts[parts.length - 1].trim();

      // Replace spaces with underscores
      return lastImg.replace(/\s+/g, "_");
    }; */
    const getSanitizedImage = (img) => {
  if (!img) return null;

  // Case 1: If array → sanitize all & return last image
  if (Array.isArray(img)) {
    if (img.length === 0) return null;

    return img
      .map(i => i?.toString().trim().replace(/\s+/g, "_"))
      .filter(Boolean)   // remove null/undefined
      .pop();             // last image
  }

  // Case 2: If comma separated string
  if (typeof img === "string") {
    if (img.trim() === "") return null;

    const parts = img.split(",");
    const lastImg = parts[parts.length - 1].trim();
    return lastImg.replace(/\s+/g, "_");
  }

  return null;
};

const getBannerImages = (bannerImage) => {
  if (!bannerImage) return [];

  if (Array.isArray(bannerImage)) {
    return bannerImage.filter(Boolean);
  }

  if (typeof bannerImage === "string") {
    return bannerImage.split(",").map(img => img.trim()).filter(Boolean);
  }

  return [];
};

const getBannerRedirectUrls = (urls) => {
  if (!urls) return [];

  if (Array.isArray(urls)) {
    return urls.filter(Boolean);
  }

  if (typeof urls === "string") {
    return urls.split(",").map(u => u.trim()).filter(Boolean);
  }

  return [];
};
  
    const categoryStyles = {
      "air-conditioner": {
        backgroundImage: "/uploads/categories/category-darling-img/air-conditoner-one.jpg",
        borderColor: "#060F16",
      },
      "mobile-phones": {
        backgroundImage: "/uploads/categories/category-darling-img/smartphone.png",
        borderColor: "#68778B",
      },
      "television": {
        backgroundImage: "/uploads/categories/category-darling-img/television-one.jpg",
        borderColor: "#A9A097",
      },
      "refrigerator": {
        backgroundImage: "/uploads/categories/category-darling-img/refirgrator-two.jpg",
        borderColor: "#5C8B99",
      },
      "washing-machine": {
        backgroundImage: "/uploads/categories/category-darling-img/washine-machine-one.jpg",
        borderColor: "#69AEA2",
      },
      "dishwasher": {
        backgroundImage: "/uploads/categories/category-darling-img/washine-machine-one.jpg",
        borderColor: "#69AEA2",
      },
    };


  const scrollLeft = (categoryId) => {
    if (categoryScrollRefs.current[categoryId]) {
      categoryScrollRefs.current[categoryId].scrollBy({ left: -250, behavior: 'smooth' });
    }
  };

  const scrollRight = (categoryId) => {
    if (categoryScrollRefs.current[categoryId]) {
      categoryScrollRefs.current[categoryId].scrollBy({ left: 250, behavior: 'smooth' });
    }
  };

  const handleProductClick = (product) => {
    setNavigating(true);
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const updated = [product, ...recentlyViewed.filter(p => p._id !== product._id)].slice(0, 10);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
  };

  const BanneritemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };
  const handleShare = async (product) => {
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          url: productUrl,
        });
      } else {
        await navigator.clipboard.writeText(productUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/categoryproduct/settings");
        const result = await response.json();
        if (result.ok) setCategoryProducts(result.data);
        /* if (result.ok) {
          // Sort so priorityCategories appear first in declared order; others follow
          const sorted = [...(result.data || [])].sort((a, b) => {
            const slugA = a.subcategoryId?.category_slug || "";
            const slugB = b.subcategoryId?.category_slug || "";
            const idxA = priorityCategories.indexOf(slugA);
            const idxB = priorityCategories.indexOf(slugB);
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
          });
          setCategoryProducts(sorted);
        } */

        const brandResponse = await fetch("/api/brand");
        const brandResult = await brandResponse.json();
        if (!brandResult.error) {
          const map = {};
          brandResult.data.forEach((b) => { map[b._id] = b.brand_name; });
          setBrandMap(map);
        }

        // Fetch active category hierarchy for dynamic subcategory links
        const catRes = await fetch("/api/categories/hierarchy");
        const catData = await catRes.json();
        if (catData.success) {
          const idMap = {};
          catData.categories.forEach(c => { idMap[c._id.toString()] = c; });
          setIdToCategory(idMap);

          const childMap = {};
          catData.categories.forEach(c => {
            if (c.parentid && c.parentid !== "none") {
              if (!childMap[c.parentid]) childMap[c.parentid] = [];
              childMap[c.parentid].push(c);
            }
          });
          setChildrenByParentId(childMap);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (categoryProducts.length === 0) return null;

  return (
    <>
      {navigating && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-black bg-opacity-30">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
      <motion.section id="category-products" initial="hidden" animate="visible" className="category-products px-3 sm:px-6 pt-6 ">
        {/* <div className="rounded-[23px] py-4"> */}
          <div className="space-y-6 ">
            <div className="space-y-6 max-w-7xl mx-auto">
<div className="flex justify-between items-center flex-wrap gap-4 mb-3 sm:mb-5">
              <h5 className="text-lg sm:text-2xl font-bold">Shop by Category</h5>
            </div>
            </div>
            
              {categoryProducts.map((categoryProduct) => {
                const category = categoryProduct.subcategoryId;
                const products = categoryProduct.products || [];
                const alignment = categoryProduct.alignment || "left";
                if (!category || products.length === 0) return null;
                const categoryStyle = categoryStyles[category.category_slug] || {
                  backgroundImage: '/uploads/small-appliance-banner.webp',
                  borderColor: '#1F3A8C'
                };

                // Dynamic links from DB (only active categories)
                const catId = category._id?.toString();
                const parentCat = idToCategory[category.parentid];
                const showallLink = parentCat
                  ? `/category/${parentCat.category_slug}/${category.category_slug}`
                  : `/category/${category.category_slug}`;
                const dynamicChildren = (childrenByParentId[catId] || [])?.slice(0, 7);
                const sanitizedCategoryImage = getSanitizedImage(categoryProduct.categoryImage);
                const sanitizedBackgroundImage = getSanitizedImage(categoryStyle.backgroundImage);
                const finalBgUrl = sanitizedCategoryImage || sanitizedBackgroundImage || "/default-image.jpg"; 
                const styleObj = { backgroundImage: `url("${finalBgUrl}")` };
                const visibleDesktopCount = 5;
                const fewProducts = products.length > 0 && products.length < visibleDesktopCount;

                return (
                  <div key={categoryProduct._id} className="space-y-4">
                    {/* Banner Image section */}
                    {/* {categoryProduct.bannerImage && categoryProduct.bannerImage.trim() !== "" && (
                      <div className="w-full my-6">
                        <Link href={categoryProduct.bannerRedirectUrl || "#"}>
                          <img
                            src={categoryProduct.bannerImage}
                            alt={categoryProduct.category_name}
                            className="w-full h-auto rounded-lg shadow-md transition"
                          />
                        </Link>
                      </div>
                    )} */}

                  {(() => {
  const bannerImages = getBannerImages(categoryProduct.bannerImage);
  const bannerUrls = getBannerRedirectUrls(categoryProduct.bannerRedirectUrl);
  if (!bannerImages.length) return null;

  return (
    <div className="w-full my-6 relative">

      {/* ✅ Single Banner */}
      {bannerImages.length === 1 ? (
        <Link href={bannerUrls[0] || "#"}>
          <Image
            src={bannerImages[0]}
            alt={categoryProduct.category_name || "Category Banner"}
            width={1200}
            height={400}
            priority
            className="w-full h-auto rounded-lg shadow-md transition"
            unoptimized
          />
        </Link>
      ) : (

<Swiper
  modules={[Autoplay, Pagination]}
  slidesPerView={1}
  loop={true}
  pagination={{
    clickable: true,
    renderBullet: (index, className) => {
      return `
        <span class="${className}" 
        style="
          width:8px;
          height:8px;
          background:white;
          border-radius:50%;
          display:inline-block;
          margin:0 4px;
          opacity:0.7;
          transition:all .3s;
        "></span>`;
    },
  }}

  onSwiper={(swiper) => {
    const styleDots = () => {
      const pag = document.querySelector(".swiper-pagination");
      if (pag) {
        pag.style.background = "#00000059";   // ash background
        // pag.style.padding = "6px 12px";
         pag.style.padding = "0px 5px";
        pag.style.borderRadius = "999px";
        pag.style.width = "fit-content";
        pag.style.left = "50%";
        pag.style.transform = "translateX(-50%)";
        pag.style.bottom = "12px";
      }

      document.querySelectorAll(".swiper-pagination-bullet").forEach((dot, i) => {
        dot.style.width = "8px";
        dot.style.height = "8px";
        dot.style.background = "white";
        dot.style.opacity = "0.7";

        if (i === swiper.realIndex) {
          dot.style.width = "12px";
          dot.style.height = "12px";
          dot.style.opacity = "1";
        }
      });
    };

    swiper.on("slideChange", styleDots);
    setTimeout(styleDots, 100);
  }}
>
  {bannerImages.map((img, i) => (
    <SwiperSlide key={i}>
      <Link href={bannerUrls[i] || "#"}>
      <Image src={img} alt={categoryProduct?.category_name || "Category Banner"}
      width={1200}
      height={400}
      priority
      className="w-full h-auto rounded-lg"
      unoptimized />
      </Link>
    </SwiperSlide>
  ))}
</Swiper>


      )}
    </div>
  );
})()}



                    {/* Category Products Section */}
                    <div className={`bg-white flex flex-col md:flex-row mb-8 max-w-7xl mx-auto ${alignment === "right" ? "md:flex-row-reverse" : ""}`} >
                      {/* Category Banner */}
                      <div className="flex-shrink-0 relative w-full md:w-[350px] h-48 sm:h-64 md:h-auto">
                        <div style={styleObj} className={`absolute inset-0 bg-cover bg-center    ${alignment === "right" ? "md:rounded-tr-lg md:rounded-br-lg" : "md:rounded-tl-lg md:rounded-bl-lg" }`}/>
                        <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-6 text-white">
                                <div className="w-full flex items-center justify-between mt-6 sm:mt-8 px-0 py-3 -mb-[11%]" style={{ margin: "0% 0% -9.5%" }}>
                                <Link
                                  href={categoryProduct.categoryRedirectUrl || showallLink}
                                  className="bg-gradient-to-r from-black/40 to-black/20 hover:from-black/60 hover:to-black/30 text-white text-xs sm:text-sm font-semibold py-1 px-2 rounded-lg backdrop-blur-sm shadow-md transition-all duration-300"
                                  style={{
                                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.6)",
                                  }}
                                  onClick={() => setNavigating(true)}
                                >
                                Shop Now →
                                </Link>
                               <h2
                                className="text-base sm:text-xl font-semibold leading-tight text-right"
                                style={{
                                  color: "#ffffff",
                                  textShadow: "rgba(49, 39, 39, 0.8) 0px 0px 3px, rgb(28 16 16 / 60%) 0px 0px 6px",
                                }}
                              >
                                {category.category_name}
                              </h2>
                              </div>
                          </div>
                        </div>

                        {/* Products Scroll */}
                        <div className="w-full md:w-[calc(100%-350px)]">
                          <div
                            className={`relative flex-1 py-2 border overflow-visible ${ alignment === "right" ? "pr-3 pl-2" : "pl-3 pr-2" }`}
                            style={{  borderTop: `4px solid ${categoryProduct.borderColor || categoryStyle.borderColor}`, borderBottom: `4px solid ${categoryProduct.borderColor || categoryStyle.borderColor}`,
                              borderLeft: alignment === "right" ? `4px solid ${categoryProduct.borderColor || categoryStyle.borderColor}` : "0px",
                              borderRight: alignment === "left" ? `4px solid ${categoryProduct.borderColor || categoryStyle.borderColor}` : "0px",
                            }}
                          >
                          {/* Category Links Section — fully dynamic from /api/categories/hierarchy */}
                          <div className={`flex flex-wrap items-center gap-2 mb-3 text-sm font-medium ${ alignment === "right" ? "justify-start" : "justify-end" }`} >
                            <Link href={showallLink} className="px-3 py-1 text-blue-600 hover:underline">
                              Show All
                            </Link>
                            {dynamicChildren.map((child) => (
                              <Link
                                key={child._id}
                                href={`${showallLink}/${child.category_slug}`}
                                className="px-3 py-1 text-gray-500 hover:text-blue-600 transition hover:underline"
                              >
                                {child.category_name}
                              </Link>
                            ))}
                          </div>

                          {/* Scroll Arrows */}
                          <button
                            onClick={() => scrollLeft(categoryProduct._id)}
                            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white text-black border hover:bg-black hover:text-white shadow-sm z-20 transition"
                          >
                            <FiChevronLeft size={16} />
                          </button>
                          <button
                            onClick={() => scrollRight(categoryProduct._id)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white text-black border hover:bg-black hover:text-white shadow-sm z-20 transition"
                          >
                            <FiChevronRight size={16} />
                          </button>
                          {/* Scrollable Products */}
                              <div
                                ref={(el) => (categoryScrollRefs.current[categoryProduct._id] = el)}
                                className={`flex overflow-x-auto scrollbar-hide scroll-smooth gap-4 py-3 px-4 ${fewProducts ? "justify-center" : "justify-start"}`}
                                style={{ WebkitOverflowScrolling: "touch" }}
                              >
                                {/* {products.slice(0, 15).map((product) => ( */}
                              {products.map((product) => (
                                    <div
                                      key={product._id}
                                      // fixed responsive card widths so 5 fit on large screens; min-width keeps consistency
                                      className="relative bg-white flex-none flex flex-col justify-between p-1 rounded-lg border border-gray-200 hover:border-[#0069c1] hover:shadow-md transition cursor-pointer h-full w-[48%] sm:w-[31%] md:w-[24%] lg:w-[23.9%] min-w-[160px]"
                                    >
                                      {/* Image */}
                                      <div className="relative aspect-square bg-white overflow-hidden">
                                        <Link href={`/product/${product.slug}`} onClick={() => handleProductClick(product)} className="block mb-1">
                                        {product.images?.[0] && (
                                          <>
                                            <Image
                                              src={product.images[0].startsWith("http") ? product.images[0] : `/uploads/products/${product.images[0]}`}
                                              alt={product.name}
                                              fill
                                              // ensure the image fits without stretching
                                              className="object-contain p-2 sm:p-3"
                                              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 18vw"
                                              unoptimized
                                            />
                                            {Number(product.special_price) > 0 && Number(product.special_price) < Number(product.price) && (
                                              <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded">
                                                -{Math.round(100 - (Number(product.special_price) / Number(product.price)) * 100)}%
                                              </span>
                                            )}
                                            <div className="absolute top-2 right-2">
                                              <ProductCard productId={product._id} />
                                            </div>
                                          </>
                                        )}
                                        </Link>
                                      </div>
 
                                       {/* Info */}
                                       <div className="p-2 flex flex-col h-full">
                                         <h4 className="text-[10px] sm:text-xs text-gray-500 mb-1 uppercase">
                                           <Link href={`/brand/${brandMap[product.brand]?.toLowerCase().replace(/\s+/g, "-") || ""}`} className="hover:text-blue-600">
                                             {brandMap[product.brand] || ""}
                                           </Link>
                                         </h4>
                                         
                                        <Link
                                          href={`/product/${product.slug}`}
                                          onClick={() => handleProductClick(product)}
                                          className="block mb-1"
                                        >
                                          <h3 className="text-xs sm:text-sm font-medium text-[#0069c6] hover:text-[#00badb] min-h-[32px] sm:min-h-[40px]">
                                            {(() => {
                                              const model = product.model_number ? `(${product.model_number.trim()})` : "";
                                              const name = product.name ? product.name.trim() : "";
                                              const maxLen = 40;

                                              if (model) {
                                                const remaining = maxLen - model.length - 1; // 1 for space before model
                                                const truncatedName =
                                                  name.length > remaining ? name.slice(0, remaining - 3) + `${model}...` : name;
                                                return `${truncatedName} `;
                                              } else {
                                                return name.length > maxLen ? name.slice(0, maxLen - 3) + "..." : name;
                                              }
                                            })()}
                                          </h3>
                                        </Link>

                                         <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                           <span className="text-sm sm:text-base font-semibold text-red-600">
                                             ₹ {(product.special_price > 0 && product.special_price < product.price
                                               ? Math.round(product.special_price)
                                               : Math.round(product.price)
                                             ).toLocaleString()}
                                           </span>
                                           {product.special_price > 0 && product.special_price < product.price && (
                                             <span className="text-[10px] sm:text-xs text-gray-500 line-through">
                                               ₹ {Math.round(product.price).toLocaleString()}
                                             </span>
                                           )}
                                         </div>
 
                                         <h4 className={`text-[10px] sm:text-xs mb-2 ${product.stock_status === "In Stock" ? "text-green-600" : "text-red-600"}`}>
                                           {product.stock_status}{product.stock_status === "In Stock" && product.quantity ? `, ${product.quantity} units` : ""}
                                         </h4>
 
                                         {/* Actions */}
                                        <div
                                            className="mt-auto flex items-center gap-0 text-[12.5px] sm:text-[11.5px]  font-semibold"
                                          >
                                          <Addtocart
                                            productId={product._id}
                                            stockQuantity={product.quantity}
                                            special_price={product.special_price}
                                            className="flex-1 whitespace-nowrap text-[10px] sm:text-sm py-1.5"
                                              movement={product.movement}
                                          productName={product.name}
                                           productSlug={product.slug}
                                          />
                                          <a
                                            href={`https://wa.me/919842344323?text=${encodeURIComponent(`Check Out This Product: ${typeof window !== 'undefined' ? window.location.origin : ''}/product/${product.slug}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-full flex items-center justify-center flex-shrink-0"
                                          >
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 32 32" fill="currentColor">
                                              <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                                            </svg>
                                          </a>
                                           {/* <button
                    type="button"
                    onClick={() => handleShare(product)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full transition-colors duration-300 flex items-center justify-center flex-shrink-0"
                    title="Share this product"
                  >
                    <FaShareAlt className="w-5 h-5" />
                  </button> */}
                                        </div>
                                       </div>
                                 </div>
                                 ))}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                );
              })}
          </div>
        {/* </div> */}
      </motion.section>
    </>
  );
};
export default CategoryProducts;