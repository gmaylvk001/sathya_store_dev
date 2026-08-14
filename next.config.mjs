/** @type {import('next').NextConfig} */
const UPLOADS_ORIGIN =
  process.env.UPLOADS_ORIGIN || "https://bea.thamirabaranithiruvizha.in";

const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "bea.thamirabaranithiruvizha.in",
        pathname: "/uploads/**",
      },
    ],
  },
  // Send browser requests for uploads straight to origin so
  // Next.js isn't flooded with 404 image requests during local dev.
  async redirects() {
    return [
      {
        source: "/uploads/:folder((?!sathyalogo\\.webp).*)/:path*",
        destination: `${UPLOADS_ORIGIN}/uploads/:folder/:path*`,
        permanent: false,
      },
      {
        source: "/uploads/:file((?!sathyalogo\\.webp$).*\\.[a-zA-Z0-9]+)",
        destination: `${UPLOADS_ORIGIN}/uploads/:file`,
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
