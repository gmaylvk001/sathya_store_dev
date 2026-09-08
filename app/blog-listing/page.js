"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FiSearch, FiCalendar, FiClock, FiArrowRight } from "react-icons/fi";

// Pre-defined banner structure: ready for future admin integration
// Admin developer can connect `/api/blog-banner` or similar endpoint
const DEFAULT_BANNER = {
  image: "/uploads/blog/blog-banner-default.png",
  alt: "Sathya Blogs Banner",
  redirectUrl: "",
  isActive: true,
};

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculateReadTime(text) {
  if (!text) return "3 min read";
  const wordCount = stripHtml(text).split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

// ── Static Blogs for Frontend Display (Temporary disconnected from DB) ──
// Future developer can reconnect this to the new database API when ready
const STATIC_BLOGS = [
  {
    _id: "static-blog-1",
    blog_slug: "bosch-mixer-grinders-and-washing-machines",
    blog_name: "Bosch Mixer Grinders and Washing Machines: A Buyer's Guide for Indian Homes",
    description:
      "Bosch Mixer Grinders and Washing Machines: A Buyer's Guide for Indian Homes German engineering has a certain reputation for durable performance, advanced energy efficiency, and whisper-quiet operation in everyday modern households.",
    category: { category_name: "Washing Machine" },
    image:
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80",
    createdAt: "2026-09-04T00:00:00.000Z",
  },
  {
    _id: "static-blog-2",
    blog_slug: "frostguard-pro-refrigerator-guide",
    blog_name: "FrostGuard Pro1",
    description:
      "The FrostGuard Pro Double Door Refrigerator is the perfect blend of spacious design and advanced cooling technology. With multi-airflow and energy-saving inverter compressors, keep vegetables and perishables farm-fresh.",
    category: { category_name: "Large Appliances" },
    image:
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&auto=format&fit=crop&q=80",
    createdAt: "2025-08-28T00:00:00.000Z",
  },
  {
    _id: "static-blog-3",
    blog_slug: "sonic-vibes-sound-system-journal",
    blog_name: "Sonic Vibes The Sound System Journal",
    description:
      "Welcome to Sonic Vibes, your ultimate guide into the world of sound systems and audio experiences! Whether you are an audiophile or movie buff, find your perfect match with Dolby Atmos and surround sound clarity.",
    category: { category_name: "Dishwasher" },
    image:
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80",
    createdAt: "2025-06-12T00:00:00.000Z",
  },
];

export default function BlogListingPage() {
  const [bannerData, setBannerData] = useState(DEFAULT_BANNER);
  // Pure frontend static data - DB is disabled as requested
  const [blogs, setBlogs] = useState(STATIC_BLOGS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Dynamic Categories from the static blogs + standard categories
  const categories = useMemo(() => {
    const list = [
      "All",
      "Washing Machine",
      "Large Appliances",
      "Dishwasher",
      "Television",
      "Mobile Phones",
      "Air Conditioner",
      "Refrigerator",
    ];
    return list;
  }, []);

  // Filtered Blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchesCat =
        selectedCategory === "All" ||
        b.category?.category_name === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.blog_name?.toLowerCase().includes(q) ||
        stripHtml(b.description).toLowerCase().includes(q) ||
        b.category?.category_name?.toLowerCase().includes(q);

      return matchesCat && matchesSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* ── 1. Breadcrumb Bar ────────────────────────────────────────────── */}
      <div className="w-full border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs sm:text-sm font-semibold tracking-wider uppercase">
          <h2 className="text-gray-900 font-bold tracking-wider">BLOGS</h2>
          <nav className="flex items-center space-x-2 text-gray-500 font-medium">
            <Link
              href="/"
              className="hover:text-[#d72828] transition-colors font-medium"
            >
              HOME
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-semibold">BLOGS</span>
          </nav>
        </div>
      </div>

      {/* ── 2. Promotional Banner Section (Predefined Admin-Ready) ─────── */}
      {bannerData?.isActive && bannerData?.image && (
        <section className="w-full bg-white pt-3 pb-4 sm:pb-6 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-full overflow-hidden rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              {bannerData.redirectUrl ? (
                <Link href={bannerData.redirectUrl}>
                  <img
                    src={bannerData.image}
                    alt={bannerData.alt || "Sathya Blogs"}
                    className="w-full h-auto object-cover max-h-[380px]"
                  />
                </Link>
              ) : (
                <img
                  src={bannerData.image}
                  alt={bannerData.alt || "Sathya Blogs"}
                  className="w-full h-auto object-cover max-h-[380px]"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Main Blogs Content Area ──────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Row: Title & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              BLOGS
            </h1>
            {!loading && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-[#d72828] border border-red-200">
                {filteredBlogs.length} {filteredBlogs.length === 1 ? "article" : "articles"}
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles"
              className="w-full rounded-full border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-[#d72828] focus:outline-none focus:ring-2 focus:ring-[#d72828]/20 transition-all shadow-sm"
            />
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#d72828] text-white shadow-sm ring-2 ring-[#d72828]/20"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* ── 4. Blog Cards Grid ────────────────────────────────────────── */}
        {loading ? (
          // Skeleton Loaders
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden p-4 animate-pulse shadow-sm"
              >
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
                <div className="w-20 h-4 bg-gray-200 rounded mb-2" />
                <div className="w-3/4 h-5 bg-gray-200 rounded mb-3" />
                <div className="w-full h-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredBlogs.length > 0 ? (
          // Blog Items Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => {
              const slug = blog.blog_slug || blog._id;
              const excerpt = stripHtml(blog.description).slice(0, 120);
              const readTimeStr = calculateReadTime(blog.description);

              return (
                <article
                  key={blog._id}
                  className="group bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col hover:-translate-y-1"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/blog/${slug}`}
                    className="relative block aspect-[16/10] overflow-hidden bg-gray-100"
                  >
                    {blog.image ? (
                      <img
                        src={blog.image}
                        alt={blog.blog_name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/uploads/blog/blog-banner-default.png";
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                        Sathya Stores Blog
                      </div>
                    )}
                    {blog.category?.category_name && (
                      <span className="absolute top-3 left-3 bg-[#d72828] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                        {blog.category.category_name}
                      </span>
                    )}
                  </Link>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2.5">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="text-gray-400" />
                          {formatDate(blog.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FiClock className="text-gray-400" />
                          {readTimeStr}
                        </span>
                      </div>

                      {/* Title */}
                      <Link href={`/blog/${slug}`}>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug group-hover:text-[#d72828] transition-colors line-clamp-2 mb-2">
                          {blog.blog_name}
                        </h2>
                      </Link>

                      {/* Snippet */}
                      {excerpt && (
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
                          {excerpt}...
                        </p>
                      )}
                    </div>

                    {/* Footer Action */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <Link
                        href={`/blog/${slug}`}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#d72828] hover:text-[#b91c1c] transition-colors group-hover:translate-x-0.5 transition-transform"
                      >
                        Read Article
                        <FiArrowRight className="text-xs" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-lg font-bold text-gray-800 mb-2">
              No articles found
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery
                ? `No matching articles for "${searchQuery}". Try a different keyword.`
                : "Articles will appear here once added."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-[#d72828] text-white rounded-lg text-xs font-semibold hover:bg-[#b91c1c] transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
