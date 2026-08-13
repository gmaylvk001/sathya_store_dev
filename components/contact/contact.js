"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaStore,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaSearch,
  FaArrowRight,
  FaVideo,
} from "react-icons/fa";
import { useModal } from "@/context/ModalContext";

// ── Helpers ──────────────────────────────────────────────────────────────────
const titleCase = (str) =>
  str ? str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "";
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

// ── Contact Form ─────────────────────────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email_address: "",
    mobile_number: "",
    city: "",
    enquiry_type: "",
    invoice_number: "",
    message: "",
    _hp: "",
  });
  const [formLoadTime] = useState(() => Date.now());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [touched, setTouched] = useState({});

  const handleBlur = (e) =>
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile_number") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [name]: digits }));
      setTouched((prev) => ({ ...prev, mobile_number: true }));
      if (!digits) {
        setErrors((prev) => ({ ...prev, mobile_number: "" }));
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        setErrors((prev) => ({ ...prev, mobile_number: "Invalid Mobile Number" }));
      } else {
        setErrors((prev) => { const { mobile_number: _, ...rest } = prev; return rest; });
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email_address.trim()) e.email_address = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email_address)) e.email_address = "Email is invalid";
    if (form.mobile_number && !/^[6-9]\d{9}$/.test(form.mobile_number))
      e.mobile_number = "Invalid Mobile Number";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.enquiry_type) e.enquiry_type = "Please select enquiry type";
    if (!form.message.trim()) e.message = "Message is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    if (form._hp) return;
    if (Date.now() - formLoadTime < 3000) { setResponseMsg("Please take a moment before submitting."); return; }
    setLoading(true);
    setResponseMsg("");
    try {
      const res = await fetch("/api/contact/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        const contact = data.data;
        const fd = new FormData();
        fd.append("campaign_id", "04024860-c288-405b-9be7-9d111419093d");
        fd.append("params", JSON.stringify([contact.name, contact.email_address, contact.mobile_number, contact.city, contact.message]));
        ["arunkarthik@sathya.store", "ecom@sathya.store", "Customercare@sathya.store"].forEach(async (email) => {
          fd.set("email", email);
          await fetch("https://bea.eygr.in/api/email/send-msg", {
            method: "POST",
            headers: { Authorization: "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L" },
            body: fd,
          });
        });
        setResponseMsg("Message sent successfully!");
        setForm({ name: "", email_address: "", mobile_number: "", city: "", enquiry_type: "", invoice_number: "", message: "", _hp: "" });
        setErrors({}); setTouched({});
        setTimeout(() => setResponseMsg(""), 3000);
      } else {
        setResponseMsg(data.message || "Something went wrong");
      }
    } catch { setResponseMsg("Something went wrong. Please check your details and try again."); }
    finally { setLoading(false); }
  };

  const inp = (hasErr) =>
    `w-full border rounded px-3 py-[9px] text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#d72828] transition-colors ${
      hasErr ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[12.5px] font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input type="text" name="name" value={form.name} onChange={handleChange} onBlur={handleBlur} placeholder="Enter your name" className={inp(errors.name && touched.name)} />
          {errors.name && touched.name && <p className="text-red-500 text-[11px] mt-0.5">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input type="email" name="email_address" value={form.email_address} onChange={handleChange} onBlur={handleBlur} placeholder="Enter your email" className={inp(errors.email_address && touched.email_address)} />
          {errors.email_address && touched.email_address && <p className="text-red-500 text-[11px] mt-0.5">{errors.email_address}</p>}
        </div>
      </div>
      {/* Phone + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[12.5px] font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input type="text" name="mobile_number" value={form.mobile_number} onChange={handleChange} onBlur={handleBlur} placeholder="Enter your phone number" maxLength={10} className={inp("mobile_number" in errors && touched.mobile_number)} />
          {errors.mobile_number && touched.mobile_number && <p className="text-red-500 text-[11px] mt-0.5">{errors.mobile_number}</p>}
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input type="text" name="city" value={form.city} onChange={handleChange} onBlur={handleBlur} placeholder="Enter your city" className={inp(errors.city && touched.city)} />
          {errors.city && touched.city && <p className="text-red-500 text-[11px] mt-0.5">{errors.city}</p>}
        </div>
      </div>
      {/* Enquiry Type + Invoice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[12.5px] font-medium text-gray-700 mb-1">
            Enquiry Type <span className="text-red-500">*</span>
          </label>
          <select name="enquiry_type" value={form.enquiry_type} onChange={handleChange} onBlur={handleBlur} className={`${inp(errors.enquiry_type && touched.enquiry_type)} appearance-none`}>
            <option value="">Select enquiry type</option>
            <option value="Product Inquiry">Product Inquiry</option>
            <option value="Order Support">Order Support</option>
            <option value="Service Request">Service Request</option>
            <option value="EMI / Finance">EMI / Finance</option>
            <option value="Feedback">Feedback</option>
            <option value="Other">Other</option>
          </select>
          {errors.enquiry_type && touched.enquiry_type && <p className="text-red-500 text-[11px] mt-0.5">{errors.enquiry_type}</p>}
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-gray-700 mb-1">
            Invoice Number
          </label>
          <input type="text" name="invoice_number" value={form.invoice_number} onChange={handleChange} placeholder="Enter invoice number (if any)" className={inp(false)} />
        </div>
      </div>
      {/* Message */}
      <div>
        <label className="block text-[12.5px] font-medium text-gray-700 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea name="message" value={form.message} onChange={handleChange} onBlur={handleBlur} placeholder="Write your message here..." rows={4} className={`${inp(errors.message && touched.message)} resize-none`} />
        {errors.message && touched.message && <p className="text-red-500 text-[11px] mt-0.5">{errors.message}</p>}
      </div>
      {/* Honeypot */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
        <input type="text" name="_hp" value={form._hp} onChange={handleChange} tabIndex="-1" autoComplete="off" />
      </div>
      {/* Submit */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-1">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#d72828] hover:bg-[#d72828] disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2.5 text-[13px] transition-colors">
          <FaPaperPlane size={12} />
          {loading ? "Submitting..." : "Submit Message"}
        </button>
        {responseMsg && (
          <p className={`text-[12.5px] font-medium ${responseMsg.includes("success") ? "text-green-600" : "text-red-500"}`}>
            {responseMsg}
          </p>
        )}
      </div>
    </form>
  );
}

// ── Store Card (exact reference match) ───────────────────────────────────────
function StoreCard({ store }) {
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    `${store.organisation_name} ${store.website || ""}`
  )}`;
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col w-full min-w-[170px] max-w-[200px] sm:min-w-[180px]">
      {/* Image */}
      <div className="relative w-full bg-[#d72828] overflow-hidden flex-shrink-0 h-[100px] sm:h-[110px]">
        {store.banners?.[0] ? (
          <img src={store.banners[0]} alt={store.organisation_name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
        ) : store.logo ? (
          <img src={store.logo} alt={store.organisation_name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="text-[#d72828] font-bold text-sm">Sathya Stores</span></div>
        )}
        {/* City badge */}
        {store.city && (
          <span className="absolute top-1.5 left-1.5 bg-[#d72828] text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded">
            {capitalize(store.city)}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-[12.5px] font-bold text-gray-900 mb-1 leading-snug line-clamp-1">
          {store.organisation_name}
        </h3>
        {store.address && (
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mb-1.5 flex-1">
            {titleCase(store.address)}{store.city ? `, ${capitalize(store.city)}` : ""}
            {store.zipcode ? ` - ${store.zipcode}` : ""}
          </p>
        )}
        {store.phone && (
          <a href={`tel:${store.phone}`} className="flex items-center gap-1.5 text-[11px] text-[#d72828] font-medium mb-3 hover:underline">
            <FaPhoneAlt size={9} className="flex-shrink-0" />
            {store.phone}
          </a>
        )}
        {/* Buttons */}
        <div className="flex gap-2 mt-auto">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <button className="w-full border border-[#d72828] text-[#d72828] hover:bg-red-50 rounded py-1.5 text-[11px] font-semibold transition-colors">
              Get Directions
            </button>
          </a>
          <Link href={`/store/${store.slug}`} className="flex-1">
            <button className="w-full bg-[#d72828] hover:bg-[#d72828] text-white rounded py-1.5 text-[11px] font-semibold transition-colors">
              View Store
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const { openLiveDemoModal } = useModal();
  const [stores, setStores] = useState([]);
  const [totalStores, setTotalStores] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStores, setFilteredStores] = useState([]);

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch("/api/store/get");
        const data = await res.json();
        if (data.success) {
          const active = data.data.filter((s) => s.status === "Active");
          setTotalStores(active.length);
          setStores(active);
          setFilteredStores(active.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to fetch stores", err);
      }
    }
    fetchStores();
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredStores(stores.slice(0, 5));
      return;
    }
    const q = searchQuery.toLowerCase();
const results = stores.filter(
      (s) =>
        s.city?.toLowerCase().includes(q) ||
        s.organisation_name?.toLowerCase().includes(q) ||
        s.zipcode?.includes(q) ||
        s.address?.toLowerCase().includes(q)
    );
    setFilteredStores(results.slice(0, 6));
  };

  return (
    <div className="font-sans bg-white text-gray-900">

{/* ══════════════════════════════════════════════════
    SECTION 1 — HERO BANNER
══════════════════════════════════════════════════ */}
<section className="relative w-full overflow-hidden">
  {/* In-flow image sets height from asset AR — no crop on large screens */}
  <img
    src="/contact/banner1.png"
    alt="Contact Sathya Stores"
    className="relative z-0 block w-full h-auto"
    onError={(e) => { e.target.style.display = "none"; }}
  />
  <div
    className="absolute inset-0 z-[1] pointer-events-none"
    style={{
      background:
        "linear-gradient(to right, rgba(5,13,40,0.97) 0%, rgba(5,13,40,0.93) 20%, rgba(5,13,40,0.72) 42%, rgba(5,13,40,0.28) 62%, rgba(5,13,40,0.06) 78%, transparent 92%)",
    }}
  />
  <div className="absolute inset-0 z-[2] flex items-center px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.75rem,2vw,1.5rem)]">
    <div className="ms-0 sm:ms-2 md:ms-4 lg:ms-6 space-y-[clamp(0.65rem,1.8vw,1.25rem)] max-w-5xl w-full">
      {/* Heading + subtitle */}
      <div>
        <h1 className="font-black text-white leading-tight mb-1 sm:mb-1.5 text-[clamp(1.35rem,2.6vw+0.45rem,2.375rem)]">
          Get in Touch With Sathya Stores
        </h1>
        <p className="text-[clamp(0.68rem,0.85vw+0.4rem,0.8125rem)] text-white leading-snug max-w-full sm:max-w-[min(300px,85vw)] md:max-w-[min(360px,70vw)] lg:max-w-[380px]">
          We&apos;re here to help you with any queries, support,
          or feedback. Reach out to us, we&apos;d love to hear from you!
        </p>
      </div>

      {/* Contact chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.5rem,1.2vw,1.25rem)] w-full sm:max-w-[min(42rem,95vw)] lg:max-w-5xl">

      {/* Call Us */}
      <a href="tel:9842344323" className="flex items-center gap-[clamp(0.4rem,0.8vw,0.65rem)] no-underline min-w-0">
        <div className="rounded-full border border-white/30 flex items-center justify-center flex-shrink-0 w-[clamp(1.65rem,1.4vw+1rem,2.1rem)] h-[clamp(1.65rem,1.4vw+1rem,2.1rem)]">
          <svg className="w-[clamp(0.7rem,0.5vw+0.55rem,0.9rem)] h-[clamp(0.7rem,0.5vw+0.55rem,0.9rem)]" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.54 2 2 0 0 1 3.54 1.35h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 5.86 5.86l.88-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.99 17z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[clamp(0.6rem,0.55vw+0.42rem,0.72rem)] text-white font-medium leading-none mb-0.5">Call Us</div>
          <div className="text-[clamp(0.72rem,0.7vw+0.45rem,0.9rem)] text-white font-bold leading-tight">98423 44323</div>
          <div className="text-[clamp(0.62rem,0.55vw+0.4rem,0.82rem)] text-white leading-tight mt-0.5">10:00 AM – 9:00 PM</div>
        </div>
      </a>

      {/* Email Us */}
      <a href="mailto:customercare@sathya.store" className="flex items-center gap-[clamp(0.4rem,0.8vw,0.65rem)] no-underline min-w-0 sm:border-l sm:border-white/15 sm:pl-[clamp(0.5rem,1vw,1rem)]">
        <div className="rounded-full border border-white/30 flex items-center justify-center flex-shrink-0 w-[clamp(1.65rem,1.4vw+1rem,2.1rem)] h-[clamp(1.65rem,1.4vw+1rem,2.1rem)]">
          <svg className="w-[clamp(0.7rem,0.5vw+0.55rem,0.9rem)] h-[clamp(0.7rem,0.5vw+0.55rem,0.9rem)]" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[clamp(0.6rem,0.55vw+0.42rem,0.72rem)] text-white font-medium leading-none mb-0.5">Email Us</div>
          <div className="text-[clamp(0.72rem,0.7vw+0.45rem,0.9rem)] text-white font-bold leading-tight break-all">customercare@</div>
          <div className="text-[clamp(0.62rem,0.55vw+0.4rem,0.82rem)] text-white leading-tight mt-0.5 break-all">sathya.store</div>
        </div>
      </a>

      {/* Video Demo Call */}
      <button
        type="button"
        onClick={openLiveDemoModal}
        className="flex items-center gap-[clamp(0.4rem,0.8vw,0.65rem)] min-w-0 sm:border-l sm:border-white/15 sm:pl-[clamp(0.5rem,1vw,1rem)] bg-transparent border-0 p-0 cursor-pointer text-left"
      >
        <div className="rounded-full border border-white/30 flex items-center justify-center flex-shrink-0 w-[clamp(1.65rem,1.4vw+1rem,2.1rem)] h-[clamp(1.65rem,1.4vw+1rem,2.1rem)]">
          <svg className="w-[clamp(0.7rem,0.5vw+0.55rem,0.9rem)] h-[clamp(0.7rem,0.5vw+0.55rem,0.9rem)]" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[clamp(0.6rem,0.55vw+0.42rem,0.72rem)] text-white font-medium leading-none mb-0.5">Video Call</div>
          <div className="text-[clamp(0.72rem,0.7vw+0.45rem,0.9rem)] text-white font-bold leading-tight">Sathya Stores Live Demo</div>
          <div className="text-[clamp(0.62rem,0.55vw+0.4rem,0.82rem)] text-white leading-tight mt-0.5">Demo Video Call</div>
        </div>
      </button>

      {/* Stores */}
      <Link href="/location" className="flex items-center gap-[clamp(0.4rem,0.8vw,0.65rem)] no-underline min-w-0 sm:border-l sm:border-white/15 sm:pl-[clamp(0.5rem,1vw,1rem)]">
        <div className="rounded-full border border-white/30 flex items-center justify-center flex-shrink-0 w-[clamp(1.65rem,1.4vw+1rem,2.1rem)] h-[clamp(1.65rem,1.4vw+1rem,2.1rem)]">
          <svg className="w-[clamp(0.7rem,0.5vw+0.55rem,0.9rem)] h-[clamp(0.7rem,0.5vw+0.55rem,0.9rem)]" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[clamp(0.6rem,0.55vw+0.42rem,0.72rem)] text-white font-medium leading-none mb-0.5">
            {totalStores > 0 ? `${totalStores}+` : "47+"} Stores
          </div>
          <div className="text-[clamp(0.72rem,0.7vw+0.45rem,0.9rem)] text-white font-bold leading-tight">Across Tamil Nadu</div>
          <div className="text-[clamp(0.62rem,0.55vw+0.4rem,0.82rem)] text-white leading-tight mt-0.5 underline">
            Find Nearest Store →
          </div>
        </div>
      </Link>

      </div>
    </div>
  </div>
</section>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — 3 SUPPORT CARDS
      ══════════════════════════════════════════════════ */}
      <section className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-0 sm:px-3 md:px-6 lg:px-8 mt-6 md:mt-8">
        <div className="max-w-12xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">

          {/* Talk to Experts */}
          <div className="border border-gray-200 rounded-xl p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#d72828] flex items-center justify-center flex-shrink-0">
              <FaPhoneAlt className="text-white text-[15px] sm:text-[17px]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-gray-900 mb-1.5">Talk to Our Experts</div>
              <p className="text-[12px] text-gray-500 leading-relaxed mb-2">
                Our support team is ready to assist you with your product, orders or general enquiries.
              </p>
              <a href="tel:9842344323" className="text-[#d72828] font-bold text-[13px] block hover:underline">
                ☎ 98423 44323
              </a>
              <div className="text-[11px] text-gray-400 mt-0.5">Mon to Sun: 10:00 AM – 9:00 PM</div>
            </div>
          </div>

          {/* Email Support */}
          <div className="border border-gray-200 rounded-xl p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#d72828] flex items-center justify-center flex-shrink-0">
              <FaEnvelope className="text-white text-[15px] sm:text-[17px]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-gray-900 mb-1.5">Email Support</div>
              <p className="text-[12px] text-gray-500 leading-relaxed mb-2">
                Drop us an email. We typically respond within 24 hours.
              </p>
              <a href="mailto:customercare@sathya.store" className="text-[#d72828] font-bold text-[12px] hover:underline break-all">
                customercare@<br/>sathya.store
              </a>
            </div>
          </div>

          {/* Sathya Stores Live Video Demo */}
          <button
            type="button"
            onClick={openLiveDemoModal}
            className="border border-[#c4b5fd] rounded-xl p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3 bg-[#f5f3ff] hover:bg-[#ede9fe] transition-colors text-left w-full"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#5B4CF5] flex items-center justify-center flex-shrink-0">
              <FaVideo className="text-white text-[15px] sm:text-[17px]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#5B4CF5] mb-1.5">Sathya Stores Live Video Demo</div>
              <p className="text-[12px] text-gray-500 leading-relaxed mb-2">
                See products live on a video call. Compare models and ask our experts anything.
              </p>
              <span className="text-[#5B4CF5] font-bold text-[13px] inline-flex items-center gap-1">
                Demo Video Call <FaArrowRight size={11} />
              </span>
            </div>
          </button>

          {/* Visit Our Stores */}
          <div className="border border-gray-200 rounded-xl p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#d72828] flex items-center justify-center flex-shrink-0">
              <FaStore className="text-white text-[15px] sm:text-[17px]" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-gray-900 mb-1.5">Visit Our Stores</div>
              <p className="text-[12px] text-gray-500 leading-relaxed mb-2">
                {totalStores > 0 ? `${totalStores}+` : "47+"} showrooms across Tamil Nadu. Find the one near you.
              </p>
              <Link href="/location" className="text-[#d72828] font-bold text-[13px] hover:underline inline-flex items-center gap-1">
                Store Locator <FaArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 3 — FORM (left) + MAP (right)
      ══════════════════════════════════════════════════ */}
      <section className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-0 sm:px-3 md:px-6 lg:px-8 mt-8 md:mt-10">
        <div className="max-w-12xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8 items-start">

          {/* Left — Form */}
          <div>
            <h2 className="text-lg sm:text-[20px] font-bold text-gray-900 mb-1">Send Us a Message</h2>
            <p className="text-[13px] text-gray-500 mb-5">
              Fill out the form and our team will get back to you.
            </p>
            <ContactForm />
          </div>

          {/* Right — Map + Corporate */}
          <div>
            <h2 className="text-base sm:text-[17px] font-bold text-gray-900 mb-4">Our Corporate Office</h2>
            {/* Map */}
            <div className="rounded-xl overflow-hidden border border-gray-200 mb-4 h-[220px] sm:h-[260px] md:h-[280px]">
              <iframe
                title="Sathya Stores Corporate Office"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                referrerPolicy="no-referrer-when-downgrade"
                src="https://maps.google.com/maps?q=Sathya+Stores&output=embed"
                allowFullScreen
              />
            </div>
            {/* Address */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <FaMapMarkerAlt size={13} className="text-gray-600 mt-0.5 flex-shrink-0" />
                <p className="text-[12.5px] text-gray-600 leading-relaxed">
                  26/1 Dr. Alagappa Chettiiyar Rd, Tatabad, Near Koval Scan Centre,
                  Coimbatore – 641012, Tamil Nadu
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <FaPhoneAlt size={12} className="text-gray-600 flex-shrink-0" />
                <a href="tel:9842344323" className="text-[12.5px] text-gray-700 hover:text-[#d72828]">
                  98423 44323
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <FaEnvelope size={12} className="text-gray-600 flex-shrink-0" />
                <a href="mailto:customercare@sathya.store" className="text-[12.5px] text-[#d72828] hover:underline">
                  customercare@sathya.store
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 4 — FIND NEAREST STORE
      ══════════════════════════════════════════════════ */}
      <section className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-4 md:px-6 lg:px-8 mt-8 md:mt-10 py-8 md:py-10">
        <div className="max-w-12xl mx-auto px-4 md:px-6">

          <h2 className="text-center text-lg sm:text-[22px] font-bold text-gray-900 mb-1 px-2">
            Find Your Nearest Store
          </h2>
          <p className="text-center text-[12px] sm:text-[13px] text-gray-500 mb-6 px-2">
            Search by city or pincode to locate a Sathya Stores showroom near you.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row max-w-xl mx-auto mb-8 gap-2 sm:gap-0 rounded-lg overflow-hidden border border-gray-300">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter city name or pincode"
              className="flex-1 w-full px-4 py-2.5 text-[13px] sm:text-[13.5px] text-gray-700 placeholder-gray-400 focus:outline-none bg-white"
            />
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto bg-[#d72828] hover:bg-[#d72828] text-white px-6 py-2.5 text-[13px] sm:text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-colors flex-shrink-0"
            >
              <FaSearch size={13} />
              Search
            </button>
          </div>

          {/* Store cards — horizontal scroll */}
          {filteredStores.length > 0 ? (
            <>
              <style>{`
                .contact-store-track::-webkit-scrollbar { display: none; }
                .contact-store-track { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
              <div
               className="contact-store-track flex gap-3 sm:gap-4 overflow-x-auto pb-2 mb-6 justify-start sm:justify-center px-1 sm:px-0"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {filteredStores.map((store) => (
                  <div
                    key={store._id}
                    className="flex-shrink-0 w-[78vw] max-w-[200px] sm:w-[200px]"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <StoreCard store={store} />
                  </div>
                ))}
                {/* Arrow indicator — right edge hint */}
                
              </div>

              {/* View All Stores */}
              <div className="text-center mt-2">
                <Link href="/location">
                  <button className="inline-flex items-center justify-center gap-2 border border-[#d72828] text-[#d72828] hover:bg-red-50 rounded-lg px-5 sm:px-8 py-2.5 text-[13px] sm:text-[14px] font-bold transition-colors w-full sm:w-auto max-w-xs sm:max-w-none">
                    View All Stores ({totalStores > 0 ? `${totalStores}+` : "47+"}) <FaArrowRight size={13} />
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400 text-[13px]">No stores found.</div>
          )}
        </div>
      </section>

    </div>
  );
}