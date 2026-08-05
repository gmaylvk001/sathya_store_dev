// 'use client';
import Link from "next/link";
import Image from 'next/image';
import { FiSearch, FiMapPin, FiHeart, FiShoppingCart, FiUser, FiMenu, FiX, FiPhoneCall, FiMessageSquare, FiChevronRight } from "react-icons/fi";
import { FaBars, FaShoppingBag, FaUserShield, FaSearch } from "react-icons/fa";
import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { IoLogOut } from "react-icons/io5";
import { useCart } from '@/context/CartContext';
import { useWishlist } from "@/context/WishlistContext";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import { useRouter } from 'next/navigation';
import { Navigation, Scrollbar } from 'swiper/modules';
import { useHeaderdetails } from "@/context/HeaderContext"; 
import { getProducts } from '@/lib/productApi';
import { filterAndRankProducts } from '@/lib/searchMatch';

// ADD: alphaSortString - case-insensitive, null-safe string comparator
const alphaSortString = (a, b) => {
  const sa = (a ?? '').toString().trim();
  const sb = (b ?? '').toString().trim();
  if (sa === sb) return 0;
  return sa.localeCompare(sb, undefined, { sensitivity: 'base' });
};

const HEADER_ACTION_LINK_CLASS =
  "group flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 transition-all duration-200 hover:bg-yellow-50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95";
const HEADER_ACTION_ICON_CLASS =
  "text-brandRed transition-all duration-200 group-hover:text-brandYellowDark group-hover:scale-110";
const HEADER_ACTION_LABEL_CLASS =
  "text-brandRed font-medium leading-none transition-colors duration-200 group-hover:text-brandYellowDark";



const Header = () => {
    const router = useRouter();
    // REMOVED: unused pathname
    // const pathname = usePathname();
    const [category, setCategory] = useState('All Category');
    const [activeSubCategory, setActiveSubCategory] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { wishlistCount } = useWishlist();
    const { cartCount, updateCartCount } = useCart();
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);

    // ADD: Cross-tab cart sync helpers
    const CART_COUNT_KEY = 'cartCount';
    // ADD: new key for cart data list
    const CART_DATA_KEY = 'cartData';

    // ADD: track latest cartCount for safe comparisons in effects/handlers
    const cartCountRef = useRef(cartCount);
    useEffect(() => {
      cartCountRef.current = cartCount;
    }, [cartCount]);

    // ADD: local cartData + ref
    const [cartData, setCartData] = useState(null);
    const cartDataRef = useRef(null);
    useEffect(() => { cartDataRef.current = cartData; }, [cartData]);

    const setCartCountSynced = useCallback((count) => {
      // Update context + propagate to other tabs
      updateCartCount(count);
      try {
        localStorage.setItem(CART_COUNT_KEY, String(Number.isFinite(count) ? count : 0));
      } catch { /* ignore quota */ }
    }, [updateCartCount]);

    // ADD: helpers for cartData storage + compare
    const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
    const isSameCartObj = (a, b) => {
      try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
    };
    const persistCartData = (data) => {
      try {
        const nextStr = JSON.stringify(data ?? null);
        const prevStr = localStorage.getItem(CART_DATA_KEY);
        if (nextStr !== prevStr) {
          localStorage.setItem(CART_DATA_KEY, nextStr);
        }
      } catch { /* ignore */ }
    };
    const ensureGuestCartId = () => {
      try {
        let id = localStorage.getItem('guestCartId');
        if (!id) {
          id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
          localStorage.setItem('guestCartId', id);
        }
        return id;
      } catch {
        return 'guest-' + Date.now();
      }
    };

    
    const fetchCartLatest = useCallback(async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : { guestCartId: ensureGuestCartId() };

        const res = await fetch('/api/cart', { method: 'GET', headers });
        if (!res.ok) {
          // if token invalid, do not overwrite local cartData here
          return;
        }
        const payload = await res.json();
        const latestCart = payload?.cart || null;

        // Sync cartCount if server value differs
        if (typeof latestCart?.totalItems === 'number' && latestCart.totalItems !== (cartCountRef.current ?? 0)) {
          setCartCountSynced(latestCart.totalItems);
        }

        // Only update state if changed
        if (!isSameCartObj(latestCart, cartDataRef.current)) {
          setCartData(latestCart);
          persistCartData(latestCart);
        }
      } catch (e) {
        // ignore fetch errors
      }
    }, [setCartCountSynced]);

    // Initialize from localStorage on mount (so tabs align immediately)
    useEffect(() => {
      try {
        const raw = localStorage.getItem(CART_COUNT_KEY);
        if (raw != null) {
          const val = parseInt(raw, 10);
          if (!Number.isNaN(val)) {
            if (val !== (typeof cartCount === 'number' ? cartCount : 0)) {
              updateCartCount(val);
            }
          }
        }
      } catch { /* ignore */ }
      // run only once
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ADD: init cartData from storage; if missing but count > 0 fetch latest
    useEffect(() => {
      try {
        const raw = localStorage.getItem(CART_DATA_KEY);
        const cached = safeParse(raw);
        if (cached && !isSameCartObj(cached, cartDataRef.current)) {
          setCartData(cached);
        } else if (!cached && (cartCountRef.current ?? 0) > 0) {
          // no cached cart but we have items -> fetch once
          fetchCartLatest();
        }
      } catch { /* ignore */ }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist to localStorage whenever cartCount changes in this tab (existing)
    useEffect(() => {
      try {
        const next = String(Number.isFinite(cartCount) ? cartCount : 0);
        // avoid redundant writes
        if (localStorage.getItem(CART_COUNT_KEY) !== next) {
          localStorage.setItem(CART_COUNT_KEY, next);
        }
      } catch { /* ignore quota */ }
    }, [cartCount]);

    // ADD: whenever cartCount changes, refresh latest cart (covers add/remove/order)
    useEffect(() => {
      fetchCartLatest();
    }, [cartCount, fetchCartLatest]);

    // ADD: persist cartData on change (avoid redundant writes)
    useEffect(() => {
      if (cartData !== undefined) {
        persistCartData(cartData);
      }
    }, [cartData]);

    // Listen to other tabs' updates
    useEffect(() => {
      const onStorage = (e) => {
        if (e.key === CART_COUNT_KEY) {
          const next = parseInt(e.newValue || '0', 10);
          if (!Number.isNaN(next) && next !== cartCountRef.current) {
            updateCartCount(next);
          }
        }
        if (e.key === CART_DATA_KEY) {
          const nextCart = e.newValue ? safeParse(e.newValue) : null;
          if (!isSameCartObj(nextCart, cartDataRef.current)) {
            setCartData(nextCart);
          }
        }
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }, [updateCartCount]);

    const handleCategoryClick = useCallback((categorySlug, categoryName) => {
        const path = `/category/${categorySlug}`;
        setSelectedCategory(categoryName);
        setIsMobileMenuOpen(false);
        router.push(path);
    }, [router]);
    const dropdownRef = useRef(null);
    const profileDropdownRef = useRef(null);
    const profileButtonRef = useRef(null);
    const mobileProfileButtonRef = useRef(null);
    const [activeTab, setActiveTab] = useState('login');
    // const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    // const [userData, setUserData] = useState(null);
    const [hasMounted, setHasMounted] = useState(false);
    const { userData, isLoggedIn, setIsLoggedIn, setUserData, isAdmin, setIsAdmin } = useHeaderdetails();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [profileMenuPos, setProfileMenuPos] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("All Category");
    const [searchQuery, setSearchQuery] = useState("");
    const [placeholder, setPlaceholder] = useState("Search for");
    const [typedPreview, setTypedPreview] = useState("");
    const [words, setWords] = useState([]);
    const [categorieslist, setCategorieslist] = useState([]);
    const [brandsForSearch, setBrandsForSearch] = useState([]);
    const wordIndex = useRef(0);
    const charIndex = useRef(0);
    const isDeleting = useRef(false);
    const getSortedProducts = () => {
    const sortedProducts = [...products];
    switch(sortOption) {
      case 'price-low-high':
          return sortedProducts.sort((a, b) => (a.special_price ?? a.price) - (b.special_price ?? b.price));
      case 'price-high-low':
          return sortedProducts.sort((a, b) => (b.special_price ?? b.price) - (a.special_price ?? a.price));
      case 'name-a-z':
          return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-z-a':
          return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
      default:
          return sortedProducts;
      }
    };

    // --- Add cache helpers after your state declarations (place near other consts) ---
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
    const loadCache = (key) => {
      // returns null if not found or parse error
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj || !obj.ts || !obj.data) return null;
        return obj;
      } catch (e) {
        console.warn('Cache parse error for', key, e);
        return null;
      }
    };
    const saveCache = (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
      } catch (e) {
        // ignore storage errors (quota)
        console.warn('Cache save failed for', key, e);
      }
    };

    // ADD: robust extractors + fallback words
    const extractCategoryArray = (payload) => {
      try {
        if (Array.isArray(payload)) return payload;
        if (payload && Array.isArray(payload.data)) return payload.data;
        if (payload && Array.isArray(payload.categories)) return payload.categories;
      } catch {}
      return [];
    };
    const ensureWordsNotEmpty = (names) => {
      const cleaned = (names || []).filter(Boolean);
      if (cleaned.length > 0) return cleaned;
      return ['Mobiles', 'Laptops', 'Television', 'Air Conditioner', 'Refrigerator'];
    };

    useEffect(() => {
      const key = 'categories_raw_cache';
      let mounted = true;

      const useCachedOrFetch = async () => {
        // try cache first
        try {
          const cached = loadCache(key);
          if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
            if (!mounted) return;
            const data = cached.data;
            // CHANGED: extract array safely + fallback
            const arr = extractCategoryArray(data);
            setCategorieslist(arr);
            setWords(ensureWordsNotEmpty(arr.map((cat) => cat.category_name)));
            return;
          }
        } catch (err) {
          console.warn('Error reading categories cache', err);
        }

        // fallback to fetch and then cache
        try {
          const response = await fetch("/api/categories/get");
          const raw = await response.json();
          if (!mounted) return;
          // CHANGED: extract array safely + fallback
          const arr = extractCategoryArray(raw);
          setCategorieslist(arr);
          setWords(ensureWordsNotEmpty(arr.map((cat) => cat.category_name)));
          saveCache(key, raw);
        } catch (error) {
          console.error("Error fetching categories:", error);
          // Fallback words if fetch fails
          if (mounted) setWords(ensureWordsNotEmpty([]));
        }
      };
      useCachedOrFetch();
      return () => { mounted = false; };
    }, []);

    useEffect(() => {
        const rawKey = 'categories_raw_cache';
        const nestedKey = 'categories_nested_cache';
        let mounted = true;

        const buildNestedAndCache = (rawData) => {
        // Keep only active categories
          const activeCategories = Array.isArray(rawData) ? rawData.filter(cat => cat.status === "Active") : [];

          const categoryMap = {};
          activeCategories.forEach((cat) => {
            // ensure subcategories array exists
            categoryMap[cat._id] = { ...cat, subcategories: [] };
          });

          const nestedCategories = [];
          activeCategories.forEach((cat) => {
            if (cat.parentid === "none") {
              // use the mapped object to ensure same reference
              nestedCategories.push(categoryMap[cat._id]);
            } else if (categoryMap[cat.parentid]) {
              categoryMap[cat.parentid].subcategories.push(categoryMap[cat._id]);
            }
          });

          // cache nested structure
          saveCache(nestedKey, nestedCategories);
          return nestedCategories;
        };

        const setupCategories = async () => {
          try {
            // Try nested cache first
            const nestedCached = loadCache(nestedKey);
            if (nestedCached && (Date.now() - nestedCached.ts) < CACHE_TTL_MS) {
              if (!mounted) return;
              setCategories(nestedCached.data);
            } else {
              // Get raw data from cache or fetch
              let raw = null;
              const rawCached = loadCache(rawKey);
              if (rawCached && (Date.now() - rawCached.ts) < CACHE_TTL_MS) {
                raw = rawCached.data;
              } else {
                const res = await fetch("/api/categories/get");
                raw = await res.json();
                saveCache(rawKey, raw);
              }

              if (!mounted) return;
              const nested = buildNestedAndCache(raw);
              setCategories(nested);
            }
          } catch (err) {
            console.error("Failed to fetch or build categories:", err);
            // fallback: ensure auth check still runs
          }
          // always check auth status after categories settled
          try { checkAuthStatus(); } catch (e) { /* ignore */ }
        };

      setupCategories();
      return () => { mounted = false; };
      }, []);

    useEffect(() => {
      // CHANGED: add cancellation to avoid orphaned timers
      let cancelled = false;

      const typeEffect = () => {
        if (cancelled || words.length === 0) return;

        const currentWord = words[wordIndex.current] || '';
        const updatedText = isDeleting.current
          ? currentWord.substring(0, Math.max(0, charIndex.current - 1))
          : currentWord.substring(0, Math.min(currentWord.length, charIndex.current + 1));

        // Count words in updatedText
        const wordCount = updatedText.trim().split(/\s+/).filter(Boolean).length;

        if (wordCount <= 2) {
          setTypedPreview(updatedText || "");
        }

        charIndex.current = isDeleting.current
          ? Math.max(0, charIndex.current - 1)
          : Math.min(currentWord.length, charIndex.current + 1);

        let delay = isDeleting.current ? 60 : 100;

        if (!isDeleting.current && charIndex.current === currentWord.length) {
          isDeleting.current = true;
          delay = 1000; // pause before deleting
        } else if (isDeleting.current && charIndex.current === 0) {
          isDeleting.current = false;
          wordIndex.current = (wordIndex.current + 1) % words.length;
          delay = 1000; // pause before typing next
        }

        setTimeout(() => {
          if (!cancelled) typeEffect();
        }, delay);
      };


      typeEffect();
      return () => { cancelled = true; };
    }, [words]);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const { headerdetails, updateHeaderdetails } = useHeaderdetails();

    const [offers, setOffers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [sortOption, setSortOption] = useState('');
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [dropdownLeft, setDropdownLeft] = useState(0);
    const [dropdownTop, setDropdownTop] = useState(0);
    const [dropdownCenterX, setDropdownCenterX] = useState(null);
    const [dropdownUseTranslate, setDropdownUseTranslate] = useState(false);
    const slideRefs = useRef({});
    const [suggestions, setSuggestions] = useState([]);
    // refs & state for search dropdown positioning
    const searchInputRef = useRef(null);
    // ADD missing state
    const [searchContext, setSearchContext] = useState(null);
    const debounceRef = useRef(null);
    const searchDropdownRef = useRef(null);
    const [searchDropdownVisible, setSearchDropdownVisible] = useState(false);
    const [searchDropdownLeft, setSearchDropdownLeft] = useState(0);
    const [searchDropdownTop, setSearchDropdownTop] = useState(0);
    const [searchDropdownWidth, setSearchDropdownWidth] = useState(0);
    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    // Track step
    const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter OTP and new password
    const [resetStep, setResetStep] = useState(1);// 1: enter email, 2: enter OTP, 3: new password
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    // OTP input
    const [forgotOTP, setForgotOTP] = useState('');

    // New password inputs
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // Close mobile menu when clicking outside

    const handleClickOutside = (event) => {
      const inProfileDropdown = profileDropdownRef.current?.contains(event.target);
      const inProfileButton = profileButtonRef.current?.contains(event.target);
      const inMobileProfileButton = mobileProfileButtonRef.current?.contains(event.target);

      if (!inProfileDropdown && !inProfileButton && !inMobileProfileButton) {
        setDropdownOpen(false);
      }
    };

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    useLayoutEffect(() => {
      if (!dropdownOpen) {
        setProfileMenuPos(null);
        return;
      }

      const updatePosition = () => {
        const isMobile = window.innerWidth < 640;
        const button = isMobile
          ? mobileProfileButtonRef.current
          : profileButtonRef.current;

        if (!button) return;

        const rect = button.getBoundingClientRect();
        setProfileMenuPos({
          top: rect.bottom + (isMobile ? 8 : 12),
          right: Math.max(8, window.innerWidth - rect.right),
          isMobile,
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }, [dropdownOpen]);

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
                if (data.role == "admin") {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
                setUserData(data.user);
                console.log("user data:", data.user);
                console.log("phone:", data.phone);
                
                try {
                const loyaltyRes = await fetch(`/api/award-points?phone=${data.phone || ''}`);
              const loyaltyData = await loyaltyRes.json();
             if (loyaltyData.success) {

             setLoyaltyPoints(loyaltyData.points);
              }
             } catch (e) {
            console.error('Loyalty fetch failed:', e);
             }
            } else {
                localStorage.removeItem('token');
                setIsLoggedIn(false);
                setShowAuthModal(true);
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
        }
    };
    const handleSearch = () => {

      if (!searchQuery.trim() && selectedCategory === "All Category") return;

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
        if (selectedCategory !== "All Category") {
          params.append("category", selectedCategory);
        }
        router.push(`/search?${params.toString()}`);
    };
    const handleSearchBtnClick = () => {
        if (!searchQuery.trim() && selectedCategory === "All Category") return;
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append("query", searchQuery.trim());
        if (selectedCategory !== "All Category") {
          params.append("category", selectedCategory);
        }
        
        router.push(`/search?${params.toString()}`);
    };
    useEffect(() => {
      let mounted = true;
      const loadBrands = async () => {
        try {
          const res = await fetch("/api/brand");
          const data = await res.json();
          if (mounted) setBrandsForSearch(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
          console.error("Error loading brands for search", err);
        }
      };
      loadBrands();
      return () => { mounted = false; };
    }, []);

    // Load products once using shared util (for instant local filtering)
    useEffect(() => {
      let mounted = true;
      const loadProducts = async () => {
        try {
          const data = await getProducts();
          if (!mounted) return;
          setProducts(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) {
          console.error('Error loading products in header', err);
        }
      };
      loadProducts();
      return () => { mounted = false; };
    }, []);

    // Memoized sorted products using existing getSortedProducts flow
    const sortedProducts = useMemo(() => getSortedProducts(), [products, sortOption]);

    // ADD: clearSearch helper for new mobile search design (from reference mobile view)
    const clearSearch = useCallback(() => {
      setSearchQuery('');
      setSuggestions([]);
      setTypedPreview('');
      setSearchDropdownVisible(false);
      if (searchInputRef.current) searchInputRef.current.blur();
    }, []);

    // helper to fetch suggestions (safe JSON handling) - now uses local products for instant results
    const fetchSuggestions = useCallback(async (q) => {
      if (!q || q.trim().length < 1) {
        setSuggestions([]);
        return;
      }

      const trimmed = q.trim();

      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data?.results || []);
          if (items.length > 0) {
            setSuggestions(items.slice(0, 12));
            setSearchDropdownVisible(true);
            if (searchInputRef.current) {
              const rect = searchInputRef.current.getBoundingClientRect();
              setSearchDropdownLeft(rect.left);
              setSearchDropdownTop(rect.bottom + window.scrollY);
              setSearchDropdownWidth(rect.width);
            }
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }

      // Fallback: ranked local cache when API returns nothing
      try {
        if (Array.isArray(sortedProducts) && sortedProducts.length > 0) {
          const filtered = filterAndRankProducts(sortedProducts, trimmed, 12, {
            brands: brandsForSearch,
          });
          setSuggestions(filtered);
          setSearchDropdownVisible(filtered.length > 0);

          if (searchInputRef.current) {
            const rect = searchInputRef.current.getBoundingClientRect();
            setSearchDropdownLeft(rect.left);
            setSearchDropdownTop(rect.bottom + window.scrollY);
            setSearchDropdownWidth(rect.width);
          }
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Local filter error', err);
        setSuggestions([]);
      }
    }, [sortedProducts, brandsForSearch]);
  
    // Debounced effect: call fetchSuggestions while typing
    useEffect(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const q = searchQuery.trim();
      if (!q) {
        setSuggestions([]);
        setSearchDropdownVisible(false);
        return;
      }

      // Ensure dropdown becomes visible as soon as user types (even for one char)
      setSearchDropdownVisible(true);

      // Immediate fetch for the first character, otherwise debounce for performance
      if (q.length === 1) {
        fetchSuggestions(q);
        return;
      }

      debounceRef.current = setTimeout(() => fetchSuggestions(q), 200);
      return () => clearTimeout(debounceRef.current);
    }, [searchQuery, fetchSuggestions]);
  
    // Close search dropdown when clicking outside input or dropdown
    useEffect(() => {
      const handler = (e) => {
        const target = e.target;
        if (
          searchDropdownVisible &&
          searchInputRef.current &&
          searchDropdownRef.current &&
          !searchInputRef.current.contains(target) &&
          !searchDropdownRef.current.contains(target)
        ) {
          setSearchDropdownVisible(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [searchDropdownVisible]);
    // Modify the search button to use the handler
    // Also make the search work when pressing Enter in the input field
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };
    const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    const isValidMobile = (mobile) => /^[0-9]{10}$/.test(mobile);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: ''
    });
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [formError, setFormError] = useState('');
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({
      login: { email: "", password: "" },
      register: { name: "", email: "", mobile: "", password: "" },
    });

    // ADD: define missing auth states to avoid ReferenceError
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [registerData, setRegisterData] = useState({ name: "", email: "", mobile: "", password: "" });

    const handleAuthSubmit = async (e) => {
      e.preventDefault();
      setLoadingAuth(false);

      // SAFE CHECKS: prevent "ReferenceError: loginData is not defined"
      if (activeTab === "login" && !(typeof loginData !== "undefined" && loginData)) {
        setFormError("Login form is not ready. Please try again.");
        return;
      }
      if (activeTab === "register" && !(typeof registerData !== "undefined" && registerData)) {
        setFormError("Register form is not ready. Please try again.");
        return;
      }

      // pick correct state depending on tab
      const currentData = activeTab === "login" ? loginData : registerData;

      // reset errors for current tab only
      setErrors((prev) => ({
        ...prev,
        [activeTab]: { name: "", email: "", mobile: "", password: "" },
      }));

      let newErrors = {};

      // ---------- REGISTER VALIDATION ----------
      if (activeTab === "register") {
        if (!currentData.name) newErrors.name = "Name must be filled";

        if (!currentData.mobile) {
          newErrors.mobile = "Mobile must be filled";
        } else if (!isValidMobile(currentData.mobile)) {
          newErrors.mobile = "Enter a valid mobile number";
        }
      }

      // ---------- COMMON (LOGIN + REGISTER) ----------
      if (!currentData.email) {
        newErrors.email = "Email must be filled";
      } else if (!isValidEmail(currentData.email)) {
        newErrors.email = "Enter a valid email";
      }

      if (currentData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      // If errors exist, update state and stop
      if (Object.keys(newErrors).length > 0) {
        setErrors((prev) => ({
          ...prev,
          [activeTab]: { ...prev[activeTab], ...newErrors },
        }));
        return;
      }


      // ---------- API CALL ----------
      if (
        (activeTab === "login" &&
          currentData.email &&
          currentData.password.length >= 6) ||
        (activeTab === "register" &&
          currentData.name &&
          currentData.email &&
          currentData.mobile &&
          currentData.password.length >= 6)
      ) {
        try {
          setLoadingAuth(true);
          setFormError("");
          setError("");
          const guestId = localStorage.getItem("guestCartId");
          const endpoint =
            activeTab === "login" ? "/api/auth/login" : "/api/auth/register";

          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...currentData, guestId }), 
          });

          const data = await response.json();

          if (!response.ok) {
            setError(
              <span className="text-red-500">
                {data.message || "Password Mismatch"}
              </span>
            );
            return;
          }

          if (data.token) {
            localStorage.setItem("token", data.token);
            setIsLoggedIn(true);
            setIsAdmin(data.user.role === "admin");
            setUserData(data.user);
            setShowAuthModal(false);

            // reset states
            setLoginData({ email: "", password: "" });
            setRegisterData({ name: "", email: "", mobile: "", password: "" });

            // update cart
            const cartResponse = await fetch("/api/cart/count", {
              headers: { Authorization: `Bearer ${data.token}` },
            });
            if (cartResponse.ok) {
              const cartDataCount = await cartResponse.json();
              // CHANGE: broadcast count to all tabs
              setCartCountSynced(cartDataCount.count);
            }

            // ADD: fetch and broadcast latest cartData after login/merge
            try { await fetchCartLatest(); } catch {}

            // 👇 Optional: clear guestId after merge
            localStorage.removeItem("guestCartId");
            location.reload();
          } else {
            setShowAuthModal(true);
            setActiveTab("login");
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoadingAuth(false);
        }
      } else {
        return;
      }
    };
    useEffect(() => {
        setHasMounted(true);
    }, []);
    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserData(null);
        // CHANGE: broadcast clear to all tabs
        setCartCountSynced(0);
        // ADD: clear cartData everywhere
        try { localStorage.removeItem(CART_DATA_KEY); } catch {}
        setCartData(null);
        location.reload();
    };
    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const response = await fetch("/api/offers/get");
                const result = await response.json();

                // Process and format dates before setting state
                const activeOffers = result.data
                    .filter((offer) => offer.fest_offer_status === "active")
                setOffers(activeOffers);
            } catch (err) {
                console.error("Failed to fetch offers", err);
            }
        };
        fetchOffers();
    }, []);
    const hideTimeout = useRef(null);
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/categories/get");
                const data = await response.json();

                // Keep only active categories
                const activeCategories = data.filter(cat => cat.status === "Active");

                const categoryMap = {};
                activeCategories.forEach((cat) => {
                    cat.subcategories = [];
                    categoryMap[cat._id] = cat;
                });

                const nestedCategories = [];
                activeCategories.forEach((cat) => {
                    if (cat.parentid === "none") {
                        nestedCategories.push(cat);
                    } else if (categoryMap[cat.parentid]) {
                        categoryMap[cat.parentid].subcategories.push(cat);
                    }
                });

                setCategories(nestedCategories);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };

        fetchCategories();
        checkAuthStatus();
    }, []);
    const flattenTree = (cat, rootCategory, level = 0) => {
        let result = [];
        
        // Add the category itself
        result.push({ ...cat, rootCategory, level, type: 'category' });

        // Add subcategories
        if (cat.subcategories?.length > 0) {
            cat.subcategories.forEach(child => {
                result = result.concat(flattenTree(child, rootCategory, level + 1));
            });
        }
        
        return result;
    };
 

    const cancelHide = () => {
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
            hideTimeout.current = null;
        }
    };
    const startHide = (delay = 100) => {
        cancelHide();
        hideTimeout.current = setTimeout(() => {
            setHoveredCategory(null);
        }, delay);
    };
    const handleMouseEnter = (categoryId) => {
        cancelHide();
        const cat = categories.find((c) => c._id === categoryId);
        if (!cat) return;
        setHoveredCategory(cat);
        const sortedSubs = [...(cat.subcategories || [])]
     .sort((a, b) => alphaSortString(a.category_name, b.category_name));
      setActiveSubCategory(null);

        const el = slideRefs.current[categoryId];
        if (!el) return;

        const rect = el.getBoundingClientRect();
        // Using fixed positioning => use viewport coords (rect.left / rect.bottom)
        setDropdownLeft(rect.left);
        setDropdownTop(rect.bottom + 18);
        setDropdownCenterX(rect.left + rect.width / 2);
    };
    // After dropdown mounts, measure and adjust so it never overflows screen or hides under arrows
    useLayoutEffect(() => {
        if (!hoveredCategory || !dropdownRef.current) return;
        const ddRect = dropdownRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        let left = dropdownLeft;

        // Center dropdown based on parent center when available
        if (dropdownCenterX != null && ddRect.width) {
            left = dropdownCenterX - ddRect.width / 2;
            // Clamp to viewport
            if (left < 8) left = 8;
            if (left + ddRect.width > screenWidth - 10) left = Math.max(10, screenWidth - ddRect.width - 10);
        } else {
            // If dropdown would overflow right edge, shift it left
            if (left + ddRect.width > screenWidth - 10) {
                left = Math.max(10, screenWidth - ddRect.width - 10);
            }
        }

        // Ensure dropdown is at least after prev arrow
        const prevBtn = document.querySelector(".custom-swiper-prev");
        const prevRight = prevBtn?.getBoundingClientRect().right || 0;
        if (left < prevRight + 8) left = prevRight + 8;

        // Ensure dropdown doesn't go too far left
        if (left < 8) left = 8;

        // Only update if it actually changes (prevents render thrash)
        if (Math.round(left) !== Math.round(dropdownLeft)) setDropdownLeft(left);
        // include dropdownLeft so we compare against current value
    }, [hoveredCategory, dropdownCenterX, dropdownLeft]);
    // cleanup hide timeout on unmount
    useEffect(() => {
        return () => {
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
        };
    }, []);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState('');
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    // Add this function to handle forgot password submission
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotPasswordError('');
        setForgotPasswordMessage('');
        setForgotPasswordLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: forgotPasswordEmail }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send reset link');
            }
            setForgotPasswordMessage(data.message || 'Password reset link sent to your email');
        } catch (err) {
            setForgotPasswordError(err.message);
        } finally {
            setForgotPasswordLoading(false);
        }
    };
  

    // Price formatter
    const formatPrice = (value) => {
      if (value === undefined || value === null || value === '') return '';
      const num = Number(value);
      if (Number.isNaN(num)) return '';
      return '₹' + num.toLocaleString('en-IN');
    };
    // FIX: renderSuggestionItem slug bug
    const renderSuggestionItem = useCallback((item, idx) => {
      const id = item._id || item.id || idx;
      const slug = item.slug || item._id || item.id || ''; // added slug definition
      const price = item.special_price ?? item.price;
      const imageSrc = item.image || (Array.isArray(item.images) && item.images.length > 0 ? `/uploads/products/${item.images[0]}` : null);
      return (
        <Link
          key={id}
          href={`/product/${encodeURIComponent(slug)}`}
          onClick={() => setSearchDropdownVisible(false)}
          className="group block mb-2 last:mb-0 rounded-lg bg-[#e9e9ec] hover:bg-white border border-transparent hover:border-red-300 shadow-sm hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400/40"
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-white ring-1 ring-gray-200 flex items-center justify-center shrink-0">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={imageSrc || 'Product'}
                  className="object-contain w-full h-full"
                  loading="lazy"
                />
              ) : (
                <span className="text-[10px] text-gray-400">NO IMG</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-gray-800 leading-snug line-clamp-2 uppercase group-hover:text-brandRed">
                {item.name || 'Unnamed'}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {price !== undefined && price !== null && (
                  <span className="text-[12px] font-medium text-gray-700 group-hover:text-brandRed">
                    {formatPrice(price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      );
    }, [setSearchDropdownVisible]);

    // ADD state (place with other useState declarations)
    const [activeSuggestion, setActiveSuggestion] = useState(-1);

    // RESET active suggestion when list changes or dropdown closes
    useEffect(() => {
      if (!searchDropdownVisible) setActiveSuggestion(-1);
      else setActiveSuggestion(-1);
    }, [suggestions, searchDropdownVisible]);

    // SELECT helper
    const selectSuggestion = useCallback((index) => {
      if (index < 0 || index >= suggestions.length) return;
      const item = suggestions[index];
      const slug = item.slug || item._id || item.id;
      if (!slug) return;
      setSearchDropdownVisible(false);
      router.push(`/product/${encodeURIComponent(slug)}`);
    }, [suggestions, router]);

    // DESKTOP key handling (keep existing handleKeyPress for mobile inputs)
    const handleDesktopKeyDown = (e) => {
      if (!suggestions.length) {
        if (e.key === 'Enter') handleSearch();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion(p => (p + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion(p => (p - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        if (activeSuggestion >= 0) {
          e.preventDefault();
          selectSuggestion(activeSuggestion);
        } else {
          handleSearch();
        }
      } else if (e.key === 'Escape') {
        setSearchDropdownVisible(false);
      }
    };

    // DESKTOP specific renderer (keep existing renderSuggestionItem for mobile contexts)
    function renderDesktopSuggestionItem(item, idx) {
      const id = item._id || item.id || idx;
      const price = item.special_price ?? item.price;
      const isActive = idx === activeSuggestion;
      const imageSrc =
        item.image ||
        (Array.isArray(item.images) && item.images.length > 0
          ? `/uploads/products/${item.images[0]}`
          : null);

      return (
        <div
          key={id}
          role="option"
          aria-selected={isActive}
          onMouseEnter={() => setActiveSuggestion(idx)}
          onMouseDown={() => selectSuggestion(idx)}
          className={`flex gap-4 px-4 py-3 cursor-pointer rounded-md transition-colors group bg-[#f2f2f2]`}
        >
          <div className="w-[50px] h-[50px] rounded-md overflow-hidden bg-white flex items-center justify-center border border-gray-200 shrink-0">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={item.name || 'Product'}
                className="object-contain w-full h-full"
                loading="lazy"
              />
            ) : (
              <span className="text-[10px] text-gray-400">NO IMG</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`text-[14px] font-medium leading-snug line-clamp-2 ${
                isActive ? 'text-brandRed' : 'text-gray-800 group-hover:text-gray-900'
              }`}
            >
              {item.name || 'Unnamed'}
            </div>
            {price && (
              <div className="text-[14px] font-semibold text-brandRed mt-1">
                ₹{price.toLocaleString('en-IN')}
              </div>
            )}
          
          </div>
        </div>
      );
    };
    // ADD: mobile accordion open-state + helpers
    // FIX: replace wrong useState with real loader function + tracking map
    const [loadedCategoryIds, setLoadedCategoryIds] = useState({});
    const [openCategories, setOpenCategories] = useState({});

    // NEW: unified nodes for mobile = categories + hoveredCategory.subcategories
    const nodes = useMemo(() => {
      const base = Array.isArray(categories) ? categories : [];
      const extra = (hoveredCategory && Array.isArray(hoveredCategory.subcategories))
        ? hoveredCategory.subcategories
        : [];

      if (!extra.length) return base;

      const map = new Map();
      base.forEach(n => { if (n && n._id) map.set(n._id, n); });
      extra.forEach(n => { if (n && n._id && !map.has(n._id)) map.set(n._id, n); });
      return Array.from(map.values());
    }, [categories, hoveredCategory]);

    // Ensures the subcategories for a category are present by rebuilding from cache/API if needed
    const ensureSubcategories = useCallback(async (categoryId) => {
      if (!categoryId) return;

      // already ensured this id in this session
      if (loadedCategoryIds[categoryId]) return;

      // find node in current nested tree
      const findNodeById = (list, id) => {
        for (const n of list || []) {
          if (n?._id === id) return n;
          const hit = findNodeById(n?.subcategories || [], id);
          if (hit) return hit;
        }
        return null;
      };

      const node = findNodeById(categories, categoryId);
      if (node && Array.isArray(node.subcategories) && node.subcategories.length > 0) {
        setLoadedCategoryIds((m) => ({ ...m, [categoryId]: true }));
        return;
      }

      try {
        // use raw cache if available, otherwise fetch
        let raw = loadCache('categories_raw_cache')?.data;
        if (!Array.isArray(raw) || raw.length === 0) {
          const res = await fetch('/api/categories/get');
          raw = await res.json();
          saveCache('categories_raw_cache', raw);
        }

        // rebuild nested tree
        const active = Array.isArray(raw) ? raw.filter((c) => c.status === 'Active') : [];
        const map = {};
        active.forEach((c) => { map[c._id] = { ...c, subcategories: [] }; });
        active.forEach((c) => {
          if (c.parentid && map[c.parentid]) map[c.parentid].subcategories.push(map[c._id]);
        });

        const nested = [];
        active.forEach((c) => {
          if (c.parentid === 'none' || !map[c.parentid]) nested.push(map[c._id]);
        });

        setCategories(nested);
        saveCache('categories_nested_cache', nested);
      } catch (e) {
        console.error('ensureSubcategories failed:', e);
      } finally {
        setLoadedCategoryIds((m) => ({ ...m, [categoryId]: true }));
      }
    }, [categories, loadedCategoryIds]);

    const toggleMobileCategory = useCallback(async (id) => {
      await ensureSubcategories(id);
      setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
    }, [ensureSubcategories]);

    // Add missing slug helpers used by renderCategoryLevel
    const safeSlugify = (s, fallback = "") => {
      const base = (s || "").toString().trim();
      if (!base) return fallback;
      return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    };
    const getCategorySlug = (cat) =>cat?.category_slug || cat?.slug || safeSlugify(cat?.category_name, cat?._id || "category");
    // NEW: compute href for node based on level (parent/child)
    const getNodeHref = (ancestorSlugs = [], nodeSlug) => {
      // Join all ancestors + current node
      const fullPath = [...ancestorSlugs, nodeSlug]
        .map((slug) => encodeURIComponent(slug))
        .join("/");

      return `/category/${fullPath}`;
    };
    // NEW: recursive renderer for unlimited category levels
    function renderCategoryLevel(nodes, ancestorSlugs = [], level = 0) {
      if (!Array.isArray(nodes) || nodes.length === 0) return null;
      return (
        <div className="divide-y divide-gray-100">
         {nodes
  .slice() // make a shallow copy to avoid mutating original
  .sort((a, b) => {
    const nameA = (a.category_name || "").toLowerCase();
    const nameB = (b.category_name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  })
  .map((node) => {
    const hasChildren =
      Array.isArray(node.subcategories) && node.subcategories.length > 0;
    const isOpen = !!openCategories[node._id];
    const nodeSlug = getCategorySlug(node);
    const slugs = [...ancestorSlugs, nodeSlug];
    const href = getNodeHref(ancestorSlugs, nodeSlug, level);
    const rowJustify = hasChildren ? "justify-between" : "justify-start";

    return (
      <div
        key={node._id}
        className={`${isOpen ? "bg-red-50/40" : "bg-white"} hover:bg-[#f2f2f2]`}
      >
        <div
          className={`w-full flex items-center ${rowJustify} ${
            level === 0 ? "px-3 py-3 text-sm" : "pl-5 pr-3 py-2 text-[13px]"
          } ${isOpen ? "text-brandRed bg-[#f2f2f2]" : "text-gray-800 hover:bg-[#f2f2f2]"}`}
        >
          <Link
            href={href}
            onClick={async (e) => {
              if (level === 0 || hasChildren) {
                e.preventDefault();
                e.stopPropagation();
                await ensureSubcategories(node._id);
                setOpenCategories((prev) => {
                  const next = { ...prev };
                  const willOpen = !prev[node._id];
                  if (level === 0) {
                    Object.keys(next).forEach((k) => delete next[k]);
                    if (willOpen) next[node._id] = true;
                    return next;
                  }
                  next[node._id] = willOpen;
                  return next;
                });
                setIsMobileMenuOpen(true);
                return;
              }
              setIsMobileMenuOpen(false);
            }}
            className="flex-1 text-left truncate"
            style={{ paddingLeft: level > 0 ? Math.min(level * 8, 24) : 0 }}
          >
            {node.category_name || "Category"}
          </Link>

          {hasChildren && (
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await ensureSubcategories(node._id);
                setOpenCategories((prev) => {
                  const next = { ...prev };
                  const willOpen = !prev[node._id];
                  if (level === 0) {
                    Object.keys(next).forEach((k) => delete next[k]);
                    if (willOpen) next[node._id] = true;
                    return next;
                  }
                  next[node._id] = willOpen;
                  return next;
                });
              }}
              aria-label="Toggle"
              className="ml-2"
            >
              <FiChevronRight
                className={`text-white rounded-full p-1 transition-transform duration-200 bg-[#d72828] ${
                  isOpen ? "rotate-90" : "rotate-0"
                }`}
                size={18}
              />
            </button>
          )}
        </div>

        {isOpen && hasChildren && (
          <div className="pb-2">
            {renderCategoryLevel(node.subcategories, slugs, level + 1)}
          </div>
        )}
      </div>
    );
  })}

        </div>
      );
    }
    useEffect(() => {
      if (!isMobileMenuOpen) return;
      const ids = (Array.isArray(categories) ? categories : []).slice(0, 5).map(c => c._id);
      ids.forEach((id) => { ensureSubcategories(id); });
    }, [isMobileMenuOpen, categories, ensureSubcategories]);

    return (
      <>
        <header className="sticky top-0 z-50 w-full max-w-[100vw] overflow-x-hidden">
            <style jsx global>{`
              :root{--height:34px;--radius:12px;--outline:#e3e3e9;--bg:#ffffff;--accent:#d72828;--muted:#6b7280;--shadow:0 8px 18px rgba(200,16,46,0.04)}
              .search-bar{display:flex;align-items:center;gap:8px;background:var(--bg);border-radius:10px;padding:3px 6px;border:2px solid var(--outline);box-shadow:var(--shadow);transition:box-shadow .25s ease,transform .12s ease,border-color .18s ease;width:100%;max-width:680px;margin:0 auto}
              .search-bar:focus-within{box-shadow:0 12px 30px rgba(200,16,46,.04);border-color:rgba(200,16,46,.04)}
              .search-bar-inner{position:relative;display:flex;align-items:center;gap:8px;width:100%;padding:2px;border-radius:8px}
               /* select */
               /* default: no visible border, show only when focused or has value */
               .search-select{height:var(--height);min-width:118px;max-width:200px;border-radius:10px;border:1px solid transparent;padding:0 30px 0 12px;font-size:14px;color:#111;background:#fff;-webkit-appearance:none;appearance:none;cursor:pointer}
               .select-wrap{position:relative;display:inline-block;max-width:32%;flex:0 0 auto;}
               .select-wrap::after{content:'';position:absolute;right:12px;top:50%;transform:translateY(-50%);width:10px;height:10px;background-image:linear-gradient(135deg,#6b7280,#6b7280);clip-path:polygon(50% 70%,0 25%,100% 25%);opacity:.85;pointer-events:none}
               /* input */
               .search-input{flex:1 1 auto;height:var(--height);padding:6px 10px;border-radius:10px;border:1px solid transparent;background:#fff;color:#0f172a;font-size:14px;width:100%;}
               /* when user has typed or on focus, show light border */
               .search-input.has-value, .search-input:focus, .search-select:focus { border-color: #e3e3e9; box-shadow: 0 6px 20px rgba(200,16,46,0.04); }
               /* remove default browser outline to avoid black focus ring */
               .search-input:focus, .search-select:focus { outline: none; }
               @keyframes shimmer{from{left:-120%}to{left:120%}}
               @keyframes loyaltyNewBlink{
                 0%,100%{background:#ef4444;color:#fff;box-shadow:0 0 6px rgba(239,68,68,.6)}
                 25%{background:#f59e0b;color:#fff;box-shadow:0 0 6px rgba(245,158,11,.6)}
                 50%{background:#22c55e;color:#fff;box-shadow:0 0 6px rgba(34,197,94,.6)}
                 75%{background:#3b82f6;color:#fff;box-shadow:0 0 6px rgba(59,130,246,.6)}
               }
               .loyalty-new-badge{
                 animation:loyaltyNewBlink 1.1s ease-in-out infinite;
               }
               @media (max-width:900px){:root{--height:36px}.search-btn{width:48px;color:#d72828;}.search-select{min-width:100px}}
            `}</style>
            {/* Main Header */}
            <div className={`${isMobileMenuOpen ? "fixed inset-0 mt-0 pt-0 z-50 overflow-y-auto overflow-x-hidden" : "bg-white px-3 sm:px-6 md:px-6 py-1 sticky top-0 z-40 overflow-x-hidden"}`}>
                {/* NEW MOBILE TOP ROW — compact so it never overflows viewport */}
                <div className="sm:hidden flex items-center justify-between w-full max-w-full min-w-0 relative">
                    <Link href="/" className="p-1 rounded-lg flex-shrink-0">
                      <img src="/uploads/sathyalogo.webp" alt="Logo" width={64} height={40} className="h-9 w-auto" />
                    </Link>
                    <div className="flex items-center gap-1 text-brandRed flex-shrink-0">
                        <Link href="/wishlist" className={`${HEADER_ACTION_LINK_CLASS} relative min-w-[36px]`}>
                          <div className="relative">
                            <FiHeart size={16} className={HEADER_ACTION_ICON_CLASS} />
                            <span className="absolute -top-2 -right-2 text-[9px] bg-brandRed text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                              {wishlistCount}
                            </span>
                          </div>
                          <span className={`text-[8px] ${HEADER_ACTION_LABEL_CLASS}`}>Wishlist</span>
                        </Link>
                        <Link href="/cart" className={`${HEADER_ACTION_LINK_CLASS} relative min-w-[36px]`}>
                          <div className="relative">
                            <FiShoppingCart size={16} className={HEADER_ACTION_ICON_CLASS} />
                            <span className="absolute -top-2 -right-2 text-[9px] bg-brandRed text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                              {cartCount}
                            </span>
                          </div>
                          <span className={`text-[8px] ${HEADER_ACTION_LABEL_CLASS}`}>Cart</span>
                        </Link>
                        <div className="relative flex-shrink-0 px-0.5">
                          {userData ? (
                            <button ref={mobileProfileButtonRef} type="button" onClick={() => setDropdownOpen(!dropdownOpen)} aria-label="Account">
                              <FiUser size={16} />
                            </button>
                          ) : (
                            <button type="button" onClick={() => setShowAuthModal(true)} aria-label="Login">
                              <FiUser size={16} />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={toggleMobileMenu}
                          aria-label="Menu"
                          className="relative flex-shrink-0 p-1.5 -mr-1 rounded-md active:bg-orange-50"
                        >
                          {isMobileMenuOpen ? <FiX size={18} /> : <FaBars size={17} />}
                        </button>
                    </div>
                </div>
                {/* NEW MOBILE SEARCH BAR */}
                <div className="sm:hidden mt-2 w-full max-w-full">
                  <div
                    className="w-full rounded-lg overflow-hidden bg-[#d72828]"
                    style={{ borderTop: "4px solid #fbe002" }}
                  >
                    <div className="w-full px-2 py-2.5">
                    <div className="flex items-center bg-white h-9 rounded-xl border border-gray-300 shadow-sm overflow-hidden w-full max-w-full transition-all duration-150 focus-within:border-[#d72828] focus-within:shadow-[0_0_0_2px_rgba(200,16,46,0.15)] flex-nowrap">
                      
                      {/* Category select */}
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="h-full text-[10px] bg-white border-r border-gray-300 outline-none flex-shrink-0 min-w-[72px] max-w-[78px] w-auto"
                        aria-label="Category"
                      >
                        <option value="All Category">All Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.category_name} title={cat.category_name}>
                            {cat.category_name}
                               
                          </option>
                       
                        ))}
                      
                      </select>
                      <div className="flex-1 relative h-full flex items-center">
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder=" "
                          className="w-full h-full text-sm outline-none bg-transparent px-1 focus:text-[#111] placeholder-transparent"
                          ref={searchInputRef}
                          onFocus={() => {
                            setSearchContext('mobileTop'); // ADDED
                            if (searchInputRef.current) {
                              const rect = searchInputRef.current.getBoundingClientRect();
                              setSearchDropdownLeft(rect.left);
                              setSearchDropdownTop(rect.bottom + window.scrollY);
                              setSearchDropdownWidth(rect.width);
                            }
                            if (searchQuery.trim().length >= 1) fetchSuggestions(searchQuery);
                            setSearchDropdownVisible(true);
                          }}
                        />
                        {searchQuery.trim() === "" && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] pointer-events-none z-10 truncate max-w-[calc(100%-8px)]">
                            <span className="text-gray-400">Search for</span>
                            <span className="text-gray-900">"{typedPreview }"</span>
                          </div>
                        )}
                      </div>
                  
                      <button
                        onClick={handleSearch}
                        aria-label="Search"
                        className="h-full px-2.5 bg-[#d72828] text-white flex items-center justify-center active:scale-[0.97] transition flex-shrink-0"
                      >
                        <FaSearch size={13} />
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
                {/* MOBILE TOP SUGGESTIONS (outside menu) */}
                {searchDropdownVisible && searchContext === 'mobileTop' && !isMobileMenuOpen && (
                  <div ref={searchDropdownRef} className="sm:hidden absolute z-[70] left-0 right-0 px-3 mt-1">
                    <div className="bg-white rounded-lg shadow-lg border max-h-72 overflow-y-auto">
                      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-gray-500">
                        PRODUCTS
                      </div>
                      <div className="px-3 pb-2">
                        {suggestions.length > 0
                          ? suggestions.map(renderSuggestionItem)
                          : (searchQuery.trim() && (
                              <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                                {/* Icon */}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-12 h-12 mb-3 text-gray-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>

                                {/* Message */}
                                <p className="text-sm font-medium">No products found</p>
                                <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
                              </div>

                            ))
                        }
                      </div>
                    </div>
                  </div>
                )}
                {/* DESKTOP ROW (unchanged original content) */}
                <div className="hidden sm:flex justify-between items-center gap-3">
                    {/* Logo (Hidden on mobile) */}
                    <div className="hidden sm:block bg-white py-2 rounded-lg">
                        <Link href="/" className="mx-auto">
                            <img src="/uploads/sathyalogo.webp" alt="Logo" className="h-auto" width={80} height={45} />
                        </Link>
                    </div>

                    {/* Search Bar (Hidden on mobile - will show in mobile menu) */}
                    <div className="search-bar relative hidden sm:flex flex-1 w-full max-w-[680px] mx-auto items-center bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200" role="search" style={{minHeight: '36px', display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg)',
                        borderRadius: '10px',
                        padding: '3px 6px',
                        border: '2px solid var(--outline)',
                        boxShadow: 'var(--shadow)',
                        transition:
                          'box-shadow .25s ease, transform .12s ease, border-color .18s ease',
                        width: '100%',
                        maxWidth: '680px',
                        margin: '0 auto',}}>
                      <div className="search-bar-inner" style={{ position: 'relative', width: '100%' }}>
                        <div className="select-wrap">
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="search-select"
                            aria-label="Search category"
                          >
                            <option value="All Category">All Category</option>
                            {categories.map((cat) => (
                              <option key={cat._id} value={cat.category_name}>
                                {cat.category_name}
                              </option>
                            ))}
                          </select>
                         
                        </div>
                        {/* input wrapper with absolute overlay */}
                        <div className="relative flex-1">
                          <input
                            type="search"
                            name="q"
                            id="q"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            ref={searchInputRef}
                            onFocus={() => {
                              setSearchContext('desktop'); // ADDED
                              if (searchInputRef.current) {
                                const rect = searchInputRef.current.getBoundingClientRect();
                                setSearchDropdownLeft(rect.left);
                                setSearchDropdownTop(rect.bottom + window.scrollY);
                                setSearchDropdownWidth(rect.width);
                              }
                              if (searchQuery.trim().length >= 2) fetchSuggestions(searchQuery);
                              setSearchDropdownVisible(true);
                            }}
                            onKeyDown={handleDesktopKeyDown}  // correct usage
                            className={`search-input ${searchQuery.trim() ? 'has-value' : ''}`}
                            placeholder=" "
                            aria-label="Search query"
                          />
                          {/* typed-overlay: "Search for" light gray, typedPreview black */}
                          {searchQuery.trim() === "" && (
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
                              <span className="text-gray-400 text-sm">Search for</span>
                              <span className="text-black text-sm">"{typedPreview }"</span>
                            </div>
                          )}
                        </div>
                        {/* CHANGE: wire desktop .search-btn to immediate redirect handler */}
                        <button
                          type="button"
                          className="search-btn"
                          style={{color:'#d72828'}}
                          onClick={handleSearchBtnClick}
                          aria-label="Search"
                        >
                          <FaSearch />
                        </button>
                        <div className="shimmer" aria-hidden="true"></div>
                        {/* DROPDOWN MOVED OUTSIDE TO SUPPORT MOBILE */ }
                        {/* (was here previously) */}
                      </div>                    
                    </div>
                    {/* Icons Group */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 mt-0.5">
                        {/* Mobile Search Button (Hidden on desktop) */}
                        <button onClick={toggleMobileMenu} className="sm:hidden text-brandRed">
                            <FiSearch size={20} />
                        </button>

						<Link href="/feedback" className={`${HEADER_ACTION_LINK_CLASS} hidden sm:flex min-w-[52px]`}>
						  <FiMessageSquare size={18} className={HEADER_ACTION_ICON_CLASS} />
						  <span className={`text-[10px] ${HEADER_ACTION_LABEL_CLASS}`}>Feedback</span>
						</Link>

                        <Link href="/contact" className={`${HEADER_ACTION_LINK_CLASS} hidden sm:flex min-w-[52px]`}>
                            <FiPhoneCall size={18} className={HEADER_ACTION_ICON_CLASS} />
							<span className={`text-[10px] ${HEADER_ACTION_LABEL_CLASS}`}>Contact</span>
                        </Link>

                        <Link href="/location" className={`${HEADER_ACTION_LINK_CLASS} hidden sm:flex min-w-[52px]`}>
                            <FiMapPin size={18} className={HEADER_ACTION_ICON_CLASS} />
							<span className={`text-[10px] ${HEADER_ACTION_LABEL_CLASS}`}>Store</span>
                        </Link>

                        <Link href="/wishlist" className={`${HEADER_ACTION_LINK_CLASS} flex min-w-[52px] relative`}>
                            <div className="relative">
                              <FiHeart size={18} className={HEADER_ACTION_ICON_CLASS} />
                              <span className="absolute -top-2 -right-2 text-[10px] bg-brandRed text-white rounded-full w-4 h-4 flex items-center justify-center">
                                  {wishlistCount}
                              </span>
                            </div>
							<span className={`text-[10px] ${HEADER_ACTION_LABEL_CLASS}`}>Wishlist</span>
                        </Link>

                        <Link href="/cart" className={`${HEADER_ACTION_LINK_CLASS} flex min-w-[52px] relative`}>
                            <div className="relative">
                              <FiShoppingCart size={18} className={HEADER_ACTION_ICON_CLASS} />
                              <span className="absolute -top-2 -right-2 text-[10px] bg-brandRed text-white rounded-full w-4 h-4 flex items-center justify-center">
                                  {cartCount}
                              </span>
                            </div>
							<span className={`text-[10px] ${HEADER_ACTION_LABEL_CLASS}`}>Cart</span>
                        </Link>

                        {/* User Account */}
                        <div className="relative">
                            {userData ? (
                                <>
                                    <button ref={profileButtonRef} onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center text-black focus:outline-none p-1 sm:p-0">
                                        <FiUser size={18} className="text-brandRed" />
                                        <span className="ml-1 font-bold text-xs sm:text-sm text-brandRed hidden lg:inline">
                                            Hi, {userData.name || userData.username || "User"}
                                        </span>
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setShowAuthModal(true)} className="flex items-center text-black p-1 sm:p-0" aria-label="Sign in">
                                    <FiUser size={18} className="text-brandRed" />
                                    {/* <span className="ml-1 font-bold text-xs sm:text-sm text-brandRed hidden lg:inline">Sign In</span> */}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                {/* Mobile Menu (Hidden on desktop) */}
                {isMobileMenuOpen && (
                  <div className="sm:hidden bg-white fixed inset-0 z-50 p-4 pt-3 rounded-lg shadow-lg overflow-y-auto transition-all duration-300"
                    style={{ touchAction: 'auto', userSelect: 'auto', WebkitUserSelect: 'auto' }}
                  >
                    {/* Internal sticky header */}
                    <div className="flex items-center justify-between mb-3 sticky top-0 bg-white pb-2 border-b">
                      <div className="flex items-center gap-2 text-brandRed font-semibold text-sm">
                        <FiMenu size={18} />
                        <span>Menu</span>
                      </div>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label="Close menu"
                        className="p-2 rounded-full text-brandRed hover:bg-red-50 active:bg-red-100 focus:outline-none focus:ring focus:ring-red-200"
                      >
                        <FiX size={22} />
                      </button>
                    </div>
        
                    {/* Mobile Category Block (accordion) */}
                      <div className=" bg-white rounded-md border border-gray-200 overflow-hidden">
                          <div
                            className="text-white bg-[#d72828]"
                            style={{ borderTop: "4px solid #fbe002" }}
                          >
                            <div className="px-3 py-4 text-[14px] font-semibold tracking-wide">
                              Browse Category
                            </div>
                          </div>
                          {/* Use unified nodes (categories + hoveredCategory subcategories when available) */}
                          {Array.isArray(nodes) && nodes.length > 0 ? (
                            renderCategoryLevel(nodes, [], 0)
                          ) : (
                            <div className="px-3 py-4 text-sm text-gray-500">
                              Loading categories…
                            </div>
                          )}
                        </div>
                        {/* Quick links moved from top bar (mobile) */}
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <Link
                            href="/feedback"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex flex-col items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-3 text-brandRed"
                          >
                            <FiMessageSquare size={18} />
                            <span className="text-[11px] font-medium">Feedback</span>
                          </Link>
                          <Link
                            href="/contact"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex flex-col items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-3 text-brandRed"
                          >
                            <FiPhoneCall size={18} />
                            <span className="text-[11px] font-medium">Contact</span>
                          </Link>
                          <Link
                            href="/location"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex flex-col items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-3 text-brandRed"
                          >
                            <FiMapPin size={18} />
                            <span className="text-[11px] font-medium">Store</span>
                          </Link>
                        </div>
                        {/* Open Box Sale - Mobile */}
                           <Link
                       href="/open-box"
                        className="mt-3 flex items-center justify-between bg-white rounded-md px-4 py-3 text-black font-semibold text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                         >
                   <span> Open Box Clearance Sale</span>
              <FiChevronRight className="bg-[#d72828] rounded-full text-white" size={18} />
                       </Link>
                        {/* Loyalty - Mobile */}
                        <Link
                          href="/loyalty"
                          className="mt-3 relative flex items-center justify-between bg-white rounded-md px-4 py-3 text-black font-semibold text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span>Loyalty</span>
                          <span className="loyalty-new-badge absolute top-2 right-10 text-[9px] font-bold px-1.5 py-0.5 rounded leading-none">
                            NEW
                          </span>
                          <FiChevronRight className="bg-[#d72828] rounded-full text-white" size={18} />
                        </Link>
                  </div>
                )}
                {/* Auth Modal */}
                {showAuthModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 w-96 max-w-full relative">
                            <button onClick={() => { setShowAuthModal(false); setFormError(''); setError(''); setErrors({ login: {}, register: {} }); setLoginData({ email: "", password: "" }); setRegisterData({ name: "", email: "", mobile: "", password: "" }); }} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl">
                                &times;
                            </button>
                            <div className="flex gap-4 mb-6 border-b">
                                <button className={`pb-2 px-1 ${activeTab === 'login' ? 'border-b-2 border-brandRed text-brandRed' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('login')}>
                                    Login
                                </button>
                                <button className={`pb-2 px-1 ${activeTab === 'register' ? 'border-b-2 border-brandRed text-brandRed' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('register')}>
                                    Register
                                </button>
                            </div>
                            <form onSubmit={handleAuthSubmit} className="space-y-4">
                              {/* Register Name Field */}
                              {activeTab === "register" && (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Name"
                                    value={registerData.name}
                                    onChange={(e) =>
                                      setRegisterData({ ...registerData, name: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brandRed ${
                                      errors?.register?.name ? "border-red-500" : ""
                                    }`}
                                  />
                                  {errors?.register?.name && (
                                    <p className="text-red-500 text-sm">{errors.register.name}</p>
                                  )}
                                </>
                              )}

                              {/* Email Field */}
                              <input
                                type="text"
                                placeholder="Email"
                                value={
                                  activeTab === "login" ? loginData.email : registerData.email
                                }
                                onChange={(e) =>
                                  activeTab === "login"
                                    ? setLoginData({ ...loginData, email: e.target.value })
                                    : setRegisterData({ ...registerData, email: e.target.value })
                                }
                                className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brandRed ${
                                  errors?.[activeTab]?.email ? "border-red-500" : ""
                                }`}
                              />
                              {errors?.[activeTab]?.email && (
                                <p className="text-red-500 text-sm">{errors[activeTab].email}</p>
                              )}

                              {/* Register Mobile Field */}
                              {activeTab === "register" && (
                                <>
                                  <input
                                    type="tel"
                                    placeholder="Mobile"
                                    value={registerData.mobile}
                                    onChange={(e) =>
                                      setRegisterData({ ...registerData, mobile: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brandRed ${
                                      errors?.register?.mobile ? "border-red-500" : ""
                                    }`}
                                  />
                                  {errors?.register?.mobile && (
                                    <p className="text-red-500 text-sm">{errors.register.mobile}</p>
                                  )}
                                </>
                              )}

                              {/* Password Field */}
                              <input
                                type="password"
                                placeholder="Password"
                                value={
                                  activeTab === "login" ? loginData.password : registerData.password
                                }
                                onChange={(e) =>
                                  activeTab === "login"
                                    ? setLoginData({ ...loginData, password: e.target.value })
                                    : setRegisterData({ ...registerData, password: e.target.value })
                                }
                                className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brandRed ${
                                  errors?.[activeTab]?.password ? "border-red-500" : ""
                                }`}
                                minLength={6}
                              />
                              {errors?.[activeTab]?.password && (
                                <p className="text-red-500 text-sm">{errors[activeTab].password}</p>
                              )}

                              {/* Global Form Error */}
                              {(formError || error) && (
                                <div className="text-red-500 text-sm">{formError || error}</div>
                              )}

                              {/* Submit Button */}
                              <button
                                type="submit"
                                disabled={loadingAuth}
                                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-brandRedDark disabled:bg-gray-400 transition-colors duration-200"
                              >
                                {loadingAuth
                                  ? "Processing..."
                                  : activeTab === "login"
                                  ? "Login"
                                  : "Register"}
                              </button>

                              {/* Forgot Password (only in login) */}
                              {activeTab === "login" && (
                                <div className="text-center mt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAuthModal(false);
                                      setShowForgotPasswordModal(true);
                                      setForgotStep(1);
                                      setForgotPasswordEmail(formData?.email || "");
                                      setForgotOTP("");
                                      setNewPassword("");
                                      setConfirmPassword("");
                                      setForgotPasswordMessage("");
                                      setForgotPasswordError("");
                                    }}
                                    className="text-sm text-brandRed hover:underline"
                                  >
                                    Forgot Password?
                                  </button>
                                </div>
                              )}
                            </form>
                        </div>
                    </div>
                )}
                {showForgotPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-96 max-w-full relative">
                            <button onClick={() => setShowForgotPasswordModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                            {/* STEP 1: Enter Email */}
                            {forgotStep === 1 && (
                                <>
                                    <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault(); setForgotPasswordError(''); setForgotPasswordMessage(''); setForgotPasswordLoading(true);
                                        try {
                                            const res = await fetch('/api/auth/request-reset', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email: forgotPasswordEmail }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.message || 'Error sending OTP');
                                            setForgotPasswordMessage('OTP sent to your email.');
                                            setForgotStep(2);
                                        } catch (err) {
                                            setForgotPasswordError(err.message);
                                        } finally {
                                            setForgotPasswordLoading(false);
                                        }
                                    }} className="space-y-4">
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={forgotPasswordEmail}
                                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brandRed"
                                        />
                                        {forgotPasswordError && (
                                            <p className="text-red-500 text-sm">{forgotPasswordError}</p>
                                        )}
                                        {forgotPasswordMessage && (
                                            <p className="text-green-500 text-sm">{forgotPasswordMessage}</p>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={forgotPasswordLoading}
                                            className="w-full bg-red-500 text-white py-2 rounded hover:bg-brandRedDark disabled:bg-gray-400"
                                        >
                                            {forgotPasswordLoading ? 'Sending...' : 'Send OTP'}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* STEP 2: Enter OTP */}
                            {forgotStep === 2 && (
                                <>
                                    <h2 className="text-lg font-semibold mb-4">Enter OTP</h2>
                                    <p className="text-sm mb-2">Email: <strong>{forgotPasswordEmail}</strong></p>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault(); setForgotPasswordError(''); setForgotPasswordMessage('');
                                        if (!forgotOTP.trim()) {
                                            setForgotPasswordError('Please enter OTP.');
                                            return;
                                        }
                                        setForgotPasswordLoading(true);
                                        try {
                                            const res = await fetch('/api/auth/verify-otp', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    email: forgotPasswordEmail,
                                                    otp: forgotOTP,
                                                }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.message || 'Invalid OTP');
                                            setForgotPasswordMessage('OTP verified. Please set your new password.');
                                            setForgotStep(3);
                                        } catch (err) {
                                            setForgotPasswordError(err.message);
                                        } finally {
                                            setForgotPasswordLoading(false);
                                        }
                                    }} className="space-y-4">
                                        <input type="text" placeholder="Enter OTP" value={forgotOTP} onChange={(e) => setForgotOTP(e.target.value)} required className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brandRed" />
                                        {forgotPasswordError && (
                                            <p className="text-red-500 text-sm">{forgotPasswordError}</p>
                                        )}
                                        {forgotPasswordMessage && (
                                            <p className="text-green-500 text-sm">{forgotPasswordMessage}</p>
                                        )}
                                        <button type="submit" disabled={forgotPasswordLoading} className="w-full bg-red-500 text-white py-2 rounded hover:bg-brandRedDark disabled:bg-gray-400">
                                            {forgotPasswordLoading ? 'Validating...' : 'Validate OTP'}
                                        </button>
                                    </form>
                                </>
                            )}
                            {/* STEP 3: New Password */}
                            {forgotStep === 3 && (
                                <>
                                    <h2 className="text-lg font-semibold mb-4">Set New Password</h2>
                                    <p className="text-sm mb-2">Email: <strong>{forgotPasswordEmail}</strong></p>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        setForgotPasswordError('');
                                        setForgotPasswordMessage('');
                                        if (newPassword !== confirmPassword) {
                                            setForgotPasswordError('Passwords do not match.');
                                            return;
                                        }
                                        setForgotPasswordLoading(true);
                                        try {
                                              const res = await fetch('/api/auth/reset-password', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    email: forgotPasswordEmail,
                                                    otp: forgotOTP,
                                                    newPassword,
                                                }),
                                            });

                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.message || 'Error resetting password');

                                            setForgotPasswordMessage('Password reset successful.');
                                            setTimeout(() => {
                                                setShowForgotPasswordModal(false);
                                                setShowAuthModal(true); // reopen login
                                            }, 1500);
                                        } catch (err) {
                                            setForgotPasswordError(err.message);
                                        } finally {
                                            setForgotPasswordLoading(false);
                                        }
                                    }} className="space-y-4">
                                        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brandRed" />
                                        <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brandRed" />
                                        {forgotPasswordError && (
                                            <p className="text-red-500 text-sm">{forgotPasswordError}</p>
                                        )}
                                        {forgotPasswordMessage && (
                                            <p className="text-green-500 text-sm">{forgotPasswordMessage}</p>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={forgotPasswordLoading}
                                            className="w-full bg-red-500 text-white py-2 rounded hover:bg-brandRedDark disabled:bg-gray-400"
                                        >
                                            {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/* Category listing bar — red bar with yellow line on top (Sathya brand) */}
            <div
              className="hidden sm:flex relative w-full min-h-[56px] items-center bg-[#d72828] shadow"
              style={{ borderTop: "4px solid #fbe002" }}
            >
                <div className="w-full relative">
                    <div className="relative">
                        <div className="flex justify-center overflow-x-auto scrollbar-hide">
                            <Swiper modules={[Navigation]} navigation={{ prevEl: ".custom-swiper-prev", nextEl: ".custom-swiper-next", }} spaceBetween={20} slidesPerView="auto" watchOverflow={true} className="pl-10 pr-14">
                                {categories.map((category) => (
                                    <SwiperSlide key={category._id} className="!w-auto">
                                        <div ref={(el) => (slideRefs.current[category._id] = el)} onMouseEnter={() => handleMouseEnter(category._id)} onMouseLeave={() => startHide(120)} className="px-5 py-2 flex flex-col items-center text-center" >
                                            <Link href={`/category/${category.category_slug}`} className="text-sm text-base text-white hover:text-[#fbe002] whitespace-nowrap" >
                                                {category.category_name} 
                                            </Link>
                                            
                                        </div>
                                    </SwiperSlide>
                                ))}
                                <SwiperSlide className="!w-[140px] overflow-visible flex justify-center">
  <Link
    href="/open-box"
    className="relative flex items-center justify-center h-[40px]"
  >
    <video
      src="/assets/open-box-video.mp4"
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      className="h-[110px] w-auto object-contain rounded pointer-events-none"
    />
  </Link>
</SwiperSlide>
                                <SwiperSlide className="!w-[140px] overflow-visible flex justify-center">
                                  <Link
                                    href="/loyalty"
                                    className="relative flex items-center justify-center h-[40px]"
                                    aria-label="Loyalty"
                                  >
                                    <Image
                                      src="/uploads/loyaltyIcon.png"
                                      alt="Loyalty"
                                      width={150}
                                      height={125}
                                      className="h-[125px] w-auto object-contain hover:opacity-90 transition-opacity"
                                      unoptimized
                                    />
                                  </Link>
                                </SwiperSlide>
 </Swiper>
  </div>
       </div>
            </div>
            </div>
              
{hoveredCategory && hoveredCategory.subcategories?.length > 0 && (
  <div
    ref={dropdownRef}
    className="fixed z-50 bg-white"
    style={{
      top: `${dropdownTop}px`,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'fit-content',
       minWidth: '800px', 
      maxWidth: '96vw',
      boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      minHeight: '420px',
    }}
    onMouseEnter={cancelHide}
    onMouseLeave={() => startHide(120)}
  >
    <style>{`
      .dd-sidebar::-webkit-scrollbar { display: none; }
      .dd-sidebar { -ms-overflow-style: none; scrollbar-width: none; }
      .dd-brands::-webkit-scrollbar { width: 3px; }
      .dd-brands::-webkit-scrollbar-thumb { background: #d72828; border-radius: 2px; }
      .dd-brands::-webkit-scrollbar-track { background: #f1f1f1; }
      .dd-sub-scroll { overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: #d72828 #f1f1f1; }
      .dd-sub-scroll::-webkit-scrollbar { width: 3px; }
      .dd-sub-scroll::-webkit-scrollbar-thumb { background: #d72828; border-radius: 2px; }
      .dd-sub-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
      .dd-child-link { display:block; font-size:13px; color:#374151; text-decoration:none; padding:5px 8px; border-radius:4px; white-space:nowrap; transition: color 0.1s, background 0.1s; }
      .dd-child-link:hover { color:#d72828; background:#FEF2F2; }
      .dd-brand-item { display:flex; align-items:center; justify-content:center; padding:5px 6px; border:none; border-radius:6px; text-decoration:none; transition: background 0.1s; }
      .dd-brand-item:hover { background:#FEF2F2; }
    `}</style>

    <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: '420px' }}>

      {/* ── LEFT SIDEBAR ── */}
      <div
        className="dd-sidebar"
        style={{
          width: '220px',
          flexShrink: 0,
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'stretch',
          background: '#fff',
        }}
      >
       <div style={{
  padding: '10px 16px',
  fontSize: '13px', fontWeight: 700, color: '#9B1B1B',
  letterSpacing: '0.04em', textTransform: 'uppercase',
  borderBottom: 'none', flexShrink: 0,
  paddingTop:"16px"
}}>
  Shop by Category
</div>

        <div className="dd-sidebar" style={{ flex: 1, overflowY: 'auto' }}>
          {[...hoveredCategory.subcategories]
            .sort((a, b) => alphaSortString(a.category_name, b.category_name))
            .map((sub) => {
              const isActive = activeSubCategory?._id === sub._id;
              return (
                <div
                  key={sub._id}
                  id={`dd-left-${sub._id}`}
                  onClick={() => {
                     setActiveSubCategory(sub);
                    const el = document.getElementById(`dd-left-${sub._id}`);
                    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                     }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',cursor: 'pointer',
                    background: isActive ? '#FEF2F2' : '#fff',
                    borderBottom: 'none',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {sub.icon_url ? (
                     <img   src={sub.icon_url} alt=""  style={{ width: 30, height: 30,  objectFit: 'contain',  flexShrink: 0, filter: isActive   ? 'invert(27%) sepia(95%) saturate(1200%) hue-rotate(204deg) brightness(95%) contrast(95%)'    : 'none',   transition: 'filter 0.15s', }}/>
                    ) : (
                      <div style={{
                        width: 20, height: 20, borderRadius: '4px',
                        background: '#FEE2E2', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '9px', color: '#d72828', fontWeight: 700 }}>
                          {(sub.category_name || '').charAt(0)}
                        </span>
                      </div>
                    )}
                 <Link
          href={`/category/${hoveredCategory.category_slug}/${sub.category_slug}`}
            style={{
                   fontSize: '13px',
                   fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#d72828' : '#9B1B1B',
                    textDecoration: 'none', lineHeight: 1.3,
                      }}
                  >
                   {sub.category_name}
                     </Link>
                  </div>
                  <FiChevronRight size={13} style={{ color: isActive ? '#d72828' : '#d1d5db', flexShrink: 0 }} />
                </div>
              );
            })}
            <div style={{ padding: '10px 16px' }}>
  <Link
    href={`/category/${hoveredCategory.category_slug}`}
    onClick={() => setHoveredCategory(null)}
    style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      fontSize: '13px', fontWeight: 600, color: '#d72828', textDecoration: 'none',
    }}
  >
    View All {hoveredCategory.category_name}
    <FiChevronRight size={13} />
  </Link>
</div>
        </div>
      </div>

      {/* ── RIGHT CONTENT AREA ── */}
      {(() => {
        const ROWS_VISIBLE = 9;
        const ROW_HEIGHT_PX = 28;
        const brands = hoveredCategory.brands || [];
        const navImgs = hoveredCategory?.navImage
          ? (typeof hoveredCategory.navImage === 'string'
              ? hoveredCategory.navImage.split(',').map(s => s.trim()).filter(Boolean)
              : Array.isArray(hoveredCategory.navImage) ? hoveredCategory.navImage : [])
          : [];
        const activeSub = activeSubCategory;
        // Children if any; otherwise brand names for that subcategory (e.g. Audio)
        const getSubListItems = (sub) => {
          const children = Array.isArray(sub?.subcategories) && sub.subcategories.length > 0
            ? [...sub.subcategories].sort((a, b) => alphaSortString(a.category_name, b.category_name))
            : [];
          if (children.length > 0) {
            return children.map((child) => ({
              key: child._id,
              label: child.category_name,
              href: `/category/${hoveredCategory.category_slug}/${sub.category_slug}/${child.category_slug}`,
              kind: 'child',
            }));
          }
          const subBrands = Array.isArray(sub?.brands) && sub.brands.length > 0
            ? sub.brands
            : brands;
          return [...subBrands]
            .sort((a, b) => alphaSortString(a.brand_name, b.brand_name))
            .map((brand) => ({
              key: brand._id || brand.brand_slug,
              label: brand.brand_name,
              href: `/category/brand/${hoveredCategory.category_slug}/${brand.brand_slug}`,
              kind: 'brand',
            }));
        };
        const renderListColumn = (items, key, opts = {}) => {
          const needsScroll = items.length > ROWS_VISIBLE;
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: '180px',
                maxWidth: '220px',
                borderRight: opts.showBorder ? '1px solid #e5e7eb' : 'none',
                paddingRight: opts.showBorder ? '16px' : '0',
                paddingLeft: opts.padLeft ? '16px' : '0',
                alignSelf: 'flex-start',
              }}
            >
              {opts.header}
              <div
                className={needsScroll ? 'dd-sub-scroll' : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: needsScroll ? `${ROWS_VISIBLE * ROW_HEIGHT_PX}px` : undefined,
                }}
              >
                {items.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setHoveredCategory(null)}
                    className="dd-child-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        };
        const renderBrands = () => brands.length > 0 && (
          <div style={{ marginTop: 'auto', paddingTop: '12px', paddingLeft: '196px', borderTop: '1px solid #e5e7eb', flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, color: '#9B1B1B',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px',
            }}>
              Top Brands
            </div>
            <div className="dd-brands" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(80px, 1fr))',
              gridTemplateRows: 'repeat(2, auto)',
              gap: '8px 16px',
              alignItems: 'center',
              justifyItems: 'start',
            }}>
              {[...brands]
                .sort((a, b) => alphaSortString(a.brand_name, b.brand_name))
                .slice(0, 10)
                .map((brand) => (
                  <Link
                    key={brand._id || brand.brand_slug}
                    href={`/category/brand/${hoveredCategory.category_slug}/${brand.brand_slug}`}
                    onClick={() => setHoveredCategory(null)}
                    className="dd-brand-item"
                  >
                    {brand.image ? (
                      <img
                        src={`/uploads/Brands/${brand.image}`}
                        alt={brand.brand_name}
                        style={{ height: '32px', maxWidth: '80px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <span
                      style={{
                        display: brand.image ? 'none' : 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#374151'
                      }}
                    >
                      {brand.brand_name}
                    </span>
                  </Link>
                ))}
              {brands.length > 10 && (
                <Link
                  href={`/category/${hoveredCategory.category_slug}`}
                  onClick={() => setHoveredCategory(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '5px 6px', fontSize: '11px', fontWeight: 600, color: '#d72828', textDecoration: 'none' }}
                >
                  +{brands.length - 10} more <FiChevronRight size={11} />
                </Link>
              )}
            </div>
          </div>
        );
        return (
          <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minHeight: '420px' }}>
            <div style={{ flex: 1, padding: '16px 20px', minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '420px' }}>
              {activeSub ? (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <>
                    <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: 'none' }}>
                      <Link
                        href={`/category/${hoveredCategory.category_slug}/${activeSub.category_slug}`}
                        onClick={() => setHoveredCategory(null)}
                        style={{
                          fontSize: '13px', fontWeight: 700, color: '#d72828',
                          textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}
                      >
                        {activeSub.category_name}
                      </Link>
                    </div>
                    {(() => {
                      const activeItems = getSubListItems(activeSub);
                      const otherSubs = [...hoveredCategory.subcategories]
                        .sort((a, b) => alphaSortString(a.category_name, b.category_name))
                        .filter((s) => s._id !== activeSub._id)
                        .slice(0, 3);
                      return (
                        <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                          {renderListColumn(activeItems, activeSub._id, {
                            showBorder: otherSubs.length > 0,
                            padLeft: false,
                          })}
                          {otherSubs.map((sub, idx) => {
                            const items = getSubListItems(sub);
                            return renderListColumn(items, sub._id, {
                              showBorder: idx < otherSubs.length - 1,
                              padLeft: true,
                              header: (
                                <Link
                                  href={`/category/${hoveredCategory.category_slug}/${sub.category_slug}`}
                                  onClick={() => setHoveredCategory(null)}
                                  style={{
                                    fontSize: '13px', fontWeight: 700, color: '#d72828',
                                    textDecoration: 'none', textTransform: 'uppercase',
                                    letterSpacing: '0.04em', marginBottom: '8px',
                                    paddingBottom: '6px', borderBottom: 'none',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {sub.category_name}
                                </Link>
                              ),
                            });
                          })}
                        </div>
                      );
                    })()}
                  </>
                </div>
              ) : (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <>
                    <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                      {[...hoveredCategory.subcategories]
                        .sort((a, b) => alphaSortString(a.category_name, b.category_name))
                        .slice(0, 4)
                        .map((sub, si, arr) => {
                          const items = getSubListItems(sub);
                          return renderListColumn(items, sub._id, {
                            showBorder: si < arr.length - 1,
                            padLeft: si > 0,
                            header: (
                              <Link
                                href={`/category/${hoveredCategory.category_slug}/${sub.category_slug}`}
                                onClick={() => setHoveredCategory(null)}
                                style={{
                                  display: 'block', fontSize: '13px', fontWeight: 700,
                                  color: '#9B1B1B', textDecoration: 'none',
                                  textTransform: 'uppercase', letterSpacing: '0.04em',
                                  marginBottom: '8px', paddingBottom: '6px',
                                  borderBottom: 'none',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {sub.category_name}
                              </Link>
                            ),
                          });
                        })}
                    </div>
                  </>
                </div>
              )}
              {renderBrands()}
            </div>
            {navImgs.length > 0 && (
              <div style={{
                flexShrink: 0, width: '250px', alignSelf: 'stretch',
                borderLeft: '1px solid #e5e7eb', overflow: 'hidden',
              }}>
                <Link
                  href={`/category/${hoveredCategory.category_slug}`}
                  onClick={() => setHoveredCategory(null)}
                  style={{ display: 'block', width: '100%', height: '100%' }}
                >
                  <img
                    src={navImgs[0]}
                    alt={hoveredCategory.category_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Link>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  </div>
)}
        </header>
        {/* DESKTOP SUGGESTIONS DROPDOWN */}
        {searchDropdownVisible && searchContext === 'desktop' && (
          <div
            ref={searchDropdownRef}
            className="hidden sm:flex flex-col fixed z-[80] bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden"
            style={{
              top: `${searchDropdownTop}px`,
              left: `${searchDropdownLeft}px`,
              width: `${searchDropdownWidth}px`,
              maxHeight: '500px'
            }}
            role="listbox"
            aria-label="Search product suggestions"
          >
            <div className="px-5 pt-3 pb-2 text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase select-none">
              Products
            </div>
            <div className="px-3 pb-3 overflow-y-auto custom-scrollbar space-y-2">
              {suggestions.length > 0
                ? suggestions.map(renderDesktopSuggestionItem)
                : (searchQuery.trim() && (
                    <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                    {/* Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-12 h-12 mb-3 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>

                    {/* Message */}
                    <p className="text-sm font-medium">No products found</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
                  </div>
                  ))
              }
            </div>
          </div>
        )}

        {dropdownOpen && userData && profileMenuPos && typeof document !== 'undefined' && createPortal(
          <div
            ref={profileDropdownRef}
            className={`bg-white rounded-xl shadow-xl border border-gray-100 ${
              profileMenuPos.isMobile ? 'w-40 rounded-md' : 'w-48 sm:w-56'
            }`}
            style={{
              position: 'fixed',
              top: profileMenuPos.top,
              right: profileMenuPos.right,
              zIndex: 9999,
            }}
          >
            {profileMenuPos.isMobile ? (
              <>
                {isAdmin && (
                  <Link href="/admin/dashboard" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 text-xs hover:bg-red-50">
                    Admin Panel
                  </Link>
                )}
                <Link href="/orders" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 text-xs hover:bg-red-50">
                  My Orders
                </Link>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-xs hover:bg-red-50">
                  Logout
                </button>
              </>
            ) : (
              <div className="py-2 px-2">
                {isAdmin && (
                  <Link href="/admin/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-brandRed text-white">
                      <FaUserShield className="w-3 h-3 sm:w-4 sm:h-4" />
                    </span>
                    Admin Panel
                  </Link>
                )}
                {isLoggedIn && (
                  <Link href="/loyalty" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-brandRed text-white">
                      🏆
                    </span>
                    Loyalty Points
                    <span className="ml-auto text-xs font-bold text-brandRed">{loyaltyPoints} pts</span>
                  </Link>
                )}
                <Link href="/orders" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-brandRed text-white">
                    <FaShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                  </span>
                  My Orders
                </Link>
                <hr className="my-2 border-gray-200" />
                <button onClick={handleLogout} className="flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-brandRed text-white">
                    <IoLogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  </span>
                  Logout
                </button>
              </div>
            )}
            
          </div>,
          document.body
        )}
      </>
    );
};
export default Header;