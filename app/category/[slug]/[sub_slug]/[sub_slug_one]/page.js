
import CategoryClient from "@/components/category/[slug]/[sub_slug]/[sub_slug_one]/page";

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const sub_slug_one = awaitedParams.sub_slug_one;
  const sub_slug = awaitedParams.sub_slug;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
 // console.log('sub_slug_one',sub_slug_one);
  try {
    const res = await fetch(`${baseUrl}/api/categories/${sub_slug_one}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "Category Not Found",
        description: "This category does not exist",
      };
    }

    const data = await res.json();
    const category = data.main_category;
    //console.log('category',category);
    return {
      //title: category.meta_title || category.category_name,
      title:
  category.meta_title && category.meta_title !== "none"
    ? category.meta_title
    : category.category_name,
     description:
        category.meta_description && category.meta_description !== "none"
    ? category.meta_description
    : `Browse products in ${category.category_name}`,
      keywords: category.meta_keyword || "",

      openGraph: {
        title:
  category.meta_title && category.meta_title !== "none"
    ? category.meta_title
    : category.category_name,
     description:
        category.meta_description && category.meta_description !== "none"
    ? category.meta_description
    : `Browse products in ${category.category_name}`,
        url: `${baseUrl}/category/${sub_slug}`,
        images: category.image ? [`${baseUrl}${category.image}`] : [],
        type: "website",
      },

      twitter: {
        card: "summary_large_image",
        title:
  category.meta_title && category.meta_title !== "none"
    ? category.meta_title
    : category.category_name,
     description:
        category.meta_description && category.meta_description !== "none"
    ? category.meta_description
    : `Browse products in ${category.category_name}`,
      },
    };
  } catch {
    return {
      title: "Category",
      description: "Browse products by category",
    };
  }
}

export default function Page() {
  return <CategoryClient />;
}
