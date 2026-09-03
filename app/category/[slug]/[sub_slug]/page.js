
import CategoryClient from "@/components/category/[slug]/[sub_slug]/page";
import CategoryOverviewPage from "@/components/categoryPageComponents/CategoryOverviewPage";
import RedirectToOverviewIfDesigned from "@/components/categoryPageComponents/RedirectToOverviewIfDesigned";
import { PAGE_TYPES } from "@/lib/categoryPageComponents/registry";

export async function generateMetadata({ params }) {
 // const { sub_slug } = params;
  const awaitedParams = await params;
    const sub_slug = awaitedParams.sub_slug;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(`${baseUrl}/api/categories/${sub_slug}`, {
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

export default async function Page({ params }) {
  const { slug, sub_slug } = await params;
  if (sub_slug === "overview") {
    return (
      <CategoryOverviewPage
        pageType={PAGE_TYPES.CATEGORY}
        slug={slug}
        listingSlugs={[slug]}
      />
    );
  }

  return (
    <>
      <RedirectToOverviewIfDesigned pageType={PAGE_TYPES.SUB_CATEGORY} />
      <CategoryClient />
    </>
  );
}
