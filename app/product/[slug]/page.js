import { permanentRedirect, notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import ecom_category_info from "@/models/ecom_category_info";

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams?.slug;
  return {
    title: slug || "Product",
  };
}

export default async function ProductPage({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams?.slug;
  if (!slug) notFound();

  await dbConnect();
  const product = await Product.findOne({ slug }).select("category sub_category slug").lean();
  if (!product) notFound();

  const targetCatId = product.sub_category || product.category;
  let subSlug = "";
  let childSlug = "";

  if (targetCatId) {
    const childCat = await ecom_category_info.findById(targetCatId).lean();
    if (childCat) {
      childSlug = childCat.category_slug;
      if (childCat.parentid && childCat.parentid !== "none") {
        const parentCat = await ecom_category_info.findById(childCat.parentid).lean();
        if (parentCat) {
          subSlug = parentCat.category_slug;
        }
      }
      if (!subSlug) {
        subSlug = childSlug;
      }
    }
  }

  if (subSlug && childSlug) {
    permanentRedirect(`/category/${subSlug}/${childSlug}/${slug}`);
  }

  permanentRedirect(`/`);
}
