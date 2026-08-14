"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiRotateCcw,
  FiShield,
  FiBox,
  FiUser,
  FiPhone,
  FiMail,
  FiPlus,
  FiMinus,
  FiCheck,
} from "react-icons/fi";
import {
  MdOutlineRemoveShoppingCart,
  MdOutlineReportProblem,
  MdVerifiedUser,
  MdCurrencyRupee,
  MdOutlineEventAvailable,
  MdOutlinePayments,
  MdOutlinePublishedWithChanges,
  MdOutlineShield,
  MdVerified,
  MdSecurity,
  MdLocalShipping,
  MdAutorenew,
  MdStorefront,
  MdCreditCard,
  MdOutlineTv,
  MdOutlineAcUnit,
  MdOutlineKitchen,
  MdOutlineLocalLaundryService,
  MdOutlineLaptopMac,
  MdOutlinePhoneIphone,
  MdOutlineBlender,
  MdOutlineSpeaker,
} from "react-icons/md";
import { BsArrowRepeat } from "react-icons/bs";
import { FaWhatsapp } from "react-icons/fa";

const features = [
  {
    icon: <MdOutlineEventAvailable className="text-2xl text-green-600" />,
    bg: "bg-green-50",
    title: "Easy Cancellation Assistance",
    desc: "Requests reviewed before order processing or dispatch.",
  },
  {
    icon: <FiBox className="text-2xl text-purple-600" />,
    bg: "bg-purple-50",
    title: "Damaged Product Support",
    desc: "Report within the policy timeline for quick resolution.",
  },
  {
    icon: <MdOutlinePayments className="text-2xl text-indigo-600" />,
    bg: "bg-indigo-50",
    title: "Secure Refund Process",
    desc: "Safe & timely refunds through trusted payment methods.",
  },
  {
    icon: <FiShield className="text-2xl text-orange-600" />,
    bg: "bg-orange-50",
    title: "Brand Warranty Support",
    desc: "Support through authorized brand service partners.",
  },
];

const policySections = [
  {
    icon: <MdOutlineRemoveShoppingCart className="text-2xl text-customBlue" />,
    title: "1. Cancellation Policy",
    desc: (
      <>
        <p className="text-gray-600">
          Cancellation requests can be reviewed only if made immediately
          after placing the order and before the product has been dispatched
          or installation process has started. Once the product is shipped or
          installation is in progress, cancellation may not be possible.
        </p>
        <p className="text-gray-600 mt-3">
          For cancellations, please contact our Customer Care team with your
          order details for assistance.
        </p>
      </>
    ),
  },
  {
    icon: <MdOutlineReportProblem className="text-2xl text-customBlue" />,
    title: "2. Damaged or Defective Items",
    desc: (
      <p className="text-gray-600">
        If you receive a damaged or defective product, please contact Sathya Stores
        Customer Care within 7 days of delivery with your order details and
        images/videos of the issue. Our team will verify the concern and
        assist with replacement or refund as per product and brand
        guidelines.
      </p>
    ),
  },
  {
    icon: <FiUser className="text-2xl text-customBlue" />,
    title: "3. Product Complaints",
    desc: (
      <p className="text-gray-600">
        If you feel that the product received is not as shown on the website
        or not as expected, please inform our Customer Care team within 7
        days of delivery. Our team will review your complaint and take the
        appropriate action.
      </p>
    ),
  },
  {
    icon: <MdVerifiedUser className="text-2xl text-customBlue" />,
    title: "4. Manufacturer Warranty Support",
    desc: (
      <p className="text-gray-600">
        Products covered under manufacturer warranty will receive support
        through authorized brand service partners. Sathya Stores will help customers
        connect with the respective brand service team whenever required.
      </p>
    ),
  },
  {
    icon: (
      <span className="relative inline-flex items-center justify-center text-2xl text-customBlue">
        <BsArrowRepeat />
        <MdCurrencyRupee className="absolute text-xs" />
      </span>
    ),
    title: "5. Refund Processing Timeline",
    desc: (
      <p className="text-gray-600">
        Once the cancellation or refund request is approved, the refund will
        be processed within the applicable timeline based on payment method
        and banking partners.
      </p>
    ),
  },
];

const categories = [
  { icon: <MdOutlineTv className="text-3xl text-customBlue" />, label: "Televisions" },
  { icon: <MdOutlineAcUnit className="text-3xl text-customBlue" />, label: "Air Conditioners" },
  { icon: <MdOutlineKitchen className="text-3xl text-customBlue" />, label: "Refrigerators" },
  { icon: <MdOutlineLocalLaundryService className="text-3xl text-customBlue" />, label: "Washing Machines" },
  { icon: <MdOutlineLaptopMac className="text-3xl text-customBlue" />, label: "Laptops" },
  { icon: <MdOutlinePhoneIphone className="text-3xl text-customBlue" />, label: "Mobiles" },
  { icon: <MdOutlineBlender className="text-3xl text-customBlue" />, label: "Kitchen Appliances" },
  { icon: <MdOutlineSpeaker className="text-3xl text-customBlue" />, label: "Audio Products" },
];

const helpPoints = [
  "Cancellation assistance",
  "Return & refund support",
  "Product-related queries",
  "Warranty & service support",
];

const faqs = [
  {
    q: "1. Can I cancel my Sathya Stores order?",
    a: "Yes, you can cancel your order immediately after placing it, as long as it has not been dispatched or installation has not started. Please contact our Customer Care team with your order details.",
  },
  {
    q: "2. How long does Sathya Stores take to process refunds?",
    a: "Once your cancellation or refund request is approved, the refund will be processed within the applicable timeline based on your payment method and banking partner.",
  },
  {
    q: "3. What should I do if my appliance is damaged during delivery?",
    a: "Please contact Sathya Stores Customer Care within 7 days of delivery along with images/videos of the issue. Our team will verify and assist with a replacement or refund.",
  },
  {
    q: "4. Are installed products eligible for return?",
    a: "Once installation has started or been completed, the product is generally not eligible for cancellation or return, except in cases of verified manufacturing defects.",
  },
  {
    q: "5. Does Sathya Stores provide warranty support?",
    a: "Yes, products covered under manufacturer warranty receive support through our authorized brand service partners, and our team will help you connect with them.",
  },
  {
    q: "6. How can I contact Sathya Stores customer care?",
    a: "You can reach us via phone, WhatsApp, or email. Our contact details are listed in the Need Help section above.",
  },
];

// const trustBadges = [
//   { icon: <MdVerified className="text-3xl text-customBlue" />, title: "100% Original", subtitle: "Products" },
//   { icon: <MdSecurity className="text-3xl text-customBlue" />, title: "2 Year Warranty", subtitle: "On Select Products" },
//   { icon: <MdLocalShipping className="text-3xl text-customBlue" />, title: "Fast Delivery", subtitle: "Across Tamil Nadu" },
//   { icon: <MdAutorenew className="text-3xl text-customBlue" />, title: "Easy Returns", subtitle: "Hassle Free" },
//   { icon: <MdStorefront className="text-3xl text-customBlue" />, title: "Best Prices", subtitle: "Top Brands" },
//   { icon: <MdCreditCard className="text-3xl text-customBlue" />, title: "No Cost EMI", subtitle: "Easy EMI Options" },
// ];

const CancellationrefundComponent = () => {
  const [currentDate, setCurrentDate] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-0 sm:px-3 md:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="max-w-12xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-customBlue">
            Home
          </Link>
          <span>›</span>
          <Link href="/privacypolicy" className="hover:text-customBlue">
            Policies
          </Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">
            Cancellation & Refund Policy
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-12xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-red-100 text-customBlue mb-6">
              <FiRotateCcw className="text-xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-customBlue mb-4">
              Cancellation & Refund Policy
            </h1>
            <p className="text-lg text-gray-700 font-medium mb-3">
              Easy cancellations, transparent refunds & reliable support for
              your electronics and home appliance purchases.
            </p>
            <p className="text-gray-500 mb-4 leading-relaxed">
              At Sathya Stores, we are committed to
              providing a smooth shopping experience for TVs, refrigerators,
              washing machines, air conditioners and other appliances
              purchased online or from our stores.
            </p>
            {currentDate && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span role="img" aria-label="calendar">
                  📅
                </span>
                <span>Last updated: {currentDate}</span>
              </div>
            )}
          </div>

           {/* Right illustration */}
          <div className="relative flex flex-row items-center justify-center gap-4 sm:gap-8 w-full">
            
            {/* 1. Image Container (Left side) */}
            <div className="relative w-3/4 max-w-[480px] flex-shrink-0">
              <img
                src="/uploads/cancellation-refund/BEA_Care.png"
                alt="Cancellation and Refund"
                className="w-full h-auto object-contain"
              />
            </div>

            {/* 2. Vertical Features List (Right side) */}
            <div className="flex flex-col gap-4 sm:gap-6 flex-shrink-0">
              
              {/* Feature 1 */}
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-red-50 border border-red-100 text-[#d72828] shadow-sm flex-shrink-0">
                  <MdVerifiedUser className="text-base sm:text-xl" />
                </span>
                <span className="text-[11px] sm:text-sm font-semibold text-gray-800 leading-tight">
                  Easy<br />Cancellations
                </span>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-red-50 border border-red-100 text-[#d72828] shadow-sm flex-shrink-0">
                  <MdOutlinePublishedWithChanges className="text-base sm:text-xl" />
                </span>
                <span className="text-[11px] sm:text-sm font-semibold text-gray-800 leading-tight">
                  Secure<br />Refunds
                </span>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-red-50 border border-red-100 text-[#d72828] shadow-sm flex-shrink-0">
                  <MdOutlineShield className="text-base sm:text-xl" />
                </span>
                <span className="text-[11px] sm:text-sm font-semibold text-gray-800 leading-tight">
                  Reliable<br />Support
                </span>
              </div>

            </div>
          </div>
          </div>
          </div>

      {/* Feature cards */}
      <div className="max-w-12xl mx-auto px-4 md:px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow"
            >
              <div
                className={`w-14 h-14 ${feature.bg} rounded-full flex items-center justify-center mx-auto mb-4`}
              >
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Sections */}
      <div className="max-w-12xl mx-auto px-4 md:px-6 pb-12 space-y-4">
        {policySections.map((section, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white border border-gray-100 rounded-xl shadow-sm p-6"
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                {section.icon}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-customBlue mb-2">
                {section.title}
              </h2>
              {section.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Applicable Product Categories */}
      <div className="max-w-12xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-2xl font-bold text-customBlue mb-2">
          Applicable Product Categories
        </h2>
        <p className="text-gray-500 mb-6">
          This policy is applicable to the following product categories sold
          on Sathya Stores online and in-store.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
            >
              <div className="mb-2">{cat.icon}</div>
              <span className="text-sm font-medium text-gray-700">
                {cat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

    {/* Need Help Section */}
     <div className="max-w-12xl mx-auto px-4 md:px-6 pb-12">
        {/* CHANGED: flex-col on mobile, flex-row on extra-large screens so both cards sit side-by-side */}
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Card 1: Contact Info (Left Side) */}
          <div className="flex-1 bg-[#f8faff] rounded-2xl p-6 lg:p-8 flex flex-col justify-between border border-red-50 shadow-sm">
            <div className="mb-6 lg:mb-8">
              <h3 className="text-xl font-bold text-customBlue mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                Our customer support team is here to make your experience smooth and hassle-free.
              </p>
            </div>

            {/* The 3 Contact Sections arranged horizontally */}
            <div className="flex flex-row items-start justify-between gap-2 sm:gap-4">
              
              {/* Call Us */}
               <a
                href="tel:9842344323">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 flex-1 text-center sm:text-left">
                <FiPhone className="text-xl sm:text-2xl text-customBlue flex-shrink-0 mt-1" />
                <div>
                  <p className="text-[12px] font-bold text-customBlue mb-0.5">Call Us</p>
                  <p className="font-bold text-gray-900 text-[12px] sm:text-[13px]">9842344323</p>
                  <p className="text-[10px] text-gray-500 font-semibold whitespace-nowrap">(9 AM - 9 PM)</p>
                </div>
              </div>
              </a>

              {/* Vertical Divider */}
              <div className="w-px h-12 bg-gray-200 self-center hidden sm:block"></div>

              {/* WhatsApp Us */}
               <a
                href="https://wa.me/919842344323"
                target="_blank"
                rel="noopener noreferrer">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 flex-1 text-center sm:text-left">
                <FaWhatsapp className="text-xl sm:text-2xl text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-[12px] font-bold text-green-500 mb-0.5">WhatsApp Us</p>
                  <p className="font-bold text-gray-900 text-[12px] sm:text-[13px]">9842344323</p>
                  <p className="text-[10px] text-gray-500 font-semibold whitespace-nowrap">Chat on WhatsApp</p>
                </div>
              </div>
              </a>

              {/* Vertical Divider */}
              <div className="w-px h-12 bg-gray-200 self-center hidden sm:block"></div>

              {/* Email Us */}
              <a
                href="mailto:customercare@sathya.store">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 flex-1 text-center sm:text-left">
                <FiMail className="text-xl sm:text-2xl text-customBlue flex-shrink-0 mt-1" />
                <div>
                  <p className="text-[12px] font-bold text-customBlue mb-0.5">Email Us</p>
                  <p className="font-bold text-gray-900 text-[11px] sm:text-[12px] break-all">
                    customercare@<br className="hidden xl:block" />sathya.store
                  </p>
                </div>
              </div>
             </a>
            </div>
          </div>

          {/* Card 2: Team Photo & Checklist (Right Side) */}
          <div className="flex-1 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col sm:flex-row">
            
            {/* Image Side */}
            <div className="w-full sm:w-[45%] lg:w-1/2 relative h-48 sm:h-auto">
              <img
                src="/uploads/cancellation-refund/BEA_support.png"
                alt="Sathya Stores Support Team"
                className="w-full h-full object-cover object-top"
              />
              {/* Fade gradient to blend image smoothly into the white background */}
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent hidden sm:block"></div>
            </div>

            {/* Checklist Side */}
            <div className="w-full sm:w-[55%] lg:w-1/2 p-6 sm:p-4 lg:p-8 flex flex-col justify-center">
              <h4 className="text-customBlue text-lg font-bold mb-4 lg:mb-5">
                We&apos;re here to help you!
              </h4>
              <ul className="space-y-3">
                {helpPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-gray-800 text-[13px] font-semibold"
                  >
                    <FiCheck className="text-green-500 text-lg flex-shrink-0" strokeWidth={3} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            
          </div>

        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-12xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-2xl font-bold text-customBlue mb-6">
          Frequently Asked Questions – Sathya Stores Cancellation & Refund
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between text-left px-5 py-4 font-medium text-gray-800"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <FiMinus className="text-customBlue flex-shrink-0 ml-2" />
                ) : (
                  <FiPlus className="text-customBlue flex-shrink-0 ml-2" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4 text-sm text-gray-600">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm py-8 px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {trustBadges.map((badge, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="mb-2">{badge.icon}</div>
              <p className="text-sm font-semibold text-gray-800">
                {badge.title}
              </p>
              <p className="text-xs text-gray-500">{badge.subtitle}</p>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default CancellationrefundComponent;