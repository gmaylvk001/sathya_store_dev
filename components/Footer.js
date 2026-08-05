"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin, FiClock } from "react-icons/fi";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { IoReload, IoStorefront, IoCardOutline, IoShieldCheckmark } from "react-icons/io5";
import { TbTruckDelivery } from "react-icons/tb";
import Image from "next/image";
import { MdAccountCircle } from "react-icons/md";
import { FaShoppingBag } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import OurLocations from '@/components/OurLocations';
import {
  Tv,
  Laptop,
  Smartphone,
  WashingMachine,
  Refrigerator,
  MapPin,
} from "lucide-react";

const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [groupedCategories, setGroupedCategories] = useState({ main: [], subs: {} });
  const [stores, setStores] = useState([]);
  
  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    const getCached = (key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.__ts) return null;
        if (Date.now() - parsed.__ts > CACHE_TTL) {
          localStorage.removeItem(key);
          return null;
        }
        return parsed.data;
      } catch (e) {
        return null;
      }
    };

    const setCached = (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify({ __ts: Date.now(), data }));
      } catch (e) {
        // ignore
      }
    };

    const makeGrouped = (data) => {
      const activeCategories = Array.isArray(data) ? data.filter(cat => cat.status === 'Active') : [];
      const main = activeCategories.filter(cat => cat.parentid === 'none');
      const subs = {};
      activeCategories.forEach(cat => {
        if (cat.parentid !== 'none') {
          if (!subs[cat.parentid]) subs[cat.parentid] = [];
          subs[cat.parentid].push(cat);
        }
      });
      return { main, subs };
    };

    const fetchCategories = async () => {
      const key = 'cache_footer_categories_v1';
      const cached = getCached(key);
      if (cached) {
        setGroupedCategories(makeGrouped(cached));
        return;
      }

      try {
        const res = await fetch('/api/categories/get');
        const data = await res.json();
        if (data) {
          setGroupedCategories(makeGrouped(data));
          setCached(key, data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    const fetchStores = async () => {
      const key = 'cache_footer_stores_v1';
      const cached = getCached(key);
      if (cached) {
        setStores(cached);
        return;
      }

      try {
        const res = await fetch('/api/store/get');
        const data = await res.json();
        if (data && data.success) {
          setStores(data.data);
          setCached(key, data.data);
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    };

    fetchCategories();
    fetchStores();
  }, []);

  const categoryIcons = {
    "TELEVISIONS": Tv,
    "COMPUTERS & LAPTOPS": Laptop,
    "MOBILES & ACCESSORIES": Smartphone,
    "LARGE APPLIANCES": Refrigerator,
    "SMALL APPLIANCES": WashingMachine,
    "OUR LOCATION": MapPin,
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/auth/check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUserData(data.user);
      } else {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setError('');
    setLoadingAuth(true);

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      localStorage.setItem('token', data.token);
      setIsLoggedIn(true);
      setUserData(data.user);
      setShowAuthModal(false);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        password: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserData(null);
  };
  
  const groupedStores = stores.reduce((acc, store) => {
    const city = store.city; // or store.store_city based on your API
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(store.organisation_name);
    return acc;
  }, {});

  const capitalizeFirstLetter = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);
    
  // Case-insensitive membership helper
  const inSetCI = (name, arr) => arr.includes(String(name || '').toLowerCase());

  const groupCategories = (categories) => {
    const grouped = { main: [], subs: {} };
    
    const mainCats = categories.filter(cat => cat.parentid === "none");
    
    mainCats.forEach(mainCat => {
      const subs = categories.filter(cat => cat.parentid === mainCat._id.toString());
      grouped.main.push(mainCat);
      grouped.subs[mainCat._id] = subs;
    });
    
    return grouped;
  };

  // Prepare normalized sections for rendering:
  // - For Large Appliances: one block per ["Dishwasher","Air Conditioner","Washing Machine","Refrigerator"]
  //   with order: title -> all subcategories -> single Brands list.
  // - For others: keep existing brand logic (subcategories + nested + one Brands list).
  const prepareFooterSections = (grouped) => {
    const sections = [];
    if (!grouped || !Array.isArray(grouped.main)) return sections;

    // Use lowercase for consistent matching
    const LARGE_SET = new Set([
      "dishwasher",
      "air conditioner",
      "washing machine",
      "refrigerator",
    ]);

    grouped.main.forEach((mainCat) => {
      const subs = grouped.subs[mainCat._id] || [];
      if (mainCat.category_name?.toLowerCase() === "large appliances") {
        subs.forEach((subcat) => {
          const subName = subcat.category_name?.toLowerCase();
          if (LARGE_SET.has(subName)) {
            const children = grouped.subs[subcat._id] || [];
            const brands =
              (Array.isArray(subcat.brands) && subcat.brands.length
                ? subcat.brands
                : mainCat.brands) || [];
            sections.push({
              type: "la",
              key: `la-${subcat._id}`,
              main: mainCat,
              la: subcat,
              children,
              brands,
            });
          }
        });
      } else {
        sections.push({
          type: "default",
          key: `def-${mainCat._id}`,
          main: mainCat,
          subs,
          brands: mainCat.brands || [],
        });
      }
    });

    return sections;
  };

  const preparedSections = useMemo(
    () => prepareFooterSections(groupedCategories),
    [groupedCategories]
  );

  return (
    <>
        <footer className="bg-white">
          {/* TOP FEATURES */}
          <div className="py-3 bg-gray-50">
            <div className="container mx-auto">

              <div className="w-full lg:w-12/12 mx-auto bg-white rounded-2xl shadow-xl px-6 py-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">

                  {/* Item 1 */}
                  <div className="flex items-center gap-3 px-6 lg:border-r border-gray-200">
                    <IoShieldCheckmark className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        100% Original Products
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Authorized Brand Partner
                      </p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center gap-3 px-6 lg:border-r border-gray-200">
                    <IoShieldCheckmark className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        2 Year Warranty
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        On Select Products
                      </p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center gap-3 px-6 lg:border-r border-gray-200">
                    <TbTruckDelivery className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        Fast Delivery
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Across Tamil Nadu
                      </p>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-center gap-3 px-6 lg:border-r border-gray-200">
                    <IoReload className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        Easy Returns
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Hassle Free
                      </p>
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div className="flex items-center gap-3 px-6 lg:border-r border-gray-200">
                    <IoStorefront className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        Best Prices
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Top Brands
                      </p>
                    </div>
                  </div>

                  {/* Item 6 */}
                  <div className="flex items-center gap-3 px-6">
                    <IoCardOutline className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        No Cost EMI
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Easy EMI
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

          {/* WHITE FOOTER */}
          <div className="container mx-auto px-4 py-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* LEFT LOGO SECTION */}
              <div className="lg:col-span-3 lg:border-r border-gray-200 lg:pr-8">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={150}
                  height={70}
                />

                <p className="text-gray-600 mt-4 text-sm leading-6">
                  Bharath Electronics & Appliances – Trusted by thousands of customers for the best brands, unbeatable prices and reliable services.
                </p>

                <div className="mt-5 space-y-3 text-sm text-gray-600">

                  <div className="flex items-start gap-3">
                    <FiMapPin className="text-blue-600 text-lg mt-1 shrink-0" />
                    <p>
                      26/1 Dr. Alagappa Chettiyar Rd, Tatabad,
                      Near Kovai Scan Centre, Coimbatore - 641012,
                      Tamil Nadu
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiPhone className="text-blue-600 text-lg" />
                    <a
                      href="tel:9842344323"
                      className="text-blue-600 hover:text-blue-600"
                    >
                      9842344323
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiMail className="text-blue-600 text-lg shrink-0" />

                    <a
                      href="mailto:customercare@bharathelectronics.in"
                      className="text-blue-600 hover:text-blue-600 break-all"
                    >
                      customercare@bharathelectronics.in
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiClock className="text-blue-600 text-lg" />
                    <p>Mon - Sun : 10:00 AM - 09:00 PM</p>
                  </div>

                </div>
              </div>

              {/* MIDDLE SECTION */}
              <div className="lg:col-span-7 lg:border-r border-gray-200 lg:pr-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                  {/* SHOP BY CATEGORY */}
                  <div>
                    <h3 className="font-bold text-[#041b4d] text-sm uppercase">
                      SHOP BY CATEGORY
                    </h3>

                    <div className="w-8 h-[2px] bg-blue-600 mt-2 mb-3"></div>

                    <ul className="space-y-2 text-gray-600 text-sm">
                      {groupedCategories.main.slice(0,8).map((cat) => (
                        <li key={cat._id}>
                          <Link href={`/category/${cat.category_slug}`}>
                            {cat.category_name}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href="/open-box">
                          Open Box Deal
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* CUSTOMER SERVICE */}
                  <div>
                    <h3 className="font-bold text-[#041b4d] text-sm uppercase">
                      CUSTOMER SERVICE
                    </h3>
                    <div className="w-8 h-[2px] bg-blue-600 mt-2 mb-3"></div>

                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li><Link href="/shipping">Shipping & Delivery Policy</Link></li>
                      <li><Link href="/cancellation-refund-policy">Cancellation & Refund Policy</Link></li>
                      <li><Link href="/feedback">Customer Support & feedback centre</Link></li>
                      <li><Link href="/contact">Contact</Link></li>
                      <li><Link href="/live-video-demo">Live Video Demo</Link></li>
                      <li><Link href="/bulk-orders-and-gift-card-enquiry">B2B / Corporate Enquiries</Link></li>
                    </ul>
                  </div>

                  {/* COMPANY */}
                  <div>
                    <h3 className="font-bold text-[#041b4d] text-sm uppercase">
                      COMPANY
                    </h3>
                    <div className="w-8 h-[2px] bg-blue-600 mt-2 mb-3"></div>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li><Link href="/aboutus">About Us</Link></li>
                      <li><Link href="/blog">Blog</Link></li>
                      <li><Link href="/careers">Careers</Link></li>
                      <li><Link href="/location">Our Stores</Link></li>
                      <li><Link href="/loyalty">Loyalty Points</Link></li>
                    </ul>
                  </div>

                  {/* MY ACCOUNT */}
                  <div>
                    <h3 className="font-bold text-[#041b4d] text-sm uppercase">
                      MY ACCOUNT
                    </h3>
                    <div className="w-8 h-[2px] bg-blue-600 mt-2 mb-3"></div>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      {isLoggedIn ? (
                        <>
                          <li><Link href="/order">My Orders</Link></li>
                          <li>
                            <button onClick={handleLogout}>
                              Logout
                            </button>
                          </li>
                        </>
                      ) : (
                        <li>
                          <button onClick={() => setShowAuthModal(true)}>
                            Sign In / Register
                          </button>
                        </li>
                      )}
                      <li><Link href="/orders">My Orders</Link></li>
                      <li><Link href="/wishlist">Wishlist</Link></li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* RIGHT SOCIAL SECTION */}
              <div className="lg:col-span-2">
                <h3 className="font-bold text-[#041b4d] mb-4">
                  CONNECT WITH US
                </h3>
                <p className="text-gray-600 mt-2 text-sm leading-6">
                  Stay Connected for the latest offers & updates
                </p>
                <div className="flex gap-4 text-xl mb-6 mt-5">
                  <Link href="https://web.whatsapp.com/send?phone=919842344323&text=Hi">
                    <FaWhatsapp className="text-green-500" />
                  </Link>
                  <Link href="https://www.facebook.com/BharathElectronics/">
                    <FaFacebookF className="text-blue-600" />
                  </Link>
                  <Link href="https://www.instagram.com/bharathelectronics/">
                    <FaInstagram className="text-pink-500" />
                  </Link>
                  <Link href="https://www.youtube.com/@bharathelectronicsandapplian">
                    <FaYoutube className="text-red-500" />
                  </Link>
                  <Link href="https://twitter.com/bharath_bea">
                    <FaXTwitter />
                  </Link>
                  <Link href="https://in.linkedin.com/company/bharath-electronics-and-appliances">
                    <FaLinkedinIn className="text-blue-700" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

{/* DARK BLUE CATEGORY FOOTER */}
<div className="bg-[#041b4d] text-white py-10 overflow-hidden">
  <div className="container mx-auto px-4">

    {/* Changed to 1 column on mobile, 4 on tablet, 10 on desktop */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-y-10 gap-x-6 text-sm">

      {groupedCategories.main.slice(0, 5).map((main) => {
        const Icon =
          categoryIcons[main.category_name?.toUpperCase()] || MapPin;

        return (
          <div
            key={main._id}
            className="lg:border-r border-[#14346d] px-2 lg:px-4 min-w-0"
          >
           <h4 className="flex items-center gap-2 font-semibold uppercase mb-4 flex-wrap">
  <Icon size={18} className="shrink-0" />
  <span className="text-[13px] leading-snug">{main.category_name}</span>
</h4>

            <ul className="space-y-2 text-gray-300 text-sm">
              {(groupedCategories.subs[main._id] || [])
                .slice(0, 5)
                .map((sub) => (
                  <li
                    key={sub._id}
  className="hover:text-white transition-colors"
>
                    <Link
                      href={`/category/${main.category_slug}/${sub.category_slug}`}
                    >
                      {sub.category_name}
                    </Link>
                  </li>
                ))}

              <li className="whitespace-nowrap">
                <Link
                  href={`/category/${main.category_slug}`}
                  className="text-blue-300 hover:text-white transition-colors"
                >
                  View All →
                </Link>
              </li>
            </ul>
          </div>
        );
      })}

      {/* Top Brands */}
      <div className="lg:border-r border-[#14346d] px-2 lg:px-4 min-w-0">
        <h4 className="font-semibold uppercase mb-4 whitespace-nowrap">
          Top Brands
        </h4>

        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="whitespace-nowrap hover:text-white transition-colors cursor-pointer">LG</li>
          <li className="whitespace-nowrap hover:text-white transition-colors cursor-pointer">Samsung</li>
          <li className="whitespace-nowrap hover:text-white transition-colors cursor-pointer">Sony</li>
          <li className="whitespace-nowrap hover:text-white transition-colors cursor-pointer">Whirlpool</li>
          <li className="whitespace-nowrap hover:text-white transition-colors cursor-pointer">Bosch</li>
        </ul>
      </div>

      {/* Our Location */}
      <div className="sm:col-span-2 lg:col-span-2 lg:border-r border-[#14346d] px-2 lg:px-4 min-w-0">
        <h4 className="font-semibold uppercase mb-4 whitespace-nowrap">
          Our Location
        </h4>

        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d391.02517849236526!2d76.9626592!3d11.0194039!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba8585cc4962b87%3A0x38eddb57f0f66203!2sBharath%20Electronics%20%26%20Appliances!5e0!3m2!1sen!2sin!4v1740660808642!5m2!1sen!2sin"
          width="100%"
          height="120"
          style={{ border: 0, borderRadius: '6px' }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps - Bharath Electronics & Appliances Location"
        />

        <a
          href="https://maps.app.goo.gl/aceBM5ztAjNQLx217"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 text-sm mt-3 inline-block whitespace-nowrap hover:text-white transition-colors"
        >
          View on Google Maps →
        </a>
      </div>

      {/* Our App Section */}
      <div className="sm:col-span-2 lg:col-span-2 bottom-4 flex px-2 lg:px-2 xl:px-4 min-w-0 relative h-[196px] lg:h-[230px] xl:h-[240px] items-center lg:items-start lg:pt-4 xl:pt-2 overflow-visible">
        
        {/* Text & Badges */}
        <div className="relative z-10 mb-2 flex flex-col pt-0.5 w-[60%] sm:w-[50%] md:w-[90%] lg:w-[52%] xl:w-[90%]">
          <h4 className="font-semibold text-white mb-6 mb-1 leading-tight lg:text-[13px] xl:text-base">
            Download BEA TRUCO App
          </h4>
          <p className="text-gray-300 text-[14px] leading-snug mb-2 lg:text-[12px] xl:text-[14px]">
            Your rewards, always<br/>in your pocket.
          </p>

          <div className="flex flex-col gap-1.5 mt-1">
            <Link href="https://play.google.com/store/apps/details?id=com.avaniko.truco&pcampaignid=web_share" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-[140px] lg:w-[118px] xl:w-[140px]">
              <Image
                src="/uploads/Play_Store.png" 
                alt="Get it on Google Play"
                width={140}
                height={100}
                className="object-contain rounded w-full h-auto"
              />
             
            </Link>
            <Link href="https://apps.apple.com/in/app/bea-truco/id6751942292" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-[140px] lg:w-[118px] xl:w-[140px]">
              <Image
                src="/uploads/App_Store.png" 
                alt="Download on the App Store"
                width={140}
                height={100}
                className="object-contain rounded w-full h-auto"
              />
             
            </Link>
          </div>
        </div>

        {/* Phone Image at the end (right) - hidden on very small screens, visible from sm up */}
        <div className="absolute right-[-12px] mb-2 sm:right-[90px] md:right-[90px] top-5 md:top-[80px] bottom-4 xl:bottom-[-2px] z-0 pointer-events-none flex items-center lg:right-[-18px] xl:right-[-90px] 2xl:right-[-40px] lg:top-[18px] xl:top-[36px] lg:bottom-auto">
  <Image
    src="/uploads/truco_app_phone.png"
    alt="BEA Mobile App Mockup"
    width={110}
    height={140}
    className="object-contain drop-shadow-xl lg:w-[92px] xl:w-[110px] h-auto"
  />
</div>
      </div>
    </div>
  </div>
</div>
          <div className="bg-[#02133a] text-gray-300 py-4">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">

              {/* Left Side */}
              <div className="flex items-center gap-3 text-sm">
                <div className="text-xl">🔒</div>
                <div>
                  <p className="font-medium text-white">Secure Payments</p>
                  <p className="text-xs text-gray-400">
                    Your data is protected with 256-bit encryption
                  </p>
                </div>
              </div>

              {/* Center */}
              <div className="text-center text-sm">
                <p>© 2026 Bharath Electronics & Appliances. All Rights Reserved.</p>

                <div className="flex justify-center gap-4 mt-1 text-xs">
                  <Link href="/terms-and-condition" className="hover:text-white">
                    Terms & Conditions
                  </Link>
                  <span>|</span>
                  <Link href="/privacypolicy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                  {/* <span>|</span>
                  <Link href="/sitemap" className="hover:text-white">
                    Sitemap
                  </Link> */}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-4">
                <img src="/uploads/payment.png" alt="Visa" className="h-6" />
                
              </div>

            </div>
          </div>
        </footer>
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#677279] rounded-lg p-8 w-96 max-w-full relative">
            <button 
                onClick={() => {
                  setShowAuthModal(false);
                  setFormError('');
                  setError('');
                }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl">
              ×
            </button>
            <div className="flex gap-4 mb-6 border-b">
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'login' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'register'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {activeTab === 'register' && (
                <input
                  type="tel"
                  placeholder="Mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
              
              {(formError || error) && (
                <div className="text-red-500 text-sm">
                  {formError || error}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full bg-blue-500 text-[#677279] py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors duration-200"
              >
                {loadingAuth ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
export default Footer;