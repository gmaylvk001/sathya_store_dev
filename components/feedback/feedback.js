"use client";

import { useState, useRef } from "react";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import {
  Users,
  Store,
  ShieldCheck,
  Clock3,
  Phone,
  Mail,
  MapPin,
  Star,
  Lock,
  Send,
  ClipboardList,
  Ticket,
  Headphones,
  CheckCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const faqData = [
  {
    q: "How can I share feedback about my Sathya Stores shopping experience?",
    a: "You can share your feedback about your shopping experience at Sathya Stores through our feedback form, Google reviews, or by contacting our customer care team. Your feedback helps Sathya Stores improve our products, services, delivery, and customer experience across all our stores."
  },
  {
    q: "How do I raise a complaint with Sathya Stores?",
    a: "Customers can raise a complaint by submitting the feedback form on our website or contacting Sathya Stores Customer Care. Our support team will review your concern and assist you regarding product, delivery, installation, warranty, or service-related issues. \n\n📞 9842344323 \n✉️ customercare@sathya.store"
  },
  {
    q: "Does Sathya Stores provide support after purchasing a product?",
    a: "Yes. Sathya Stores provides after-sales assistance for products purchased from our stores and website. Our team helps customers with installation guidance, brand warranty support, and service-related queries for appliances and electronics."
  },
  {
    q: "Who should I contact for appliance installation support?",
    a: "For products like air conditioners, televisions, refrigerators, washing machines and other appliances, installation support is handled as per brand guidelines. Sathya Stores assists customers in coordinating with authorized brand service teams for a smooth installation experience."
  },
  {
    q: "How long does Sathya Stores take to respond to customer complaints?",
    a: "Our customer support team reviews every customer query and works to provide timely assistance. Response time may vary depending on the product category, brand support process, and type of concern raised."
  },
  {
    q: "Can I contact Sathya Stores for warranty-related issues?",
    a: "Yes. Products purchased from Sathya Stores come with applicable manufacturer warranty. Customers can contact Sathya Stores Customer Care for guidance regarding warranty claims and authorized service support."
  },
  {
    q: "Where are Sathya Stores customer support services available?",
    a: "Sathya Stores supports customers across Tamil Nadu through our network of 47+ showrooms and online support channels. Customers can reach us for product assistance, delivery support, installation queries, and after-sales service."
  },
  {
    q: "How can I leave a Google review for Sathya Stores?",
    a: "Customers can share their experience by leaving a Google review for the Sathya Stores showroom they visited. Reviews help us understand customer experiences and continue improving our service quality."
  }
];

const happyCustomersData = [
  { image: "/uploads/COIMBATORE_HAPPY_CUSTOMER.png", city: "Coimbatore" },
  { image: "/uploads/SALEM_HAPPY_CUSTOMER.png", city: "Salem" },
  { image: "/uploads/ERODE_HAPPY_CUSTOMER.png", city: "Madurai" },
  { image: "/uploads/customer.png", city: "Tiruchirappalli" },
];

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email_address: "",
    mobile_number: "",
    invoice_number:"",
    products:"",
    city: "",
    feedback: "",
    _hp: "",
  });
  const [formLoadTime] = useState(() => Date.now());

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [touched, setTouched] = useState({});

  // FAQ States
  const [openFaq, setOpenFaq] = useState(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  // Slider States & Refs (Restored)
  const sliderRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const totalDots = 4;

  const getSlideMetrics = () => {
    if (!sliderRef.current) return { cardWidth: 0, gap: 16 };
    const card = sliderRef.current.querySelector(".happy-customer-card");
    const cardWidth = card?.offsetWidth ?? 0;
    const gap = parseFloat(getComputedStyle(sliderRef.current).columnGap || getComputedStyle(sliderRef.current).gap) || 16;
    return { cardWidth, gap };
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const { cardWidth, gap } = getSlideMetrics();
    if (!cardWidth) return;
    const step = cardWidth + gap;
    let newSlide = Math.round(sliderRef.current.scrollLeft / step);
    newSlide = Math.max(0, Math.min(newSlide, totalDots - 1));
    setActiveSlide(newSlide);
  };

  const scrollToSlide = (index) => {
    if (!sliderRef.current) return;
    const { cardWidth, gap } = getSlideMetrics();
    if (!cardWidth) return;
    sliderRef.current.scrollTo({ left: index * (cardWidth + gap), behavior: "smooth" });
    setActiveSlide(index);
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile_number") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, [name]: digits });
      setTouched(prev => ({ ...prev, mobile_number: true }));
      if (!digits) {
        setErrors(prev => ({ ...prev, mobile_number: "" }));
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        setErrors(prev => ({ ...prev, mobile_number: "Invalid Mobile Number" }));
      } else {
        setErrors(prev => { const { mobile_number: _, ...rest } = prev; return rest; });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validate = () => {
    const newErrors = {};
  
    if (!form.name.trim()) newErrors.name = "Name is required";
    
    if (!form.email_address.trim()) {
      newErrors.email_address = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email_address)) {
      newErrors.email_address = "Email is invalid";
    }
  
    if (!form.mobile_number.trim()) {
      newErrors.mobile_number = "";
    } else if (!/^[6-9]\d{9}$/.test(form.mobile_number)) {
      newErrors.mobile_number = "Invalid Mobile Number";
    }
  
    if (!form.invoice_number.trim()) newErrors.invoice_number = "Invoice is required";
    if (!form.products.trim()) newErrors.products = "Products is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.feedback.trim()) newErrors.feedback = "Feedback field is required";
  
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {});
      setTouched(allTouched);

    const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

    // Honeypot check — bots fill hidden fields, humans don't
    if (form._hp) return;

    // Timing check — bots submit too fast
    if (Date.now() - formLoadTime < 3000) {
      setResponseMsg("Please take a moment before submitting.");
      return;
    }

    setLoading(true);
    setResponseMsg("");

    try {
      const res = await fetch("/api/feedback/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        const FeedBack = data.data;
        const adminemailFormData = new FormData();
        adminemailFormData.append("campaign_id", "bdd26532-7c0d-49d3-8715-369ab8f033bb");
        adminemailFormData.append(
          "params",
          JSON.stringify([FeedBack.name,FeedBack.email_address,FeedBack.mobile_number,FeedBack.invoice_number,FeedBack.products, FeedBack.city,FeedBack.feedback])
        );

        const emailadmin = ["arunkarthik@sathya.store","ecom@sathya.store","Customercare@sathya.store"];

        emailadmin.forEach(async (emailadmin) => {
          adminemailFormData.set("email", emailadmin);
          let adminresponse = await fetch("https://bea.eygr.in/api/email/send-msg", {
            method: "POST",
            headers: {
              Authorization: "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L",
            },
            body: adminemailFormData, // Use the renamed variable
          });

          let adminData = await adminresponse.json();
        });
        setResponseMsg("Message sent successfully!");
        setForm({ name: "", email_address: "", mobile_number: "", invoice_number: "", products: "", city: "", feedback: "", _hp: "" });
        setErrors({});
        setTouched({});

        // Clear message after 2 seconds
        setTimeout(() => {
          setResponseMsg("");
        }, 2000);
      } else {
        setResponseMsg(data.message || "Something went wrong");
      }
    } catch (error) {
      setResponseMsg("Something went wrong. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      icon: ClipboardList,
      title: "Submit Your Request",
      desc: "Share your concern or feedback with complete details.",
    },
    {
      icon: Ticket,
      title: "Ticket ID Generated",
      desc: "You will receive a ticket ID via SMS / Email for easy tracking.",
    },
    {
      icon: Headphones,
      title: "Support Team Reviews",
      desc: "Our team will review your request and work on the best solution.",
    },
    {
      icon: CheckCircle,
      title: "Resolution & Update",
      desc: "We will provide resolution and update you at the earliest.",
    },
  ];

  const inputClass = "w-full border rounded-md px-3 py-2 focus:outline-none";

  const visibleFaqs = showAllFaqs ? faqData : faqData.slice(0, 4);

  return (
    <>
      {/* HERO SECTION */}
      {/* <section 
        className="relative overflow-hidden bg-cover bg-center text-white" 
        style={{ backgroundImage: "url('/uploads/customer__support.png')" }}
      >
     
        <div className="absolute inset-0 bg-gradient-to-r from-[#022A6E] via-[#0000]/50 to-transparent z-0"></div>

        <div className="relative max-w-7xl mx-auto px-8 z-10">
          <div className="grid lg:grid-cols-[60%_40%] items-center min-h-[420px]">

           
            <div className="py-10 lg:py-0 text-white">

              <h1 className="text-4xl lg:text-[42px] leading-tight font-bold mb-2">
                Customer Support &
                <br />
                Feedback Centre
              </h1>

              <p className="text-blue-100 text-lg max-w-xl leading-8 mb-3">
                We are here to help with your electronics & home appliance
                purchase, delivery, installation and service support.
              </p>

              
              <div className="border border-white/20 rounded-2xl overflow-hidden mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4">

                  <div className="text-center py-6 border-r border-white/20">
                    <Users className="w-12 h-12 mx-auto mb-2 text-white" />
                    <h3 className="font-bold text-xl">50 Lakh+</h3>
                    <p className="text-sm text-blue-100">
                      Happy Customers
                    </p>
                  </div>

                  <div className="text-center py-6 border-r border-white/20">
                    <Store className="w-12 h-12 mx-auto mb-2 text-white" />
                    <h3 className="font-bold text-xl">47+</h3>
                    <p className="text-sm text-blue-100">
                      Stores Across
                      <br />
                      Tamil Nadu
                    </p>
                  </div>

                  <div className="text-center py-6 border-r border-white/20">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-white" />
                    <h3 className="font-bold text-xl">
                      Authorized
                    </h3>
                    <p className="text-sm text-blue-100">
                      Brand Support
                    </p>
                  </div>

                  <div className="text-center py-6">
                    <Clock3 className="w-12 h-12 mx-auto mb-2 text-white" />
                    <h3 className="font-bold text-xl">
                      Quick Response
                    </h3>
                    <p className="text-sm text-blue-100">
                      Assistance
                    </p>
                  </div>

                </div>
              </div>

            </div>

            
            <div className="hidden lg:block h-full"></div>

          </div>
        </div>
      </section> */}
{/* HERO SECTION - REPLACED WITH RESPONSIVE IMAGE BANNER */}
      <section className="w-full mb-8 md:mb-12">
        <img 
          src="/uploads/customer_SUPPORTT.png" 
          alt="Customer Support & Feedback Centre" 
          className="w-full h-auto object-contain block"
        />
      </section>
      

      {/* FORM + SUPPORT SECTION */}
      <section className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-0 sm:px-3 md:px-6 lg:px-8 mb-8 md:mb-12">
        <div className="grid lg:grid-cols-12 gap-8">
          

          {/* LEFT (Match Image styling) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full flex flex-col">

              <h2 className="text-[20px] font-bold text-[#18398e] mb-2">
                Your Trusted Electronics Support Partner
              </h2>

              <p className="text-gray-600 text-[13px] mb-6 leading-relaxed">
                At Sathya Stores, customer satisfaction priority. Our dedicated support teams helps customers with product enquiries, delivery updates, installation assistance, warranty guidance and after-sales support across Tamil Nadu.
              </p>

              <div className="space-y-3 flex-1 flex flex-col justify-end">

                {/* Call */}
                <a href="tel:9842344323" className="block border border-blue-100 bg-blue-50 rounded-xl p-4 flex items-start gap-4 hover:border-blue-300 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#2453d3] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900">Call Us</h4>
                    <p className="font-bold text-[#2453d3]">
                      +91 98423 44323
                    </p>
                    <p className="text-sm text-gray-500">
                      Mon - Sun : 09:30 AM - 09:30 PM
                    </p>
                  </div>
                </a>

                {/* Email */}
                <a href="mailto:customercare@sathya.store" className="block border border-blue-100 bg-blue-50 rounded-xl p-4 flex items-start gap-4 hover:border-blue-300 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#2453d3] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900">Email Us</h4>
                    <p className="text-[#2453d3] break-all">
                      customercare@sathya.store
                    </p>
                  </div>
                </a>

              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="lg:col-span-7">
            <div className="bg-white border rounded-xl shadow-sm p-6">

              <h2 className="text-xl font-bold text-[#2453d3] mb-2">
                How can we help you today?
              </h2>

              <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5 mb-5">
                {/* Name */}
                <div>
                  <label className="block font-medium mb-1">
                    Name<span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputClass} ${errors.name && touched.name ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-medium mb-1">
                    Email<span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email_address"
                    value={form.email_address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputClass} ${errors.email_address && touched.email_address ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-medium mb-1">
                    Phone <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobile_number"
                    value={form.mobile_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={10}
                    className={`${inputClass} ${'mobile_number' in errors && touched.mobile_number ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.mobile_number && touched.mobile_number && (
                      <p className="text-red-500 text-sm mt-1">{errors.mobile_number}</p>
                    )}
                </div>

                {/* invoice_number */}
                <div>
                  <label className="block font-medium mb-1">
                    Invoice Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="invoice_number"
                    value={form.invoice_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputClass} ${errors.invoice_number && touched.invoice_number ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>

                {/* product */}
                <div>
                  <label className="block font-medium mb-1">
                    Products <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="products"
                    value={form.products}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputClass} ${errors.products && touched.products ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block font-medium mb-1">
                    City <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputClass} ${errors.city && touched.city ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>

                {/* Feedback - Full Width */}
                <div className="col-span-full md:col-span-2">
                  <label className="block font-medium mb-1">
                    Feedback<span className="text-red-600">*</span>
                  </label>
                  <textarea
                    name="feedback"
                    value={form.feedback}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputClass} ${errors.feedback && touched.feedback ? "border-red-500" : "border-gray-300"}`}
                  ></textarea>
                </div>

                {/* Honeypot — hidden from humans, bots will fill this */}
                <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
                  <input type="text" name="_hp" value={form._hp} onChange={handleChange} tabIndex="-1" autoComplete="off" />
                </div>

                {/* Submit Button - Full Width */}
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#041b4d] text-white px-6 py-2 rounded-md"
                  >
                    <Send  className="w-4 h-4" />
                    {loading ? "Submitting..." : "Submit Feedback"}
                  </button>

                  {responseMsg && (
                    <p className="text-green-600 font-medium mt-2">{responseMsg}</p>
                  )}
                </div>
                
              </form>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 rounded-lg py-2 px-4">
                <Lock className="w-4 h-4 text-[#2453d3] shrink-0" />
                <p>Your information is secure and will only be used to assist you.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SUPPORT PROCESS */}

      <section className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-0 sm:px-3 md:px-6 lg:px-8 mb-8 md:mb-12">
        <div className="bg-white border rounded-2xl p-8 md:p-10 shadow-sm">

          <h2 className="text-xl font-bold text-center text-[#2453d3] mb-5">
            How Sathya Stores Support Works
          </h2>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

            {/* Dotted Line */}
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] border-t-2 border-dashed border-gray-300" />

            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={index}
                  className="relative text-center"
                >
                  {/* Icon */}
                  <div className="relative mx-auto w-fit">
                    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                      <Icon className="w-9 h-9 text-[#2453d3]" />
                    </div>

                    {/* Step Number */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#2453d3] text-white text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <h4 className="font-semibold text-gray-900 mt-6 mb-2">
                    {step.title}
                  </h4>

                  <p className="text-sm text-gray-500 leading-6">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ + HAPPY CUSTOMERS */}
      <section className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-3 md:px-6 lg:px-8 mb-8 md:mb-12 overflow-x-hidden">
        <div className="grid lg:grid-cols-12 gap-6 items-start min-w-0">

          {/* FAQ SECTION */}
          <div className="lg:col-span-5 min-w-0">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
              <h2 className="text-[20px] font-bold text-[#2453d3] mb-4">
                Frequently Asked Questions
              </h2>

              <div className={`flex-1 ${showAllFaqs ? 'max-h-[300px] overflow-y-auto pr-2 scrollbar-thin' : ''}`}>
                <div className="space-y-2">
                  {visibleFaqs.map((faq, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-200 rounded-md overflow-hidden transition-all duration-200"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-white text-left focus:outline-none"
                      >
                        <span className="font-semibold text-[13px] text-gray-800 pr-4">
                          {faq.q}
                        </span>
                        {openFaq === index ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                      </button>
                      
                      {openFaq === index && (
                        <div className="px-3 pb-3 bg-white text-[12px] text-gray-600 whitespace-pre-line">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* View All / Show Less Button */}
              {faqData.length > 5 && (
                <button 
                  onClick={() => setShowAllFaqs(!showAllFaqs)}
                  className="mt-4 text-[#2453d3] font-bold text-[13px] flex items-center gap-1 hover:underline self-start"
                >
                  {showAllFaqs ? (
                    <>Show less FAQs <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>View all FAQs <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* HAPPY CUSTOMERS SECTION */}
          <div className="lg:col-span-7 min-w-0 w-full">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm overflow-hidden flex flex-col min-w-0 w-full">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#2453d3] text-center mb-4 sm:mb-6">
                Happy Customers Across Tamil Nadu
              </h2>

              {/* Horizontal Scrollable Carousel — contained so it does not expand the page */}
              <div className="w-full min-w-0 overflow-hidden">
                <div
                  ref={sliderRef}
                  onScroll={handleScroll}
                  className="happy-customer-track flex w-full max-w-full overflow-x-auto gap-3 sm:gap-4 pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth touch-pan-x overscroll-x-contain"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {happyCustomersData.map((item, i) => (
                    <div
                      key={i}
                      className="happy-customer-card w-[72vw] max-w-[280px] sm:w-[200px] md:w-[220px] snap-start border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col shrink-0 flex-none"
                    >
                      <img
                        src={item.image}
                        alt={item.city}
                        className="w-full h-36 sm:h-40 md:h-44 object-cover"
                      />
                      <div className="py-2.5 text-center text-[13px] font-bold text-gray-800 bg-white">
                        {item.city}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Functional Slider Dots */}
              <div className="flex justify-center gap-2 mt-3 sm:mt-4">
                {Array.from({ length: totalDots }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      activeSlide === index ? "bg-[#2453d3] scale-110" : "bg-blue-100 hover:bg-blue-300"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-0 sm:px-3 md:px-6 lg:px-8 mb-8 md:mb-12">
        <div className="bg-[#eef4ff] border border-blue-100 rounded-2xl p-6 flex flex-col lg:flex-row items-center gap-6 shadow-sm">
          {/* Left Side - 50% */}
          <div className="w-full lg:w-1/2">
            <h3 className="text-2xl font-bold text-[#2453d3] mb-2">
              Need Assistance? We're One Step Ahead.
            </h3>

            <p className="text-gray-600 text-[15px] leading-6">
              Our support team is ready to help you with all your queries.
              Contact us through phone, WhatsApp, or leave us a review
              on Google.
            </p>
          </div>

          {/* Right Side - 50% */}
          <div className="w-full lg:w-1/2 grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Call Support */}
            <a
              href="tel:9842344323"
              className="bg-white rounded-xl px-4 py-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-[#2453d3]" />
              </div>

              <div>
                <p className="text-xs text-[#2453d3] font-medium">
                  Call Support
                </p>

                <p className="font-bold text-[#2453d3] text-sm">
                  98423 44323
                </p>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/919842344323"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl px-4 py-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>

              <div>
                <p className="text-xs text-[#2453d3] font-medium">
                  WhatsApp Support
                </p>

                <p className="font-semibold text-[#2453d3] text-sm">
                  Chat with us
                </p>
              </div>
            </a>


          </div>
        </div>
      </section>
      
      {/* Custom CSS for hiding scrollbars but keeping functionality */}
      <style dangerouslySetContent={{__html: `
        .happy-customer-track {
            -ms-overflow-style: none;
            scrollbar-width: none;
            touch-action: pan-x;
            overscroll-behavior-x: contain;
            overscroll-behavior-y: none;
        }
        .happy-customer-track::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .scrollbar-thin::-webkit-scrollbar {
            width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
            background: #f1f1f1; 
            border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #c1c1c1; 
            border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8; 
        }
      `}} />
    </>
  );
}