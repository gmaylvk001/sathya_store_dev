const assetFallbackUrl = (process.env.NEXT_PUBLIC_ASSET_FALLBACK_URL || "https://estore.bharathelectronics.in").replace(/\/+$/, "");
let assetHostname = "estore.bharathelectronics.in";
try {
  assetHostname = new URL(assetFallbackUrl).hostname;
} catch (e) {}

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
      {
        protocol: assetFallbackUrl.startsWith("http:") ? "http" : "https",
        hostname: assetHostname,
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "213.165.95.239",
        pathname: "/uploads/**",
      },
    ],
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: "/uploads/products/:path*",
          destination: `${assetFallbackUrl}/uploads/products/:path*`,
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/products",
        destination: "/",
        permanent: true,
      },
      {
        source: "/products/:slug",
        destination: "/product/:slug",
        permanent: true,
      },
      {
        source: "/weekend-offer",
        destination: "/deals-offer",
        permanent: true,
      },
      {
        source: "/offer/weekend-offer",
        destination: "/deals-offer",
        permanent: true,
      },
      {
        source: "/bundle-offer",
        destination: "/category/combo-offers",
        permanent: true,
      },
      {
        source: "/bundle-offers",
        destination: "/category/combo-offers",
        permanent: true,
      },
      {
        source: "/combo-offers",
        destination: "/category/combo-offers",
        permanent: true,
      },
      {
        source: "/big-discounts",
        destination: "/deals-offer",
        permanent: true,
      },
      {
        source: "/brand",
        destination: "/",
        permanent: true,
      },
      {
        source: "/location",
        destination: "https://sathya.adtarbo.com/stores",
        permanent: false,
      },
      {
        source: "/all/stores",
        destination: "https://sathya.adtarbo.com/stores",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
