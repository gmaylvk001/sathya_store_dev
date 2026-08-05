// app/blog/[slug]/page.js
import React from "react";
import Link from "next/link";

async function getBlogPost(slug) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/blogs/get?slug=${slug}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to fetch blog post");
    const { data } = await res.json();
    return data || null;
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

// ── Video embed helper ────────────────────────────────────────────────────────
function getYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function VideoEmbed({ url }) {
  if (!url) return null;

  const ytId = getYouTubeId(url);

  if (ytId) {
    return (
      <div className="mb-10 rounded-xl overflow-hidden shadow-lg aspect-video">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${ytId}`}
          title="BEA Expert Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Direct hosted video (mp4 etc.)
  return (
    <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
      <video
        className="w-full rounded-xl"
        src={url}
        controls
        playsInline
      />
    </div>
  );
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const blog = await getBlogPost(slug);

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Blog post not found</h1>
          <p className="text-gray-600 mb-6">The requested blog post could not be found.</p>
          <Link
            href="/blog"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const hasVideo = blog.video && blog.video.trim() !== "";

  return (
    <article className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium line-clamp-1">{blog.blog_name}</span>
        </nav>

        {/* Category badge */}
        {blog.category?.category_name && (
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
            {blog.category.category_name}
          </span>
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {blog.blog_name}
          </h1>
          <div className="flex items-center text-gray-500 text-sm gap-3">
            <span>
              Published on{" "}
              {new Date(blog.createdAt).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {hasVideo && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Video included
                </span>
              </>
            )}
          </div>
        </header>

        {/* Featured Image — show only if no video, or show above video */}
        {blog.image && !hasVideo && (
          <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
            <img
              src={blog.image}
              alt={blog.blog_name}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Video embed — shown first if present */}
        {hasVideo && <VideoEmbed url={blog.video} />}

        {/* If both image and video exist, show image as a thumbnail below video */}
        {blog.image && hasVideo && (
          <div className="mb-8 rounded-lg overflow-hidden shadow border border-gray-100">
            <img
              src={blog.image}
              alt={blog.blog_name}
              className="w-full h-56 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 mb-10">
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            {blog.description.split("\n").map((paragraph, index) =>
              paragraph.trim() ? (
                <p key={index} className="mb-5 last:mb-0">
                  {paragraph}
                </p>
              ) : null
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Share:</span>
            {/* WhatsApp share */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(blog.blog_name + " - " + (typeof window !== "undefined" ? window.location.href : ""))}`}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition"
              title="Share on WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 0-5.555 2.51-5.555 5.576 0 1.042.208 2.053.611 3.031L2.111 22l3.285-.994c.908.504 1.93.779 2.961.779 3.065 0 5.555-2.51 5.555-5.576 0-1.483-.574-2.876-1.604-3.922-.93-.946-2.16-1.46-3.573-1.46z" />
              </svg>
            </a>
          </div>
          <Link
            href="/blog"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm"
          >
            ← Back to all posts
          </Link>
        </footer>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlogPost(slug);

  return {
    title: blog?.blog_name || "Blog Post | BEA",
    description: blog?.description?.slice(0, 160) || "Read expert appliance guides from BEA",
    openGraph: {
      title: blog?.blog_name || "Blog Post | BEA",
      description: blog?.description?.slice(0, 160) || "Read expert appliance guides from BEA",
      images: blog?.image ? [{ url: blog.image }] : [],
    },
  };
}
