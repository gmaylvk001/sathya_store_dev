 "use client";
import { useState, useEffect, useRef } from "react";
import { useCart } from '@/context/CartContext';
import { ToastContainer, toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/AuthModal';
import { ga4BeginCheckout, ga4Purchase } from "@/utils/nextjs-event-tracking.js";
import { useModal } from "@/context/ModalContext";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY || '';
const IS_RAZORPAY_TEST_MODE = RAZORPAY_KEY.startsWith('rzp_test_');
const RAZORPAY_EMI_TEST_CARD = '5241 8100 0000 0000';

const BEA_CONTACT_PHONE = '9842344323';
const BEA_CONTACT_EMAIL = 'customercare@sathya.store';

const FloatInput = ({ label, name, type = 'text', required, readOnly, value, onChange, onBlur, error, inputMode, maxLength, showLock, hint }) => (
  <div>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        readOnly={readOnly}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`peer w-full border rounded-lg pt-5 pb-1.5 px-3 text-sm outline-none transition
          ${showLock ? 'pr-10' : ''}
          ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300'
            : 'border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-200'}`}
      />
      <label className={`absolute left-3 transition-all duration-150 pointer-events-none
        ${value ? 'top-1 text-[10px] text-gray-500' : 'top-3.5 text-sm text-gray-400'}`}>
        {label}{required && '*'}
      </label>
      {showLock && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
      )}
    </div>
    {hint && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
    {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
  </div>
);

// ─── Haversine distance (km) ────────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Delivery Type Component ─────────────────────────────────────────────────
const DeliveryOptions = ({
  formData, handleChange,
  isDeliverySaved, setIsDeliverySaved,
  stores, nearestStores, setNearestStores,
  selectedPickupStore, setSelectedPickupStore,
  cartItems,
}) => {
  const firstProduct = cartItems?.[0];
  const productLink = firstProduct
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/product/${firstProduct.productId || firstProduct.id}`
    : (typeof window !== 'undefined' ? window.location.href : '');
  const productMsg = firstProduct
    ? `Hi, I'd like to check availability for: ${firstProduct.name} - ${productLink}`
    : `Hi, I'd like to check product availability - ${productLink}`;

  const [loadingStores, setLoadingStores] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);
  const prevPincode = useRef('');

  // When postCode changes & store pickup selected → find nearest stores
  useEffect(() => {
    const pincode = formData.postCode;
    if (
      formData.deliveryType === 'store' &&
      pincode?.length === 6 &&
      pincode !== prevPincode.current
    ) {
      prevPincode.current = pincode;
      findNearestStores(pincode);
    }
  }, [formData.postCode, formData.deliveryType]);

const findNearestStores = async (pincode) => {
  setLoadingStores(true);
  try {
    const res = await fetch(`/api/pincode/check?pincode=${pincode}`);
    const data = await res.json();

    if (!data.success || !data.stores?.length) {
      setNearestStores(stores.slice(0, 3).map(s => ({ ...s, distanceKm: null })));
      return;
    }

    
    const matchedStores = data.stores;

    setNearestStores(matchedStores);
    setSelectedPickupStore(matchedStores[0]._id);
    handleChange({ target: { name: "selectedStore", value: matchedStores[0]._id } });

  } catch (err) {
    console.error("Pincode check error:", err);
    setNearestStores(stores.slice(0, 3).map(s => ({ ...s, distanceKm: null })));
  } finally {
    setLoadingStores(false);
  }
};

  const displayedStores = showAllStores ? nearestStores : nearestStores.slice(0, 3);

  return (
    <div className="mt-4">
      {/* Delivery Type Tabs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Home Delivery */}
        <label
          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
            ${formData.deliveryType === 'home'
              ? 'border-red-600 bg-red-50'
              : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <input
            type="radio"
            name="deliveryType"
            value="home"
            checked={formData.deliveryType === 'home'}
            onChange={handleChange}
            className="sr-only"
          />
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
            ${formData.deliveryType === 'home' ? 'bg-red-100' : 'bg-gray-100'}`}>
            <svg className={`w-5 h-5 ${formData.deliveryType === 'home' ? 'text-red-600' : 'text-gray-500'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p className={`text-sm font-medium ${formData.deliveryType === 'home' ? 'text-red-700' : 'text-gray-800'}`}>
              Home delivery
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Free delivery to your address</p>
          </div>
        </label>

        {/* Store Pickup */}
        <label
          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
            ${formData.deliveryType === 'store'
              ? 'border-red-600 bg-red-50'
              : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <input
            type="radio"
            name="deliveryType"
            value="store"
            checked={formData.deliveryType === 'store'}
            onChange={handleChange}
            className="sr-only"
          />
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
            ${formData.deliveryType === 'store' ? 'bg-red-100' : 'bg-gray-100'}`}>
            <svg className={`w-5 h-5 ${formData.deliveryType === 'store' ? 'text-red-600' : 'text-gray-500'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className={`text-sm font-medium ${formData.deliveryType === 'store' ? 'text-red-700' : 'text-gray-800'}`}>
              Store pickup
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Pick up from your nearest Sathya Stores showroom</p>
          </div>
        </label>
      </div>

      {/* Store Pickup → nearest stores */}
      {formData.deliveryType === 'store' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Nearest Sathya Stores (Store Pickup)
          </p>

          {loadingStores ? (
            <div className="flex items-center gap-2 py-3">
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Finding nearest stores…</span>
            </div>
          ) : nearestStores.length === 0 ? (
            <div className="text-sm text-gray-500 py-2">
              Enter your pincode above to find nearest stores.
            </div>
          ) : (
            <>
              {/* Top 3 stores side-by-side on desktop, stacked on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                {displayedStores.map((store) => {
                  const waLink = `https://wa.me/91${BEA_CONTACT_PHONE}?text=${encodeURIComponent(productMsg)}`;
                  const mailLink = `mailto:${BEA_CONTACT_EMAIL}?subject=${encodeURIComponent('Product availability check')}&body=${encodeURIComponent(productMsg)}`;
                  return (
                    <div
                      key={store._id}
                      className="rounded-lg p-3 border border-red-200 bg-white flex flex-col h-full min-h-[150px]"
                    >
                      <div className="flex-1 min-h-0">
                        <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">
                          {store.organisation_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">
                          {store.address || store.city}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-2 text-xs text-red-600
                          bg-red-100 px-2 py-0.5 rounded-full font-medium">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {store.distanceKm != null ? `${store.distanceKm.toFixed(1)} KM Away` : "Nearest store"}
                        </span>
                      </div>

                      <div className="mt-auto pt-3 border-t border-gray-100">
                        <p className="text-[10px] text-gray-500 flex items-center gap-2">
                          <span>Call and check the product availability</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                        <a href={`tel:${BEA_CONTACT_PHONE}`} title="Call store"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </a>
                        <a href={mailLink} title="Email store"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </a>
                        <a href={waLink} target="_blank" rel="noopener noreferrer" title="WhatsApp store"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
                          </svg>
                        </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {nearestStores.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllStores(v => !v)}
                  className="text-xs text-red-600 underline"
                >
                  {showAllStores
                    ? 'Show less'
                    : `View all ${nearestStores.length} stores ›`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Save and Continue */}
      {!isDeliverySaved && (
        <button
          type="button"
          onClick={() => {
            toast.success('Delivery method saved');
            setIsDeliverySaved(true);
          }}
          className="mt-4 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition"
        >
          Save and continue
        </button>
      )}

      {isDeliverySaved && (
        <button
          type="button"
          onClick={() => setIsDeliverySaved(false)}
          className="mt-3 text-sm text-red-600 underline hover:text-red-700"
        >
          Change delivery method
        </button>
      )}
    </div>
  );
};

// ─── Main CheckoutPage ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { openLiveDemoModal } = useModal();
  const { cartCount, updateCartCount } = useCart();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [nearestStores, setNearestStores] = useState([]);
  const [selectedPickupStore, setSelectedPickupStore] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);


  const [formData, setFormData] = useState({
    firstName: '', lastName: '', businessName: '',
    country: 'India', address: '', landmark: '',
    city: '', state: 'Tamilnadu', postCode: '',
    phonenumber: '', email: '', additionalInfo: '',
    deliveryType: 'home', selectedStore: '',
    needGstInvoice: false, gst_number: '',
  });

  const [isDeliverySaved, setIsDeliverySaved] = useState(false);
  const [useraddress, setUseraddress] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderSummary, setOrderSummary] = useState({ discount: 0, subtotal: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyToken, setLoyaltyToken] = useState('');
  const [pointsApplied, setPointsApplied] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [showPointsInput, setShowPointsInput] = useState(false);
  const [customPoints, setCustomPoints] = useState(0);
  const [maxUsablePoints, setMaxUsablePoints] = useState(0);
  const [touched, setTouched] = useState({});
  const [shippingMethod, setShippingMethod] = useState('standard');

  const extraCities = ["Ariyalur","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kanchipuram","Kanyakumari","Karur","Krishnagiri","Madurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Salem","Sivaganga","Thanjavur","Theni","Thoothukudi","Tirunelveli","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar","Singanallur","Sivananthapuram","Vadavalli","Annur","Mettupalayam","Thennur","Ariyamangalam","Komarapalayam","Kattur"];

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/store/get');
        const result = await res.json();
        if (result.success) setStores(result.data);
      } catch (err) { console.error('Fetch stores error:', err); }
    };
    fetchStores();
  }, []);

  useEffect(() => {
    const uniqueCities = [...new Set(stores.map(s => s.city))];
    // finalCities is derived in render
  }, [stores]);

  useEffect(() => {
    const buyNowData = localStorage.getItem('buyNowData');
    const checkoutData = localStorage.getItem('checkoutData');
     console.log("DEBUG raw checkoutData:", checkoutData);  
    let skipCartFetch = false;
    if (buyNowData) {
      const p = JSON.parse(buyNowData);
      setCartItems(p.cart.items);
      setOrderSummary({ discount: 0, subtotal: p.total || 0, total: p.total || 0 });
       setAppliedCoupon(p.coupon || null); 
      localStorage.setItem('checkoutData', JSON.stringify({ cart: p.cart,  coupon: appliedCoupon, discount: 0, subtotal: p.total || 0, total: p.total || 0 }));
      localStorage.removeItem('buyNowData');
      skipCartFetch = true;
    } else if (checkoutData) {
      const p = JSON.parse(checkoutData);
      
      setCartItems(p.cart.items);
      setOrderSummary({ discount: p.discount || 0, subtotal: p.subtotal || 0, total: p.total || 0 });
      setAppliedCoupon(p.coupon || null); 
      skipCartFetch = true;
    }
    fetchData(skipCartFetch);
  }, []);

  useEffect(() => {
    if (cartItems.length > 0 && orderSummary.total > 0) {
      ga4BeginCheckout({ items: cartItems, value: orderSummary.total });
    }
  }, [cartItems, orderSummary.total]);

  const fetchData = async (skipCartFetch = false) => {
    const token = localStorage.getItem('token');
    if (!token) { setShowAuthModal(true); setLoading(false); return; }
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.userId;
      if (!skipCartFetch) {
        const cartRes = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
        if (!cartRes.ok) throw new Error('Failed to fetch cart');
        const cartData = await cartRes.json();
        setCartItems(cartData.cart.items);
      }
      const addrRes = await fetch(`/api/useraddress?user_id=${userId}`);
      if (addrRes.ok) {
        try {
          const addrData = await addrRes.json();
          const addresses = addrData?.userAddress || [];
          setUseraddress(addresses);
          if (addresses.length > 0) {
            const addr = addresses[0];
            setFormData(prev => ({
              ...prev,
              firstName: addr.firstName || '', lastName: addr.lastName || '',
              country: 'India', address: addr.address || '',
              city: addr.city || '', state: addr.state || 'Tamilnadu',
              postCode: addr.postCode || '', phonenumber: addr.phonenumber || '',
              landmark: addr.landmark || '', email: addr.email || '',
              businessName: addr.businessName || '', additionalInfo: addr.additionalInfo || '',
            }));
            setSelectedAddress(0);
          }
        } catch (parseErr) {
          setUseraddress([]);
        }
      }
    } catch (err) {
      console.error('fetchData error:', err);
      toast.error('Failed to load checkout data');
    } finally {
      try {
        const token = localStorage.getItem('token');
        const authRes = await fetch('/api/auth/check', { headers: { Authorization: `Bearer ${token}` } });
        const authData = await authRes.json();
        if (authData.phone) {
          setUserPhone(authData.phone);
          const loyaltyRes = await fetch(`/api/award-points?phone=${authData.phone}`);
          const loyaltyData = await loyaltyRes.json();
          if (loyaltyData.success) setLoyaltyBalance(loyaltyData.points);
        }
      } catch (e) { console.error('Loyalty fetch failed:', e); }
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (selectedAddress !== null) {
      setUseraddress(prev => {
        const updated = [...prev];
        updated[selectedAddress] = { ...updated[selectedAddress], [name]: value };
        return updated;
      });
    }
    // Visual-only convenience: when switching to store pickup, surface "Pay at store" as the
    // highlighted payment option to match the in-store collection flow shown in the design.
    if (name === 'deliveryType') {
      if (value === 'store') {
        setPaymentMethod('pay_at_store');
        if (pointsApplied) handleRemovePoints();
      } else if (value === 'home' && paymentMethod === 'pay_at_store') {
        setPaymentMethod('online');
      }
    }
  };

  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
    if (method !== 'online' && method !== 'emi' && pointsApplied) handleRemovePoints();
  };

  const handleUseAllPoints = async () => {
    if (!userPhone || loyaltyBalance <= 0) { toast.error('No loyalty points available!'); return; }
    const maxByBill = Math.floor(orderSummary.total * 0.05);
    const max = Math.min(loyaltyBalance, maxByBill);
    setMaxUsablePoints(max);
    setCustomPoints(max);
    setShowPointsInput(true);
    setLoyaltyLoading(true);
    try {
      const res = await fetch('/api/validate-points?action=validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: userPhone, pointsToRedeem: loyaltyBalance, billTotal: orderSummary.total }),
      });
      const data = await res.json();
      if (data.isValid) {
        const discount = Math.min(data.redemptionAmount, orderSummary.total);
        setLoyaltyToken(data.token); setLoyaltyDiscount(discount); setPointsApplied(true);
        setOrderSummary(prev => ({ ...prev, total: Math.max(0, prev.total - discount) }));
        toast.success(`₹${discount} discount applied!`);
      } else {
        if (data.token) await fetch('/api/validate-points?action=cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: data.token }) });
        toast.error(data.errorMessage || 'Points redemption failed!');
      }
    } catch (e) { toast.error('Failed to apply points!'); } finally { setLoyaltyLoading(false); }
  };

  const handleApplyPoints = async () => {
    if (customPoints <= 0 || customPoints > maxUsablePoints) { toast.error(`Enter points between 1 and ${maxUsablePoints}`); return; }
    setLoyaltyLoading(true);
    try {
      const res = await fetch('/api/validate-points?action=validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: userPhone, pointsToRedeem: customPoints, billTotal: orderSummary.total }),
      });
      const data = await res.json();
      if (data.isValid) {
        const discount = Math.min(data.redemptionAmount, orderSummary.total);
        setLoyaltyToken(data.token); setLoyaltyDiscount(discount); setPointsApplied(true);
        setShowPointsInput(false);
        setOrderSummary(prev => ({ ...prev, total: Math.max(0, prev.total - discount) }));
        toast.success(`₹${discount} discount applied!`);
      } else {
        if (data.token) await fetch('/api/validate-points?action=cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: data.token }) });
        toast.error(data.errorMessage || 'Points redemption failed!');
      }
    } catch (e) { toast.error('Failed to apply points!'); } finally { setLoyaltyLoading(false); }
  };

  const handleRemovePoints = async () => {
    if (loyaltyToken) {
      try {
        await fetch('/api/validate-points?action=cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: loyaltyToken }) });
      } catch (e) { console.error('Token cancel failed:', e); }
    }
    setOrderSummary(prev => ({ ...prev, total: prev.total + loyaltyDiscount }));
    setLoyaltyDiscount(0); setLoyaltyToken(''); setPointsApplied(false);
  };

  const handleBlur = (e) => setTouched(prev => ({ ...prev, [e.target.name]: true }));

  const getFieldError = (name) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const postCodeRegex = /^[1-9][0-9]{5}$/;
    if (!touched[name]) return null;
    switch (name) {
      case 'firstName': return !formData.firstName ? 'First name is required' : null;
      case 'lastName': return !formData.lastName ? 'Last name is required' : null;
      case 'email': return !formData.email ? 'Email is required' : !emailRegex.test(formData.email) ? 'Enter a valid email' : null;
      case 'phonenumber': return !formData.phonenumber ? 'Phone is required' : !phoneRegex.test(formData.phonenumber) ? 'Enter a valid 10-digit number' : null;
      case 'country': return !formData.country ? 'Country is required' : null;
      case 'address': return !formData.address ? 'Address is required' : null;
      case 'city': return !formData.city ? 'City is required' : null;
      case 'postCode': return !formData.postCode ? 'Post code is required' : !postCodeRegex.test(formData.postCode) ? 'Enter a valid 6-digit postal code' : null;
      default: return null;
    }
  };

  const initializeRazorpay = async () => await loadRazorpay();

  const createRazorpayOrder = async (amount) => {
    const res = await fetch('/api/create-razorpay-order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount * 100 }),
    });
    return await res.json();
  };

  const handleOnlinePayment = async (totalAmount, isEmi = false) => {
    if (isEmi && totalAmount < 3000) {
      toast.error('EMI is available for orders of ₹3,000 and above.');
      setIsSubmitting(false);
      throw new Error('EMI minimum amount not met');
    }

    const razorpayLoaded = await initializeRazorpay();
    if (!razorpayLoaded) { toast.error('Razorpay SDK failed to load'); setIsSubmitting(false); return; }
    const orderResponse = await createRazorpayOrder(totalAmount);
    const { order } = orderResponse;
    return new Promise((resolve, reject) => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY,
        amount: order.amount, currency: 'INR', name: 'Sathya Stores',
        description: isEmi ? 'EMI Payment' : 'Product Purchase', order_id: order.id,
        handler: async (response) => {
          try {
            const verificationRes = await fetch('/api/verify-payment', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verificationData = await verificationRes.json();
            if (verificationRes.ok) {
              resolve({
                paymentId: response.razorpay_payment_id,
                status: 'paid',
                mode: isEmi || verificationData.isEmiPayment ? 'EMI' : 'online',
              });
            } else reject(new Error('Payment verification failed'));
          } catch (err) { reject(err); }
        },
        prefill: { name: `${formData.firstName} ${formData.lastName}`, email: formData.email, contact: formData.phonenumber },
        theme: { color: '#dc2626' },
        modal: { ondismiss: () => { setIsSubmitting(false); reject(new Error('Payment window closed')); } },
      };

      if (isEmi) {
        if (IS_RAZORPAY_TEST_MODE) {
          toast.info(
            `Test mode: choose Card in Razorpay and use EMI test card ${RAZORPAY_EMI_TEST_CARD} (any CVV & future expiry).`,
            { autoClose: 12000 },
          );
          options.description = 'EMI test payment';
          options.config = {
            display: {
              sequence: ['card'],
              preferences: { show_default_blocks: true },
            },
          };
        } else {
          options.config = {
            display: {
              sequence: ['emi', 'card', 'netbanking', 'upi', 'wallet'],
              preferences: { show_default_blocks: true },
            },
          };
        }
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      razorpay.on('payment.failed', (response) => { setIsSubmitting(false); reject(new Error(response.error.description)); });
    });
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = cartItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  const warrantyTotal = cartItems.reduce((sum, item) => sum + (item.warrantyData?.price || 0), 0);
  const selectedWarrantyYears = cartItems
    .map((item) => Number(item.warrantyData?.year) || 0)
    .filter((year) => year > 0);
  const selectedWarrantyYear = selectedWarrantyYears.length
    ? Math.max(...selectedWarrantyYears)
    : null;
  const warrantyBadgeLabel = selectedWarrantyYear
    ? `${selectedWarrantyYear} year${selectedWarrantyYear > 1 ? "s" : ""} warranty`
    : "Brand warranty";

  const mrpTotal = cartItems.reduce((sum, item) => sum + ((item.actual_price ?? item.price ?? 0) * item.quantity), 0);
 const itemDiscountTotal = cartItems.reduce((sum, item) => {
  const mrp = (item.actual_price ?? item.price ?? 0) * item.quantity;
  const selling = (item.price > 0 ? item.price : item.actual_price) * item.quantity;
  return sum + (mrp - selling);
}, 0);
const sellingPrice = mrpTotal - itemDiscountTotal;

  const uniqueCities = [...new Set(stores.map(s => s.city))];
  const finalCities = [...new Set([...uniqueCities, ...extraCities])].sort();

  const handleSubmit = async (e) => {
    e?.preventDefault();
   
    if (isSubmitting) return;
    setError('');
    console.log("Applied coupon at order time:", appliedCoupon); 
    try {
      const token = localStorage.getItem('token');
      if (!token) { setShowAuthModal(true); return; }
      const decoded = jwtDecode(token);
      const userId = decoded.userId;
      const addressData = useSavedAddress && selectedAddress !== null
        ? { ...useraddress[selectedAddress], state: useraddress[selectedAddress].state || 'Tamilnadu', country: 'India' }
        : { ...formData, state: formData.state || 'Tamilnadu', country: 'India' };

      if (!useSavedAddress || selectedAddress === null) {
        setTouched({ firstName: true, lastName: true, email: true, phonenumber: true, country: true, address: true, city: true, postCode: true });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10}$/;
        const postCodeRegex = /^[0-9]{4,6}$/;
        if (!addressData.firstName || !addressData.lastName || !addressData.email || !addressData.phonenumber || !addressData.postCode || !addressData.state) { toast.error('Please fill in all required fields.'); return; }
        if (!emailRegex.test(addressData.email)) { toast.error('Please enter a valid email address.'); return; }
        if (!phoneRegex.test(addressData.phonenumber)) { toast.error('Please enter a valid 10-digit phone number.'); return; }
        if (!postCodeRegex.test(addressData.postCode)) { toast.error('Please enter a valid postal code.'); return; }
      }

      if (formData.needGstInvoice && !formData.gst_number?.trim()) {
        setTouched((prev) => ({ ...prev, gst_number: true }));
        toast.error('Please enter your GST number.');
        return;
      }

      const gstNumber = formData.needGstInvoice ? formData.gst_number.trim().toUpperCase() : '';

      setIsSubmitting(true);
      const totalAmount = orderSummary.total;
      let savedAddressId = null;

      if (!useSavedAddress || selectedAddress === null) {
        const formDataToSend = new FormData();
        formDataToSend.append('userId', userId);
        formDataToSend.append('firstname', addressData.firstName);
        formDataToSend.append('lastName', addressData.lastName);
        formDataToSend.append('businessName', addressData.businessName || '');
        formDataToSend.append('country', addressData.country);
        formDataToSend.append('email', addressData.email);
        formDataToSend.append('address', addressData.address);
        formDataToSend.append('postCode', addressData.postCode);
        formDataToSend.append('city', addressData.city);
        formDataToSend.append('state', addressData.state);
        formDataToSend.append('landmark', addressData.landmark || '');
        formDataToSend.append('phonenumber', addressData.phonenumber);
        formDataToSend.append('additionalInfo', addressData.additionalInfo || '');
        formDataToSend.append('gst_number', gstNumber);
        const addressRes = await fetch('/api/useraddress/add', { method: 'POST', body: formDataToSend });
        if (!addressRes.ok) throw new Error('Failed to save address');
        const newAddressData = await addressRes.json();
        setUseraddress(prev => [...prev, newAddressData.userAddress]);
        savedAddressId = newAddressData.userAddress?._id;
      }

      const deliveryAddress = [
        addressData.address, addressData.landmark,
        addressData.businessName, addressData.city,
        addressData.state, addressData.country, addressData.postCode,
      ].filter(Boolean).join(', ');

      const comments = useSavedAddress && selectedAddress !== null
        ? (useraddress[selectedAddress]?.additionalInfo || '')
        : (addressData.additionalInfo || '');

      const pickupStoreName = formData.deliveryType === 'store'
        ? stores.find(s => s._id === formData.selectedStore)?.organisation_name
        : undefined;

      let order_number = 'ORD' + Date.now();
      let paymentId = '', paymentStatus = '', paymentMode = '';

      if (paymentMethod === 'Cash on Delivery') {
        paymentId = 'COD_' + Date.now(); paymentStatus = 'pending'; paymentMode = 'Cash on Delivery';
      } else if (paymentMethod === 'pay_at_store') {
        paymentId = 'PAS_' + Date.now(); paymentStatus = 'pending'; paymentMode = 'Pay at Store';
      } else if (paymentMethod === 'online' || paymentMethod === 'emi') {
        try {
         const orderRes = await fetch('/api/orders/add', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    user_adddeliveryid: useSavedAddress && selectedAddress !== null ? useraddress[selectedAddress]._id : savedAddressId || useraddress[0]?._id,
    order_username: `${addressData.firstName} ${addressData.lastName}`,
    order_phonenumber: addressData.phonenumber, email_address: addressData.email,
    order_item: cartItems.map(item => ({ ...item, warrantyData: item.warrantyData || null, store_id: formData.deliveryType === 'store' ? formData.selectedStore : null, coupondetails: Array.isArray(item.coupondetails) && item.coupondetails.length > 0 ? item.coupondetails.map(c => c.offer_code || String(c)) : [] })),
    order_amount: totalAmount, order_deliveryaddress: deliveryAddress,
      loyalty_points_redeemed: pointsApplied ? customPoints : 0,
       loyalty_discount: loyaltyDiscount || 0,
       loyalty_redemption_token: loyaltyToken || '',
      promotion_code_applied: appliedCoupon?.offer_code || null,
      promotion_discount_applied: appliedCoupon ? (orderSummary.discount || 0) : 0,
    
    customer_comments: comments, payment_method: paymentMethod, payment_type: paymentMode,
    order_status: 'pending',
    delivery_type: formData.deliveryType === 'store' ? 'store_pickup' : 'home',
    pickup_store: pickupStoreName,
    store_id: formData.deliveryType === 'store' ? formData.selectedStore : null,
    gst_number: gstNumber,
    payment_id: '', payment_status: 'payment_initialized', 
    order_number: order_number || 'ORD' + Date.now(),
    order_details: cartItems.map(item => ({ item_code: `ITEM${item.item_code}`, product_id: item.id, product_name: item.name, product_price: item.price, model: 'N/A', user_id: userId, coupondiscount: 0, created_at: new Date(), updated_at: new Date(), quantity: item.quantity, store_id: formData.deliveryType === 'store' ? formData.selectedStore : 'STORE01', orderNumber: 'ORD' + Date.now() })),
  }),
});
          const orderData = await orderRes.json();
          order_number = orderData?.order?.order_number;
          let result = await handleOnlinePayment(totalAmount, paymentMethod === 'emi');
          paymentId = result.paymentId; paymentStatus = result.status; paymentMode = result.mode;
        } catch (error) { toast.error(`Payment failed: ${error.message}`); setIsSubmitting(false); return; }
      }

      if (loyaltyToken && pointsApplied) {
        try {
          await fetch('/api/validate-points?action=redeem', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: loyaltyToken, orderNumber: order_number }),
          });
        } catch (e) { console.error('Points redeem failed:', e); }
      }

      const paymentRes = await fetch('/api/payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, payment_mode: paymentMode, status: paymentStatus, modevalue: totalAmount, payment_id: paymentId, payment_Date: new Date() }),
      });
      if (!paymentRes.ok) throw new Error('Payment processing failed');
      const paymentData = (await paymentRes.json()).paymentData;

      const orderRes = await fetch('/api/orders/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_adddeliveryid: useSavedAddress && selectedAddress !== null ? useraddress[selectedAddress]._id : savedAddressId || useraddress[0]?._id,
          order_username: `${addressData.firstName} ${addressData.lastName}`,
          order_phonenumber: addressData.phonenumber, email_address: addressData.email,
          order_item: cartItems.map(item => ({ ...item, warrantyData: item.warrantyData || null, store_id: formData.deliveryType === 'store' ? formData.selectedStore : null, coupondetails: Array.isArray(item.coupondetails) && item.coupondetails.length > 0 ? item.coupondetails.map(c => c.offer_code || String(c)) : [] })),
          order_amount: totalAmount, order_deliveryaddress: deliveryAddress,
              loyalty_points_redeemed: pointsApplied ? customPoints : 0,
          loyalty_discount: loyaltyDiscount || 0,
           loyalty_redemption_token: loyaltyToken || '',
         promotion_code_applied: appliedCoupon?.offer_code || null,
          promotion_discount_applied: appliedCoupon ? (orderSummary.discount || 0) : 0,

          customer_comments: comments, payment_method: paymentMethod, payment_type: paymentMode,
          order_status: 'pending',
          delivery_type: formData.deliveryType === 'store' ? 'store_pickup' : 'home',
          pickup_store: pickupStoreName,
          store_id: formData.deliveryType === 'store' ? formData.selectedStore : null,
          gst_number: gstNumber,
          payment_id: paymentData.payment_id, payment_status: paymentData.status,
          order_number: order_number || 'ORD' + Date.now(),
          order_details: cartItems.map(item => ({ item_code: `ITEM${item.item_code}`, product_id: item.id, product_name: item.name, product_price: item.price, model: 'N/A', user_id: userId, coupondiscount: 0, created_at: new Date(), updated_at: new Date(), quantity: item.quantity, store_id: formData.deliveryType === 'store' ? formData.selectedStore : 'STORE01', orderNumber: 'ORD' + Date.now() })),
        }),
      });
      if (!orderRes.ok) throw new Error('Order creation failed');

      const cartDelete = await fetch('/api/cart', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ clearAll: true }),
      });

      if (cartDelete.status === 401) { localStorage.removeItem('token'); router.push('/login'); return; }

      if (cartDelete.status === 200) {
        localStorage.removeItem('checkoutData'); localStorage.removeItem('appliedCoupon');
        const orderData = await orderRes.json();
        ga4Purchase({ orderId: orderData.order.order_number, value: orderSummary.total, items: cartItems });

        // Earn loyalty points (online only) — not COD / Pay at Store / EMI
        if (paymentMode === 'online') {
          try {
            const loyaltyRes = await fetch('/api/award-points', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber: userPhone, orderNumber: order_number, orderAmount: totalAmount, firstName: addressData.firstName, lastName: addressData.lastName, email: addressData.email, cartItems, loyaltyPointsRedeemedAmount: loyaltyDiscount || 0, loyaltyPointsRedeemedCode: loyaltyToken || '', paymentMode, promotionCode: appliedCoupon?.offer_code || '', promotionDiscount: appliedCoupon ? (orderSummary.discount || 0) : 0, }),
            });
            const loyaltyData = await loyaltyRes.json();
            if (loyaltyData.success && loyaltyData.points_awarded > 0) {
              toast.success(`You earned ${loyaltyData.points_awarded} loyalty points!`, { autoClose: 5000 });
              window.dispatchEvent(new CustomEvent('loyaltyPointsUpdated'));
            }
          } catch (e) { console.error('Loyalty award failed:', e); }
        }

        // SAP sync disabled for live — uncomment to send order data to SAP
        await fetch('/api/send-order-detail-to-sap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_number: orderData.order.order_number }),
        });

        try {
          const name = `${addressData.firstName} ${addressData.lastName}`;
          const orderDate = new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          const adminEmails = [
            "arunkarthik@sathya.store",
            "ecom@sathya.store",
            "itadmin@sathya.store",
            "telemarketing@sathya.store",
            "sekarcorp@sathya.store",
            "abu@sathya.store",
            "customercare@sathya.store",
          ];

          const emailRes = await fetch("/api/send-order-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerEmail: addressData.email,
              adminEmails,
              orderDetails: {
                order_id: String(orderData.order._id || ""),
                order_username: name,
                order_number: orderData.order.order_number,
                order_amount: orderData.order.order_amount,
                payment_method: orderData.order.payment_method,
                order_deliveryaddress: deliveryAddress,
                order_phonenumber: addressData.phonenumber,
                order_date: orderDate,
                order_item: cartItems.map((item) => ({
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  image: item.image || item.images?.[0],
                  warrantyData: item.warrantyData || null,
                })),
              },
            }),
          });
          if (!emailRes.ok) {
            console.error("Order email failed:", await emailRes.json().catch(() => ({})));
          }
        } catch (e) {
          console.error("Email sending failed:", e);
        }

        toast.success('Order placed successfully!');
        updateCartCount(0);
        router.push('/orders');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Loading checkout…</p>
        </div>
      </div>
    );
  }

  // ─── Price summary helpers ─────────────────────────────────────────────────
  const productPrice = orderSummary.subtotal + orderSummary.discount;
  const shippingCost = shippingMethod === 'express' ? 299 : 0;
  const finalTotal = orderSummary.total + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50/40 text-gray-900 font-sans pb-16">
      {/* ── Top Step Progress Header ────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200/80 mb-6 py-4 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <a href="/cart" className="text-gray-500 hover:text-[#d72828] transition-colors flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              <span>Back to Cart</span>
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-[#d72828] font-extrabold">Secure Checkout</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-400">
            <span className="text-[#d72828] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#d72828] text-white flex items-center justify-center text-[10px]">1</span>
              Contact & Delivery
            </span>
            <span className="text-gray-300">→</span>
            <span className={isDeliverySaved ? "text-[#d72828] flex items-center gap-1.5" : "flex items-center gap-1.5"}>
              <span className={`w-5 h-5 rounded-full ${isDeliverySaved ? 'bg-[#d72828] text-white' : 'bg-gray-200 text-gray-600'} flex items-center justify-center text-[10px]`}>2</span>
              Method
            </span>
            <span className="text-gray-300">→</span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]">3</span>
              Payment & Order
            </span>
          </div>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* ══ LEFT — Form ═══════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[58%] lg:pr-4">

            {/* 1. Contact Details */}
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Contact details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FloatInput label="Phone number" name="phonenumber" type="tel" required
                    value={formData.phonenumber} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('phonenumber')} />
                  {formData.phonenumber?.length === 10 && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      We'll keep you updated on your order
                    </p>
                  )}
                </div>
                <FloatInput label="Email address" name="email" type="email" required
                  value={formData.email} onChange={handleChange} onBlur={handleBlur}
                  error={getFieldError('email')} />
              </div>
            </section>

            {/* 2. Delivery Options */}
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Delivery options
              </h2>

              <DeliveryOptions
                formData={formData}
                handleChange={handleChange}
                isDeliverySaved={isDeliverySaved}
                setIsDeliverySaved={setIsDeliverySaved}
                stores={stores}
                nearestStores={nearestStores}
                setNearestStores={setNearestStores}
                selectedPickupStore={selectedPickupStore}
                setSelectedPickupStore={setSelectedPickupStore}
                cartItems={cartItems}
              />

              {/* Delivery address — shown when home delivery */}
              {formData.deliveryType === 'home' && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FloatInput label="First name" name="firstName" required
                      value={formData.firstName} onChange={handleChange} onBlur={handleBlur}
                      error={getFieldError('firstName')} />
                    <FloatInput label="Last name" name="lastName" required
                      value={formData.lastName} onChange={handleChange} onBlur={handleBlur}
                      error={getFieldError('lastName')} />
                  </div>
                  <FloatInput label="Company name (optional)" name="businessName"
                    value={formData.businessName} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('businessName')} />
                  <FloatInput label="House number and street name" name="address" required
                    value={formData.address} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('address')} />
                  <FloatInput label="Landmark, suite, unit, etc. (optional)" name="landmark"
                    value={formData.landmark} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('landmark')} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FloatInput label="State" name="state" readOnly
                      value={formData.state} onChange={handleChange} onBlur={handleBlur}
                      error={getFieldError('state')} />
                    <div className="relative">
                      <select
                        name="city" value={formData.city}
                        onChange={handleChange} onBlur={handleBlur}
                        className={`peer w-full border rounded-lg pt-5 pb-1.5 px-3 text-sm outline-none transition appearance-none bg-white
                          ${getFieldError('city') ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-[#d72828]'}`}
                      >
                        <option value="" disabled hidden />
                        {finalCities.map((city, i) => <option key={i} value={city}>{city}</option>)}
                      </select>
                      <label className={`absolute left-3 transition-all duration-150 pointer-events-none
                        ${formData.city ? 'top-1 text-[10px] text-gray-500' : 'top-3.5 text-sm text-gray-400'}`}>
                        City*
                      </label>
                      {getFieldError('city') && <p className="text-red-500 text-xs mt-0.5">{getFieldError('city')}</p>}
                    </div>
                    <FloatInput label="Pincode" name="postCode" required
                      value={formData.postCode} onChange={handleChange} onBlur={handleBlur}
                      error={getFieldError('postCode')}
                      inputMode="numeric" maxLength={6} />
                  </div>
                  <FloatInput label="Country" name="country" required readOnly showLock
                    value={formData.country || 'India'} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('country')}
                    hint="Only available for delivery within India" />
                  <FloatInput label="Phone" name="phonenumber" type="tel" required
                    value={formData.phonenumber} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('phonenumber')} />
                </div>
              )}

              {/* Store pickup — full address block (matches design) */}
              {formData.deliveryType === 'store' && (
                <div className="mt-4 space-y-3">
                  <FloatInput label="Full Name" name="firstName" required
                    value={formData.firstName} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('firstName')} />
                  <FloatInput label="Address" name="address" required
                    value={formData.address} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('address')} />
                  <FloatInput label="Landmark (Optional)" name="landmark"
                    value={formData.landmark} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('landmark')} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FloatInput label="State" name="state" readOnly
                      value={formData.state} onChange={handleChange} onBlur={handleBlur}
                      error={getFieldError('state')} />
                    <div className="relative">
                      <select
                        name="city" value={formData.city}
                        onChange={handleChange} onBlur={handleBlur}
                        className={`peer w-full border rounded-lg pt-5 pb-1.5 px-3 text-sm outline-none transition appearance-none bg-white
                          ${getFieldError('city') ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-[#d72828]'}`}
                      >
                        <option value="" disabled hidden />
                        {finalCities.map((city, i) => <option key={i} value={city}>{city}</option>)}
                      </select>
                      <label className={`absolute left-3 transition-all duration-150 pointer-events-none
                        ${formData.city ? 'top-1 text-[10px] text-gray-500' : 'top-3.5 text-sm text-gray-400'}`}>
                        City*
                      </label>
                      {getFieldError('city') && <p className="text-red-500 text-xs mt-0.5">{getFieldError('city')}</p>}
                    </div>
                    <FloatInput label="Pincode" name="postCode" required
                      value={formData.postCode} onChange={handleChange} onBlur={handleBlur}
                      error={getFieldError('postCode')}
                      inputMode="numeric" maxLength={6} />
                  </div>
                  <FloatInput label="Country" name="country" required readOnly showLock
                    value={formData.country || 'India'} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('country')}
                    hint="Only available for delivery within India" />
                  <FloatInput label="Phone" name="phonenumber" type="tel" required
                    value={formData.phonenumber} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('phonenumber')} />
                </div>
              )}

              {/* GST invoice (optional) — after delivery address inputs */}
              <div className="mt-4">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-gray-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.needGstInvoice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        needGstInvoice: e.target.checked,
                        gst_number: e.target.checked ? prev.gst_number : '',
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800">
                      Need a GST Invoice?{' '}
                      <span className="font-normal text-gray-500">(optional)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tick to add your GST details and get a business invoice
                    </p>
                  </div>
                </label>
                {formData.needGstInvoice && (
                  <div className="mt-3">
                    <FloatInput
                      label="GST number"
                      name="gst_number"
                      required
                      value={formData.gst_number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.gst_number && !formData.gst_number?.trim()
                          ? 'GST number is required'
                          : null
                      }
                      maxLength={15}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* 3. Shipping Method */}
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                Shipping method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'standard', label: 'Standard delivery', sub: '3–5 working days', price: 'FREE', free: true },
                  { value: 'express', label: 'Express delivery', sub: '1–2 working days', price: '₹299', free: false, disabled: true  },
                ].map(opt => (
                <label key={opt.value}
  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all
    ${opt.disabled ? 'cursor-not-allowed opacity-50 border-gray-200 bg-gray-50' : shippingMethod === opt.value ? 'cursor-pointer border-red-600 bg-red-50' : 'cursor-pointer border-gray-200 bg-white hover:border-gray-300'}`}
>
  <input type="radio" name="shippingMethod" value={opt.value}
    checked={shippingMethod === opt.value}
    onChange={() => !opt.disabled && setShippingMethod(opt.value)}
    disabled={opt.disabled}
    className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                      ${shippingMethod === opt.value ? 'border-red-600' : 'border-gray-300'}`}>
                      {shippingMethod === opt.value && <div className="w-2 h-2 rounded-full bg-red-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                          ${opt.free ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {opt.price}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* 4. Payment Method */}
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                Payment method
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 'online', icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  ), label: 'Online payment', sub: 'UPI, Cards, Netbanking' },
                  { value: 'emi', icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  ), label: 'EMI options', sub: 'Easy EMI from leading banks' },
                  ...(formData.deliveryType !== 'store' ? [{ value: 'Cash on Delivery', icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ), label: 'Cash on delivery', sub: 'Pay when you receive' }] : []),
                  { value: 'pay_at_store', icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ), label: 'Pay at store', sub: 'Pay at the time of pickup' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePaymentChange(opt.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center
                      ${paymentMethod === opt.value
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <span className={paymentMethod === opt.value ? 'text-red-600' : 'text-gray-500'}>
                      {opt.icon}
                    </span>
                    <span className={`text-xs font-semibold ${paymentMethod === opt.value ? 'text-red-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-gray-400 leading-tight">{opt.sub}</span>
                  </button>
                ))}
              </div>
              {paymentMethod === 'emi' && IS_RAZORPAY_TEST_MODE && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold mb-1">Razorpay test mode — EMI testing</p>
                  <p>
                    A separate EMI tab is usually not shown in test mode. After you continue, select{' '}
                    <span className="font-semibold">Card</span> in Razorpay and pay with test card{' '}
                    <span className="font-mono font-semibold">{RAZORPAY_EMI_TEST_CARD}</span>{' '}
                    (any CVV, any future expiry). Order amount must be ₹3,000 or above.
                  </p>
                </div>
              )}
            </section>

            {/* Billing / Saved addresses */}
            {useraddress && useraddress.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base font-semibold text-gray-800 mb-3">Billing address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {useraddress.map((item, index) => (
                    <div
                      key={`addr-${index}`}
                      onClick={() => {
                        setSelectedAddress(index);
                        const addr = useraddress[index];
                        setFormData(prev => ({ ...prev, firstName: addr.firstName || '', lastName: addr.lastName || '', businessName: addr.businessName || '', country: 'India', address: addr.address || '', landmark: addr.landmark || '', city: addr.city || '', state: addr.state || 'Tamilnadu', postCode: addr.postCode || '', phonenumber: addr.phonenumber || '', email: addr.email || '', additionalInfo: addr.additionalInfo || '' }));
                      }}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all
                        ${selectedAddress === index ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.firstName} {item.lastName}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.address}</p>
                          <p className="text-xs text-gray-500">{item.city}, {item.state}, {item.postCode}</p>
                          <p className="text-xs text-gray-500">{item.phonenumber}</p>
                        </div>
                        {selectedAddress === index && (
                          <span className="text-orange-500 text-xs font-medium flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setUseSavedAddress(!useSavedAddress)}
                  className="mt-3 text-sm text-orange-500 underline"
                >
                  {useSavedAddress ? 'Use new address instead' : 'Use saved address'}
                </button>
              </section>
            )}

            {/* Comments */}
            <section className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Comments (optional)</h3>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                placeholder="Notes about your order"
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 resize-none"
              />
            </section>

            {/* Policy links */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-red-600 mb-6">
              {[['Privacy Policy', '/privacypolicy'], ['Terms & Conditions', '/terms-and-condition'], ['Shipping Policy', '/shipping'], ['Cancellation & Refund Policy', '/cancellation-refund-policy']].map(([label, href]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-red-800">{label}</a>
              ))}
            </div>

            {/* Safe bar */}
            <div className="flex items-center gap-2 py-3 border-t text-xs text-gray-400">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Safe and secure checkout. Your data is 100% protected.
            </div>
          </div>

          {/* ══ RIGHT — Order Summary ═════════════════════════════════════════ */}
          <div className="w-full lg:w-[40%] xl:w-[38%] lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">

              {/* Order Summary Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Order Summary</h2>
                  <span className="text-[11px] font-bold text-[#d72828] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                    {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} items
                  </span>
                </div>
                <a href="/cart" className="text-xs font-bold text-[#d72828] hover:text-[#b91c1c] transition-colors flex items-center gap-1">
                  <span>Edit cart</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </a>
              </div>
              {/* Cart items list (Luxury Card System) */}
              <div className="max-h-72 overflow-y-auto p-4 space-y-2.5 border-b border-gray-100 scrollbar-hide bg-gray-50/30">
                {cartItems.map((item) => {
                  const imgSrc = item.image
                    ? (item.image.startsWith("http") ? item.image : item.image.startsWith("/") ? item.image : `/uploads/products/${item.image}`)
                    : (item.images?.[0] ? (item.images[0].startsWith("http") ? item.images[0] : `/uploads/products/${item.images[0]}`) : "/uploads/sathyalogo.webp");

                  const itemPrice = (item.price > 0 ? item.price : item.actual_price) * item.quantity;

                  return (
                    <div
                      key={`oi-${item.productId}`}
                      className="flex items-center gap-3.5 p-3 rounded-xl bg-white border border-gray-200/80 shadow-2xs hover:border-red-200/80 hover:shadow-xs transition-all duration-200 group"
                    >
                      {/* Image Frame */}
                      <div className="relative w-16 h-16 flex-shrink-0 border border-gray-200/80 rounded-lg overflow-hidden bg-white p-1.5 flex items-center justify-center">
                        <img
                          src={imgSrc}
                          alt={item.name}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/uploads/sathyalogo.webp"; }}
                        />
                        <span className="absolute -top-1 -right-1 bg-[#d72828] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-2xs border border-white">
                          {item.quantity}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#d72828] transition-colors">
                          {item.name}
                        </h4>
                        
                        {item.warrantyData && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                            <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {item.warrantyData.year}yr Warranty
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-sm font-black text-gray-900 whitespace-nowrap text-right">
                        ₹{itemPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sold by Sathya Stores */}
              <div className="px-5 py-3 border-b border-gray-100 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-xs font-bold text-gray-800">Sathya Stores</span>
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-100/80 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                  <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Authorized Partner
                </span>
              </div>

              {/* Price details */}
              <div className="px-5 py-4 border-b border-gray-200 space-y-2">
             <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Price details</p>

{/* MRP */}
<div className="flex justify-between text-sm text-gray-700">
  <span>product price</span>
  <span>₹{mrpTotal.toLocaleString('en-IN')}</span>
</div>

{/* Item discount (MRP - selling) */}
{itemDiscountTotal > 0 && (
  <div className="flex justify-between text-sm text-green-600">
    <span>Discount</span>
    <span>−₹{itemDiscountTotal.toLocaleString('en-IN')}</span>
  </div>
)}


{/* Warranty */}
{warrantyTotal > 0 && (
  <div className="flex justify-between text-sm">
    <span className="flex items-center gap-1 text-purple-700">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      {cartItems.find(i => i.warrantyData)?.warrantyData?.name || 'Extended warranty'}
    </span>
    <span className="text-red-600 font-medium">₹{warrantyTotal.toLocaleString('en-IN')}</span>
  </div>
)}
{cartItems.some(item => item.warranty > 0) && (
  <div className="flex justify-between text-sm">
    <span className="text-purple-700">Sathya Stores Care warranty</span>
    <span className="text-red-600 font-medium">
      ₹{cartItems.reduce((s, i) => s + (i.warranty || 0), 0).toLocaleString('en-IN')}
    </span>
  </div>
)}

{/* Subtotal */}
<div className="flex justify-between text-sm text-gray-700 font-medium border-t border-gray-100 pt-2">
  <span>Subtotal</span>
  <span>₹{orderSummary.subtotal.toLocaleString('en-IN')}</span>
</div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Delivery</span>
                  {shippingCost === 0
                    ? <span className="text-green-600 font-medium">FREE</span>
                    : <span>₹{shippingCost}</span>
                  }
                </div>

                {/* Loyalty points — online & EMI (earn only on non-EMI payments) */}
                {loyaltyBalance > 0 && (paymentMethod === 'online' || paymentMethod === 'emi') && (
                  <div className="border border-indigo-200 rounded-xl p-3 bg-indigo-50 mt-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17l3 3 3-3m-3-9v12M4 4h16v4a4 4 0 01-4 4H8a4 4 0 01-4-4V4z" />
                          </svg>
                          Loyalty points
                        </p>
                        <p className="text-[10px] text-gray-500">{loyaltyBalance} pts ≈ ₹{loyaltyBalance.toFixed(2)}</p>
                      </div>
                      {orderSummary.total >= 10000 ? (
                        <>
                          {!pointsApplied && !showPointsInput && (
                            <button onClick={handleUseAllPoints}
                              className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">
                              Use points
                            </button>
                          )}
                          {pointsApplied && (
                            <button onClick={handleRemovePoints}
                              className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 transition">
                              Remove
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-orange-500 font-medium">Min ₹10,000 order required</span>
                      )}
                    </div>
                    {orderSummary.total >= 10000 && showPointsInput && !pointsApplied && (
                      <div className="mt-3 bg-white rounded-lg p-3 border border-indigo-200">
                        <p className="text-[10px] text-gray-500 mb-2">Max <span className="font-semibold text-indigo-700">{maxUsablePoints} pts</span> (₹{maxUsablePoints})</p>
                        <div className="flex gap-2">
                          <input type="number" min={1} max={maxUsablePoints} value={customPoints}
                            onChange={(e) => setCustomPoints(Math.min(Number(e.target.value), maxUsablePoints))}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400" />
                          <button onClick={handleApplyPoints} disabled={loyaltyLoading}
                            className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition">
                            {loyaltyLoading ? '…' : 'Apply'}
                          </button>
                          <button onClick={() => setShowPointsInput(false)}
                            className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                            Cancel
                          </button>
                        </div>
                        <input type="range" min={1} max={maxUsablePoints} value={customPoints} step={1}
                          onChange={(e) => setCustomPoints(Number(e.target.value))}
                          className="w-full mt-2 accent-indigo-600" />
                        <p className="text-[10px] text-gray-400 mt-1">Discount: ₹{customPoints} off</p>
                      </div>
                    )}
                    {pointsApplied && (
                      <p className="text-green-600 text-xs mt-2 font-semibold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ₹{loyaltyDiscount.toFixed(2)} discount applied!
                      </p>
                    )}
                    {loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-sm text-indigo-700 mt-1 font-medium">
                        <span>Loyalty discount</span>
                        <span>−₹{loyaltyDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Total payable</span>
                    <p className="text-[10px] text-gray-400">Inclusive of all taxes</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 px-5 py-4 border-b border-gray-200">
                {[
                  { icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ), label: warrantyBadgeLabel },
                  { icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ), label: 'Free installation' },
                  { icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ), label: '10 days replacement' },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                    <span className="text-red-600">{b.icon}</span>
                    <span className="text-[10px] text-gray-500">{b.label}</span>
                  </div>
                ))}
              </div>

              {/* Truco box */}
              <div className="mx-5 my-4 rounded-2xl bg-[#FFF9F2] overflow-hidden flex items-stretch min-h-[180px]">
                {/* Left — content */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                      Sathya Store Rewards 🎁
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 mb-3">
                      Earn points on every purchase
                    </p>
                    <ul className="space-y-1.5 mb-4">
                      {[
                        'Earn reward points',
                        'Exclusive member offers',
                        'Track orders easily',
                        'Priority service support',
                      ].map(item => (
                        <li key={item} className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-gray-900">
                          <span className="text-[10px] leading-none flex-shrink-0">▶</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a
                    href="https://truco.avaniko.com/api/api/download.html?tid=019acf86-5371-447f-a6f7-eeca624972ad&source=web&medium=web&campaign=truco"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-xl transition w-fit"
                  >
                    Download TRUCO App
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
                {/* Right — phone image */}
                <div className="w-24 sm:w-32 flex-shrink-0 flex items-center justify-center pr-2 sm:pr-3">
                  <img
                    src="/uploads/truco_app_phone.png"
                    alt="Sathya Stores Truco App"
                    className="w-full h-auto max-h-[170px] object-contain -rotate-6"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div class="flex flex-col items-center justify-center h-full p-3 text-center"><div class="bg-white rounded-xl px-3 py-2"><p class="text-indigo-700 text-xs font-bold leading-tight">Sathya Stores</p><p class="text-indigo-500 text-[9px] font-semibold">TRUCO</p></div></div>`;
                    }}
                  />
                </div>
              </div>

              {/* Help box */}
              <div className="mx-5 mb-4 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Need help before you buy? Our experts are here for you!
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <a href="tel:9842344323"
                    className="flex items-center justify-center gap-1.5 border border-green-200 rounded-lg py-2 px-1 text-[11px] sm:text-xs font-medium text-green-700 hover:bg-green-50 transition">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call expert
                  </a>
                  <a href={`https://wa.me/91${BEA_CONTACT_PHONE}?text=${encodeURIComponent("Hi")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 border border-green-200 rounded-lg py-2 px-1 text-[11px] sm:text-xs font-medium text-green-700 hover:bg-green-50 transition">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={openLiveDemoModal}
                    className="flex flex-col items-center justify-center gap-1 border border-[#c4b5fd] rounded-lg bg-[#f5f3ff] hover:bg-[#ede9fe] transition py-2 px-1 text-center w-full"
                  >
                    <svg className="w-4 h-4 text-[#5B4CF5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#5B4CF5] leading-tight">
                      Sathya Stores Live<br />Video Demo
                    </span>
                  </button>
                </div>
              </div>

              {/* CTA button */}
              <div className="px-5 pb-5">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || loading || cartItems.length === 0 || !isDeliverySaved}
                  className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
                    ${isSubmitting || loading || cartItems.length === 0 || !isDeliverySaved
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]'}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      Continue to payment
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Sathya Stores Promise */}
              <div className="px-5 py-4 bg-white border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-3">Sathya Stores Promise —</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ), label: '100% genuine products' },
                    { icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ), label: 'Brand warranty' },
                    { icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ), label: 'Safe & secure delivery' },
                    { icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ), label: 'Professional installation' },
                    { icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    ), label: '47+ showrooms support network' },
                  ].map(b => (
                    <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                      <span className="text-red-600">{b.icon}</span>
                      <span className="text-[9px] text-gray-500 leading-tight">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-gray-500">Total payable</p>
          <p className="text-base font-bold text-gray-900">₹{finalTotal.toLocaleString('en-IN')}</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || loading || cartItems.length === 0 || !isDeliverySaved}
          className={`px-6 h-11 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all
            ${isSubmitting || loading || cartItems.length === 0 || !isDeliverySaved
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'}`}
        >
          {isSubmitting ? 'Processing…' : 'Place order →'}
        </button>
      </div>

      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => { setShowAuthModal(false); window.location.reload(); }}
        />
      )}

      {/* Full-screen processing overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-900">Processing your order</h3>
            <p className="mt-2 text-sm text-gray-500">Please wait while we process your payment and order details.</p>
          </div>
        </div>
      )}
    </div>
  );
}