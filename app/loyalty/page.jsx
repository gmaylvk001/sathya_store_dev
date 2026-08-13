"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

const faqs = [
  { q: "What is Sathya Stores Loyalty Programme?", a: "Sathya Stores Loyalty is a cardless loyalty programme that rewards you with points on every purchase. Use your mobile number as your membership ID — no card needed!" },
  { q: "How do I join Sathya Stores Loyalty?", a: "You are automatically enrolled when you make your first purchase at Sathya Stores. No separate registration required — just shop and you're in!" },
  { q: "How do I earn points?", a: "You earn loyalty points automatically on every completed purchase. Points are calculated based on your order value and credited to your account after payment." },
  { q: "What is the value of 1 point?", a: "1 Point = ₹1. Every point you earn has a direct cash equivalent that can be redeemed on your next purchase." },
  { q: "Where can I redeem my points?", a: "You can redeem your loyalty points directly at checkout — both in-store and online. Simply tap 'Use All Points' to apply your balance as a discount." },
  { q: "Do my points expire?", a: "Points validity depends on your account activity. Keep shopping to keep your points active!" },
  { q: "Do I need an app or card?", a: "No card and no mandatory app! Your mobile number is your membership ID. However, you can optionally download the Sathya Stores TRUCO app for a richer experience." },
  { q: "How do I check my balance?", a: "Enter your registered mobile number in the 'Check Point Balance' section on this page, or log in to your account to see your full dashboard." },
];

const extras = [
  { img: "/loyalty/image21.png", title: "Personalized Vouchers", desc: "Get exclusive Sathya Stores member deals and coupons." },
  { img: "/loyalty/image22.png", title: "Warranty Hub", desc: "Manage your product information, warranty and service support." },
  { img: "/loyalty/image23.png", title: "Purchase Updates", desc: "Track your orders, delivery updates and service requests easily." },
  { img: "/loyalty/image24.png", title: "Member Privileges", desc: "Early access to sales, special events and exclusive product launches." },
];

const whyJoin = [
  { img: "/loyalty/image1.png", title: "No Cards Needed", desc: "Your mobile number is your membership ID. Simple, secure and always with you." },
  { img: "/loyalty/image2.png", title: "Earn Every Purchase", desc: "Earn reward points on every purchase. 1 Point = ₹1. Always." },
  { img: "/loyalty/image3.png", title: "Exclusive Offers", desc: "Get access to special vouchers, birthday treats, and members-only deals." },
  { img: "/loyalty/image4.png", title: "Instant Redemption", desc: "Use your points directly during billing. No extra steps, just real savings." },
];

export default function LoyaltyPage() {
  const router = useRouter();
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkPhone, setCheckPhone] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setIsLoggedIn(false); setLoading(false); return; }
        const authRes = await fetch("/api/auth/check", { headers: { Authorization: `Bearer ${token}` } });
        const authData = await authRes.json();
        if (!authData.loggedIn) { setIsLoggedIn(false); setLoading(false); return; }
        setIsLoggedIn(true);
        const decoded = jwtDecode(token);
        setCustomerName(decoded.name || "Customer");
        setCustomerPhone(authData.phone || decoded.phone || "");
        const loyaltyRes = await fetch(`/api/award-points?phone=${authData.phone || ""}`);
        const loyaltyData = await loyaltyRes.json();
        setPoints(loyaltyData.success ? loyaltyData.points : 0);
      } catch (err) {
        console.error("Loyalty fetch error:", err);
        setPoints(0);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  const handleCheckPoints = async () => {
    if (!checkPhone || checkPhone.length < 10) return;
    setCheckLoading(true);
    setCheckResult(null);
    try {
      const res = await fetch(`/api/award-points?phone=${checkPhone}`);
      const data = await res.json();
      setCheckResult(data);
    } catch {
      setCheckResult({ success: false });
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a2236] antialiased">

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — HERO BANNER
      ═══════════════════════════════════════════════════════ */}
      <section className="w-full bg-[#0B1D3F]">
        <div className="relative w-full">
          <img
            src="/loyalty/banner1.png"
            alt="Sathya Stores Loyalty Rewards Programme"
            className="w-full h-auto block"
          />
          <div className="hidden lg:block absolute inset-0 bg-[#0B1D3F]/50 pointer-events-none" />

          <div className="relative lg:absolute lg:inset-0 z-10 w-full px-4 sm:px-10 xl:px-20 py-10 lg:py-12 flex flex-col lg:flex-row items-center justify-between gap-10">

          {/* LEFT */}
          <div className="flex-1 text-white max-w-[600px]">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5 text-xs font-semibold tracking-wider uppercase text-white/90">
              ★ Sathya Stores Loyalty Rewards Programme
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Shop More.<br />
              Earn <span className="text-[#FBBF24]">More.</span><br />
              Save <span className="text-[#FBBF24]">More.</span>
            </h1>
            <p className="text-white/80 text-sm sm:text-base mb-6 max-w-sm leading-relaxed">
              Every purchase at Sathya Stores earns you rewards. Unlock points, vouchers & exclusive member benefits across 47+ Sathya Stores stores.
            </p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 bg-[#FBBF24] text-[#0B1D3F] font-bold px-6 py-3 rounded-full text-sm hover:bg-[#f5b820] transition active:scale-[0.98]"
            >
              Start Earning Rewards
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <div className="flex flex-wrap gap-5 mt-8">
              {[{ icon: "🚫", label: "No Registration Fee" }, { icon: "💳", label: "No Physical Card" }, { icon: "🥇", label: "1 Point = ₹1 Value" }].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-white/80 text-xs">
                  <span>{b.icon}</span><span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Balance Check Form */}
          <div className="w-full lg:w-[340px] flex-shrink-0">
            <div className="bg-[#0B1D3F]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-white font-black text-lg mb-1">Already a Sathya Stores Member?</h3>
              <p className="text-white/60 text-xs mb-4">Enter your mobile number to check your rewards balance.</p>

              <div className="space-y-3">
                <div className="flex bg-white rounded-xl overflow-hidden min-w-0">
                  <span className="bg-[#F8FAFD] px-3 flex items-center text-sm font-semibold text-[#1a2236] border-r border-[#D1DCF0] flex-shrink-0">+91</span>
                  <input
                    type="tel"
                    value={checkPhone}
                    onChange={(e) => setCheckPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter mobile number"
                    maxLength={10}
                    className="flex-1 min-w-0 px-3 py-3 text-sm text-[#1a2236] placeholder-[#94A3B8] outline-none bg-white"
                  />
                  <button
                    onClick={handleCheckPoints}
                    disabled={checkLoading || checkPhone.length < 10}
                    className="flex-shrink-0 bg-[#c02020] text-white px-4 py-3 text-sm font-bold hover:bg-[#1a44c4] transition disabled:bg-[#94A3B8] disabled:text-white whitespace-nowrap"
                  >
                    {checkLoading ? <div className="w-4 h-4 border-2 border-[#94A3B8] border-t-[#c02020] rounded-full animate-spin" /> : "Check"}
                  </button>
                </div>

                {checkResult && (
                  <div className={`rounded-xl p-3 text-sm font-medium ${checkResult.success ? "bg-green-900/40 border border-green-400/30 text-green-300" : "bg-red-900/40 border border-red-400/30 text-red-300"}`}>
                    {checkResult.success ? (
                      <><p className="font-bold text-green-200">Account Located!</p><p className="text-xs mt-0.5 text-green-300/80">You have <strong>{checkResult.points?.toLocaleString()} points</strong> = <strong>₹{checkResult.points?.toLocaleString()}</strong>.</p></>
                    ) : "No account found for this mobile number."}
                  </div>
                )}

                {!loading && isLoggedIn && points !== null && (
                  <div className="bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl p-4">
                    <p className="text-[#FBBF24] text-[10px] font-bold uppercase tracking-widest mb-1">Your Points</p>
                    <p className="text-white font-black text-2xl">{points.toLocaleString()} <span className="text-sm font-normal text-white/50">= ₹{points.toLocaleString()}</span></p>
                    <button onClick={() => router.push("/checkout")} className="mt-3 w-full bg-[#c02020] text-white text-sm font-bold py-2.5 rounded-lg hover:bg-[#1a44c4] transition">
                      Use at Checkout →
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 mt-4 pt-4">
                <p className="text-white/40 text-xs text-center mb-3">Login to check and use your loyalty points at checkout.</p>
                {!isLoggedIn && (
                  <button onClick={() => router.push("/")} className="mt-3 w-full text-center text-[#60A5FA] text-xs font-semibold hover:text-white transition">
                    Login to your account →
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — WHY JOIN Sathya Stores LOYALTY
      ═══════════════════════════════════════════════════════ */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-black text-[#1a2236] mb-2">Why Join Sathya Stores Loyalty?</h2>
          <div className="flex justify-center mb-10"><div className="w-12 h-1 rounded-full bg-[#c02020]" /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {whyJoin.map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-5 rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="w-20 h-20 mb-4 flex items-center justify-center">
                  <img src={item.img} alt={item.title} className="w-full h-full object-contain" />
                </div>
                <h3 className="font-bold text-[#1a2236] text-sm mb-2">{item.title}</h3>
                <p className="text-[#64748B] text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — BANNER 2 WITH QR OVERLAY
      ═══════════════════════════════════════════════════════ */}
      <section className="w-full px-4 py-2 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <img src="/loyalty/banner2.png" alt="Download Sathya Stores TRUCO App" className="w-full h-auto block" />
            <div className="absolute  flex  items-center justify-center" style={{ top: "12.5%", right: "6%", width: "15%", height: "70%" }}>
              <img src="/loyalty/loyaltyQR.jpeg" alt="Scan QR" className="w-full h-full object-contain" />
            </div>
            <div className="absolute hidden md:flex gap-2 items-center" style={{ bottom: "27%", left: "10%" }}>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section className="w-full px-4 py-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <img src="/loyalty/banner3.png" alt="How It Works" className="w-full h-auto block rounded-2xl" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — MEMBER DASHBOARD
      ═══════════════════════════════════════════════════════ */}
      {loading && (
        <section className="py-10 px-4 bg-[#F0F4FA]">
          <div className="max-w-4xl mx-auto bg-[#0B1D3F] rounded-[18px] p-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-40 mb-4" />
            <div className="h-7 bg-white/10 rounded w-56 mb-5" />
            <div className="flex gap-3">
              <div className="flex-1 h-24 bg-white/10 rounded-xl" />
              <div className="flex-1 h-24 bg-white/10 rounded-xl" />
            </div>
          </div>
        </section>
      )}

      {!loading && isLoggedIn && points !== null && (
        <section className="py-10 px-4 bg-[#F0F4FA]">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-[18px] px-7 py-6 sm:pr-7 pr-4" style={{ background: "#0B1D3F" }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">                <div className="flex items-center gap-2 text-[#94A3B8] text-xs font-semibold tracking-wide">
                  <span className="text-[#FBBF24] text-base leading-none">★</span>
                  Your Sathya Stores Rewards Wallet
                </div>
                <button onClick={() => router.push("/checkout")} className="flex items-center gap-2 bg-[#c02020] text-white text-[13px] font-bold px-5 py-2.5 rounded-[10px] hover:bg-[#1e45c2] transition active:scale-[0.98]">
                  Use Points at Checkout
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
              <h3 className="text-[22px] font-black text-white mb-5 tracking-tight">
                Welcome back, <span className="text-[#FBBF24]">{customerName}!</span>
              </h3>
             <div className="flex flex-col sm:flex-row items-stretch gap-4">
                   <div className="flex flex-col xs:flex-row gap-3 flex-1">
                     {/* Available Points */}
               <div className="flex-1 rounded-[12px] px-[18px] py-4 flex items-center justify-between" style={{ background: "#0D2150" }}>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-1">Available Points</p>
                      <p className="text-[28px] font-black text-white leading-none flex items-baseline gap-1">
                        {points.toLocaleString()}<span className="text-xs font-normal text-[#64748B]">Pts</span>
                      </p>
                    </div>
                    <div className="w-[46px] h-[46px] rounded-[10px] bg-[#c02020]/20 flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d72828" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  </div>
                  {/* Savings Value */}
                  <div className="flex-1 rounded-[12px] px-[18px] py-4 flex items-center justify-between" style={{ background: "#0D2150" }}>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-1">Savings Value</p>
                      <p className="text-[28px] font-black text-[#FBBF24] leading-none">₹{points.toLocaleString()}</p>
                      <p className="text-[10px] text-[#64748B] mt-1">1 Point = ₹1</p>
                    </div>
                    <div className="w-[46px] h-[46px] rounded-[10px] bg-white/5 flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h.01" /><path d="M2 10h20" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Right col — below on mobile, right on desktop */}
               <div className="flex flex-row sm:flex-col justify-between sm:justify-center gap-4 sm:pl-3 sm:min-w-[160px] pt-1 sm:pt-0 border-t border-white/10 sm:border-t-0 sm:border-l sm:border-white/10 sm:pl-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-1">Membership ID</p>
                    <p className="text-[15px] font-bold text-white tracking-wider">
                      {customerPhone ? customerPhone.replace(/(\d{5})(\d{5})/, "$1 $2") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[34px] h-[34px] rounded-full bg-[#c02020] flex items-center justify-center text-sm flex-shrink-0">🏅</div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-0.5">Member Since</p>
                      <p className="text-[14px] font-bold text-white">May 2025</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </section>
      )}

      {!loading && !isLoggedIn && (
        <section className="py-10 px-4 bg-[#F0F4FA]">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-[18px] px-7 py-8 text-center" style={{ background: "#0B1D3F" }}>
              <div className="text-3xl mb-3">★</div>
              <h3 className="text-[18px] font-black text-white mb-2">Your Sathya Stores Rewards Wallet</h3>
              <p className="text-[#94A3B8] text-sm mb-5">Login to view your points, savings value and membership details.</p>
              <button onClick={() => router.push("/")} className="bg-[#c02020] text-white text-sm font-bold px-7 py-3 rounded-[10px] hover:bg-[#1e45c2] transition">Login to Your Account →</button>
              <div className="text-[#64748B] text-xs my-4">— or check your balance as guest —</div>
              <div className="flex gap-2 justify-center flex-wrap">
                <input
                  type="tel" value={checkPhone}
                  onChange={(e) => setCheckPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter mobile number" maxLength={10}
                  className="bg-white/10 border border-white/10 rounded-[10px] px-4 py-2.5 text-sm text-white placeholder-[#4B5563] outline-none w-52"
                />
                <button onClick={handleCheckPoints} disabled={checkLoading || checkPhone.length < 10}
                  className="bg-[#c02020] text-white text-sm font-bold px-5 py-2.5 rounded-[10px] hover:bg-[#1e45c2] transition disabled:bg-white/10 disabled:text-white/30">
                  {checkLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Check"}
                </button>
              </div>
              {checkResult && (
                <div className={`mt-3 mx-auto max-w-sm rounded-[10px] px-4 py-3 text-sm font-medium ${checkResult.success ? "bg-green-900/40 border border-green-400/20 text-green-300" : "bg-red-900/40 border border-red-400/20 text-red-300"}`}>
                  {checkResult.success ? (<><strong className="text-green-200">Account located!</strong><span className="text-green-300/80 ml-1">You have <strong>{checkResult.points?.toLocaleString()} points</strong> worth <strong>₹{checkResult.points?.toLocaleString()}</strong>.</span></>) : "No account found for this mobile number."}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 6 — MORE THAN JUST REWARDS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-14 px-4 bg-white border-t border-[#E8EDF5]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-black text-[#1a2236] mb-2">More Than Just Rewards</h2>
          <div className="flex justify-center mb-10"><div className="w-12 h-1 rounded-full bg-[#c02020]" /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {extras.map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-5 rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="w-16 h-16 mb-4 flex items-center justify-center">
                  <img src={item.img} alt={item.title} className="w-full h-full object-contain" />
                </div>
                <h3 className="font-bold text-[#1a2236] text-sm mb-2">{item.title}</h3>
                <p className="text-[#64748B] text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7 — FAQ
      ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFD] border-t border-[#E8EDF5] py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-black text-[#1a2236] mb-2">Frequently Asked Questions</h2>
          <div className="flex justify-center mb-10"><div className="w-12 h-1 rounded-full bg-[#c02020]" /></div>

          <div className="flex flex-col md:flex-row gap-3 items-start">
            {/* Left column: index 0,2,4,6 */}
            <div className="flex flex-col gap-3 flex-1">
              {[0, 2, 4, 6].map((i) => {
                const faq = faqs[i];
                const isOpen = openFaq === i;
                return (
                  <div key={i} className={`border rounded-2xl overflow-hidden transition-all duration-200 bg-white ${isOpen ? "border-[#c02020] shadow-sm" : "border-[#D1DCF0] hover:border-[#B0C4E8]"}`}>
                    <button onClick={() => setOpenFaq(isOpen ? null : i)} className="w-full flex justify-between items-center px-5 py-5 text-left gap-4 min-h-[64px]">
                      <span className="font-semibold text-[#1a2236] text-sm">{faq.q}</span>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? "bg-[#EBF0FF] text-[#c02020] rotate-45" : "bg-[#F0F4FA] text-[#4B6087]"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40" : "max-h-0"}`}>
                      <p className="px-5 pb-5 pt-3 text-[#4B6087] text-sm leading-relaxed border-t border-[#E8EDF5] bg-[#F8FAFD]">{faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right column: index 1,3,5,7 */}
            <div className="flex flex-col gap-3 flex-1">
              {[1, 3, 5, 7].map((i) => {
                const faq = faqs[i];
                const isOpen = openFaq === i;
                return (
                  <div key={i} className={`border rounded-2xl overflow-hidden transition-all duration-200 bg-white ${isOpen ? "border-[#c02020] shadow-sm" : "border-[#D1DCF0] hover:border-[#B0C4E8]"}`}>
                    <button onClick={() => setOpenFaq(isOpen ? null : i)} className="w-full flex justify-between items-center px-5 py-5 text-left gap-4 min-h-[64px]">
                      <span className="font-semibold text-[#1a2236] text-sm">{faq.q}</span>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? "bg-[#EBF0FF] text-[#c02020] rotate-45" : "bg-[#F0F4FA] text-[#4B6087]"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40" : "max-h-0"}`}>
                      <p className="px-5 pb-5 pt-3 text-[#4B6087] text-sm leading-relaxed border-t border-[#E8EDF5] bg-[#F8FAFD]">{faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}