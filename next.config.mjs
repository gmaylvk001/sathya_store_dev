/** @type {import('next').NextConfig} */
const UPLOADS_ORIGIN =
  process.env.UPLOADS_ORIGIN || "https://bea.thamirabaranithiruvizha.in";

const nextConfig = {
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/categories/**",
      },
      {
        protocol: "https",
        hostname: "bea.thamirabaranithiruvizha.in",
        pathname: "/uploads/**",
      },
    ],
  },
  // No local public/uploads/products — send browsers straight to prod so
  // Next.js isn't flooded with 404 image requests during local dev.
  async redirects() {
    return [
      {
        source: "/uploads/products/:path*",
        destination: `${UPLOADS_ORIGIN}/uploads/products/:path*`,
        permanent: false,
      },
      {
        source: "/products/:slug",
        destination: "/product/:slug",
        permanent: true,
      },
      {
        source: "/brand",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
