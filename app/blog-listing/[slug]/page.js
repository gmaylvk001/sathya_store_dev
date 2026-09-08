"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiCalendar, FiClock, FiArrowLeft, FiShare2 } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

// ── 1. Static Blog Database (Ready for Future Admin/DB Connection) ───────────
// Future developer can replace this dictionary with:
// const res = await fetch(`/api/blogs/get?slug=${slug}`);
// or direct database queries.
const BLOGS_DATABASE = {
  "choosing-the-right-cooling-solution-comparing-inverter-and-non-inverter-1.5-ton-split-acs": {
    slug: "choosing-the-right-cooling-solution-comparing-inverter-and-non-inverter-1.5-ton-split-acs",
    title: "Choosing the Right Cooling Solution: Comparing Inverter and Non-Inverter 1.5 Ton Split ACs",
    category: "AIR CONDITIONER",
    date: "03 Sep, 2026",
    author: "Admin",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=1200&auto=format&fit=crop&q=80",
    bannerImage: "/uploads/blog/blog-banner-default.png",
    paragraphs: [
      "When temperatures soar, choosing the ideal air conditioner becomes the top priority for every home. A 1.5-ton split AC is generally considered the sweet spot for medium-sized master bedrooms and living rooms (approx. 120 to 180 sq. ft.). However, the most common dilemma buyers face is choosing between Inverter ACs and Non-Inverter ACs.",
      "In this comprehensive buyer's guide from Sathya Stores, we break down energy consumption, cooling performance, durability, maintenance costs, and upfront prices so you can invest in the best cooling solution for your family."
    ],
    sections: [
      {
        heading: "What is an Inverter Split AC?",
        body: "Unlike traditional air conditioners, an inverter AC features a variable-speed compressor. Instead of shutting off when the room reaches the set temperature, the compressor slows down to maintain the desired temperature continuously. This eliminates frequent power spikes, resulting in up to 30% to 50% lower electricity bills."
      },
      {
        heading: "What is a Non-Inverter Split AC?",
        body: "A non-inverter AC operates on a fixed-speed compressor that runs at full capacity until the thermostat detects the set temperature, after which it completely shuts off. When the room warms up again, it restarts with a surge of power. While more affordable initially, they tend to draw more power over long operating hours."
      },
      {
        heading: "Quick Comparison: Which One Should You Buy?",
        list: [
          "Choose an Inverter AC if: You plan to run your AC for more than 5-6 hours daily, sleep with it throughout the night, or prioritize lower electricity bills.",
          "Choose a Non-Inverter AC if: You only use the AC for 2-3 hours during peak summer afternoons or need an economical cooling unit for a guest room.",
          "Star Rating Matters: Always aim for a 4-Star or 5-Star BEE rated model equipped with 100% copper condenser coils and anti-corrosive blue/gold fin coatings.",
          "Smart Features: Modern models from Daikin, Voltas, LG, and Lloyd now feature Wi-Fi voice control, PM 2.5 air purification filters, and stabilizer-free operation."
        ]
      }
    ]
  },
  "bosch-mixer-grinders-and-washing-machines": {
    slug: "bosch-mixer-grinders-and-washing-machines",
    title: "Bosch Mixer Grinders and Washing Machines: A Buyer's Guide for Indian Homes",
    category: "WASHING MACHINE",
    date: "04 Sep, 2026",
    author: "Admin",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=1200&auto=format&fit=crop&q=80",
    bannerImage: "/uploads/blog/blog-banner-default.png",
    paragraphs: [
      "German engineering has a celebrated global reputation for durable quality, precision, and longevity. When it comes to home appliances in Indian households, Bosch has emerged as one of the most reliable and trusted premium brands.",
      "From grinding tough stone ground masalas in heavy-duty mixer grinders to gentle fabric care in front-load washing machines with EcoSilence Drive, here is everything you need to know before making a purchase."
    ],
    sections: [
      {
        heading: "Why Bosch Front-Load Washing Machines Excel",
        body: "Bosch washing machines are powered by frictionless EcoSilence Drive brushless motors that minimize motor heat and wear. With features like ActiveWater Plus that senses load weight to save water and AntiVibration side walls, your laundry experience remains whisper quiet."
      },
      {
        heading: "Tough Performance: Bosch TrueMixx Mixer Grinders",
        body: "Indian cooking requires heavy grinding for batters and spice powders. Bosch TrueMixx grinders use uniquely designed PoundingBlade technology that simulates traditional stone-pounding action to retain authentic flavors and textures."
      }
    ]
  },
  "frostguard-pro-refrigerator-guide": {
    slug: "frostguard-pro-refrigerator-guide",
    title: "FrostGuard Pro1: The Ultimate Double Door Refrigerator Experience",
    category: "LARGE APPLIANCES",
    date: "28 Aug, 2025",
    author: "Admin",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=1200&auto=format&fit=crop&q=80",
    bannerImage: "/uploads/blog/blog-banner-default.png",
    paragraphs: [
      "The FrostGuard Pro Double Door Refrigerator is designed to cater to modern Indian culinary needs. Featuring expansive convertible storage zones and multi-airflow surround cooling vents, it preserves freshness for up to 15 days.",
      "Smart inverter compressors adjust cooling speeds based on internal food load, minimizing noise while optimizing daily energy efficiency."
    ],
    sections: [
      {
        heading: "Key Highlights & Technology",
        list: [
          "Convertible 5-in-1 Modes: Switch freezer to fridge during parties or festive seasons.",
          "Deodorizing Bio-Silver Filter: Neutralizes food odors and eliminates bacteria.",
          "Toughened Glass Shelves: Easily hold heavy vessels and large cookers up to 150 kg."
        ]
      }
    ]
  },
  "sonic-vibes-sound-system-journal": {
    slug: "sonic-vibes-sound-system-journal",
    title: "Sonic Vibes The Sound System Journal",
    category: "DISHWASHER & ENTERTAINMENT",
    date: "12 Jun, 2025",
    author: "Admin",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200&auto=format&fit=crop&q=80",
    bannerImage: "/uploads/blog/blog-banner-default.png",
    paragraphs: [
      "Welcome to Sonic Vibes, your ultimate guide into the world of sound systems and home entertainment. Whether you are setting up a cinema hall in your living room or looking for a compact soundbar, selecting the right acoustic configuration transforms movies and music alike."
    ],
    sections: [
      {
        heading: "Soundbar vs Full Home Theater Setup",
        body: "Soundbars provide crystal clear voice clarity and deep bass in a sleek form factor that sits right below your television. For true 3D spatial surround sound, multi-channel Dolby Atmos systems with wireless subwoofers and rear satellite speakers deliver theater-like immersion."
      }
    ]
  }
};

// ── 2. Other Blogs Sidebar List (Matches Sathya Store Design) ────────────────
const OTHER_BLOGS_LIST = [
  {
    slug: "ifb-vs-bosch-vs-lg-washing-machine-brand-comparison",
    title: "IFB vs Bosch vs LG: Washing Machine Brand Comparison",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300&auto=format&fit=crop&q=80",
  },
  {
    slug: "setting-up-a-new-home-festive-season-checklist",
    title: "Setting Up a New Home This Festive Season: A Room-by-Room Appliance Checklist",
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300&auto=format&fit=crop&q=80",
  },
  {
    slug: "exchange-offer-guide-best-value-appliances",
    title: "Exchange Offer Guide: How to Get the Best Value for Your Old Appliances",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&auto=format&fit=crop&q=80",
  },
  {
    slug: "choosing-the-right-cooling-solution-comparing-inverter-and-non-inverter-1.5-ton-split-acs",
    title: "Choosing the Right Cooling Solution: Comparing Inverter and Non-Inverter 1.5 Ton Split ACs",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300&auto=format&fit=crop&q=80",
  },
  {
    slug: "bosch-mixer-grinders-and-washing-machines",
    title: "Bosch Mixer Grinders and Washing Machines: A Buyer's Guide for Indian Homes",
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300&auto=format&fit=crop&q=80",
  }
];

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug;

  // Lookup matching blog or default to the featured AC blog
  const blog = useMemo(() => {
    if (slug && BLOGS_DATABASE[slug]) {
      return BLOGS_DATABASE[slug];
    }
    // Fallback default blog matching user's screenshot
    return (
      BLOGS_DATABASE[
        "choosing-the-right-cooling-solution-comparing-inverter-and-non-inverter-1.5-ton-split-acs"
      ] || Object.values(BLOGS_DATABASE)[0]
    );
  }, [slug]);

  // Sidebar blogs excluding currently active article
  const sidebarBlogs = useMemo(() => {
    return OTHER_BLOGS_LIST.filter((item) => item.slug !== blog.slug);
  }, [blog.slug]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* ── 1. Top Bar / Breadcrumb ──────────────────────────────────────── */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1">
            BLOG
          </h1>
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 font-medium">
            <Link
              href="/"
              className="hover:text-[#d72828] transition-colors"
            >
              Home
            </Link>
            <span className="text-gray-400">&gt;</span>
            <Link
              href="/blog-listing"
              className="hover:text-[#d72828] transition-colors"
            >
              Blog
            </Link>
          </nav>
        </div>
      </div>

      {/* ── 2. Top Promotional Banner ────────────────────────────────────── */}
      <section className="w-full bg-white pt-2 pb-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-gray-50">
            <img
              src="/uploads/blog/blog-banner-default.png"
              alt="Sathya Blogs Promotional Banner"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="w-full h-auto object-cover max-h-[340px]"
            />
          </div>
        </div>
      </section>

      {/* ── 3. Main 2-Column Content Grid ─────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ── Left Column: Main Article (~68% width) ────────────────────── */}
          <article className="lg:col-span-8">
            {/* Category with Red Dash */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-0.5 bg-[#d72828] inline-block" />
              <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-[#d72828]">
                {blog.category}
              </span>
            </div>

            {/* Editorial Serif Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1e3860] leading-tight sm:leading-snug mb-4">
              {blog.title}
            </h1>

            {/* Meta Row */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-6 font-medium">
              <span className="w-3 h-0.5 bg-[#d72828] inline-block mr-1" />
              <span>{blog.date}</span>
              <span>•</span>
              <span className="text-gray-700 font-semibold">{blog.author}</span>
              {blog.readTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <FiClock className="text-xs" />
                    {blog.readTime}
                  </span>
                </>
              )}
            </div>

            {/* Featured Article Image */}
            {blog.image && (
              <div className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-gray-100">
                <img
                  src={blog.image}
                  alt={blog.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/uploads/blog/blog-banner-default.png";
                  }}
                  className="w-full h-auto object-cover max-h-[440px]"
                />
              </div>
            )}

            {/* Article Body Content */}
            <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed text-sm sm:text-base space-y-5">
              {blog.paragraphs?.map((p, idx) => (
                <p key={idx} className="leading-relaxed text-gray-700">
                  {p}
                </p>
              ))}

              {blog.sections?.map((sec, idx) => (
                <div key={idx} className="pt-4">
                  {sec.heading && (
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 text-[#1e3860]">
                      {sec.heading}
                    </h2>
                  )}
                  {sec.body && (
                    <p className="leading-relaxed text-gray-700 mb-4">{sec.body}</p>
                  )}
                  {sec.list && (
                    <ul className="space-y-2.5 my-3 list-disc pl-5 text-gray-700">
                      {sec.list.map((item, lIdx) => (
                        <li key={lIdx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Article Footer: Social Share & Back Button */}
            <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/blog-listing"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#d72828] hover:text-[#b91c1c] transition-colors"
              >
                <FiArrowLeft className="text-base" />
                Back to All Blogs
              </Link>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium">Share this article:</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    blog.title + (shareUrl ? " - " + shareUrl : "")
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-semibold hover:bg-green-600 transition-colors shadow-sm"
                  title="Share on WhatsApp"
                >
                  <FaWhatsapp className="text-sm" />
                  WhatsApp
                </a>
              </div>
            </div>
          </article>

          {/* ── Right Column: Other Blogs Sidebar (~32% width) ────────────── */}
          <aside className="lg:col-span-4 lg:pl-4">
            <div className="sticky top-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 tracking-tight">
                Other Blogs
              </h2>

              <div className="space-y-5">
                {sidebarBlogs.map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/blog-listing/${item.slug}`}
                    className="group flex items-center gap-3.5 p-2 rounded-xl hover:bg-gray-50/80 transition-all duration-200"
                  >
                    {/* Thumbnail Image */}
                    <div className="w-24 h-18 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 shadow-sm">
                      <img
                        src={item.image}
                        alt={item.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/uploads/blog/blog-banner-default.png";
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug line-clamp-2 sm:line-clamp-3 group-hover:text-[#d72828] transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
