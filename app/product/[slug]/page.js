import ProductClient from "./ProductClient";
import dbConnect from "@/lib/db";
import Product from "@/models/product";

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams?.slug;

  try {
    await dbConnect();
    const product = await Product.findOne({ slug })
      .select("name meta_title meta_description")
      .lean();

    if (product) {
      return {
        title: product.meta_title || `${product.name} | SATHYA Store`,
        description: product.meta_description || "Shop online at SATHYA Store",
      };
    }
  } catch (e) {
    // fallback
  }

  const cleanTitle = slug
    ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Product";

  return {
    title: `${cleanTitle} | SATHYA Store`,
  };
}

export default function ProductPage() {
  return <ProductClient />;
}
