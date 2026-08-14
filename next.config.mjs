/** @type {import('next').NextConfig} */
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
  async redirects() {
    return [
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
