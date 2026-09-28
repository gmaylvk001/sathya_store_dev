import dbConnect from "@/lib/db";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import ecom_category_info from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import { brandMatchQuery } from "@/lib/brandMatchQuery";
import { getFiltersForProductIds } from "@/lib/availableProductFilters";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const categorySlug = searchParams.get("categorySlug");
    const brandSlug = searchParams.get("brandSlug");
    const minPrice = parseFloat(searchParams.get("minPrice")) || 0;
    const maxPrice = parseFloat(searchParams.get("maxPrice")) || 1000000;
    const filterIds = (searchParams.get("filters")?.split(",") || []).filter(Boolean);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const categoryIdsParam = searchParams.get("categoryIds");
    const subcategoryIdsParam = searchParams.get("subcategoryIds");

    const selectedCategoryIds = categoryIdsParam
      ? categoryIdsParam.split(",")
      : [];

    const selectedSubcategoryIds = subcategoryIdsParam
      ? subcategoryIdsParam.split(",")
      : [];

    if (!categorySlug || !brandSlug) {
      return Response.json(
        { error: "Category or Brand missing" },
        { status: 400 },
      );
    }

    /* --------------------------------------------------
       1️⃣ Resolve CATEGORY hierarchy (parent → child → sub-child)
    -------------------------------------------------- */
    const parentCategory = await ecom_category_info.findOne({
      category_slug: categorySlug,
      status: "Active",
    });

    if (!parentCategory) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    const childCategories = await ecom_category_info.find({
      parentid: parentCategory._id,
      status: "Active",
    });

    const childIds = childCategories.map((c) => c._id);

    const subChildCategories = await ecom_category_info.find({
      parentid: { $in: childIds },
      status: "Active",
    });

    const categoryIdsArray = [
      parentCategory._id.toString(),
      ...childCategories.map((c) => c._id.toString()),
      ...subChildCategories.map((c) => c._id.toString()),
    ];

    /* --------------------------------------------------
       2️⃣ Resolve BRAND
    -------------------------------------------------- */
    const find_brand = await Brand.findOne({
      brand_slug: brandSlug,
      status: "Active",
    });

    if (!find_brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    /* --------------------------------------------------
       3️⃣ Price logic (special_price priority)
    -------------------------------------------------- */
    const priceClause = {
      $or: [
        {
          $and: [
            { special_price: { $nin: [null, 0] } },
            { special_price: { $gte: minPrice, $lte: maxPrice } },
          ],
        },
        {
          $and: [
            { $or: [{ special_price: null }, { special_price: 0 }] },
            { price: { $gte: minPrice, $lte: maxPrice } },
          ],
        },
      ],
    };

    /* --------------------------------------------------
       4️⃣ FINAL PRODUCT QUERY
    -------------------------------------------------- */

// const effectiveCategoryIds =
//   selectedCategoryIds.length > 0
//     ? selectedCategoryIds
//     : categoryIdsArray;

// const effectiveSubcategoryIds =
//   selectedSubcategoryIds.length > 0
//     ? selectedSubcategoryIds
//     : null;
     
// console.log("=== DEBUG ===");
// console.log("categorySlug:", categorySlug);
// console.log("brandSlug:", brandSlug);
// console.log("selectedCategoryIds:", selectedCategoryIds);
// console.log("selectedSubcategoryIds:", selectedSubcategoryIds);
// console.log("categoryIdsArray:", categoryIdsArray);
// console.log("effectiveCategoryIds:", effectiveCategoryIds);
// console.log("effectiveSubcategoryIds:", effectiveSubcategoryIds);

// const categoryMatchClause = effectiveSubcategoryIds
//   ? {
//       $or: [
//         { category: { $in: effectiveSubcategoryIds } },
//         { sub_category: { $in: effectiveSubcategoryIds } },
//       ],
//     }
//   : {
//       $or: [
//         { category: { $in: effectiveCategoryIds } },
//         { sub_category: { $in: effectiveCategoryIds } },
//       ],
//     };

let expandedCategoryIds = categoryIdsArray;

if (selectedSubcategoryIds.length > 0) {
  expandedCategoryIds = selectedSubcategoryIds;
} else if (selectedCategoryIds.length > 0) {
  const childrenOfSelected = await ecom_category_info.find({
    parentid: { $in: selectedCategoryIds },
    status: "Active",
  }).lean();

  const selectedChildIds = childrenOfSelected.map((c) => c._id.toString());

  const grandChildrenOfSelected = await ecom_category_info.find({
    parentid: { $in: selectedChildIds },
    status: "Active",
  }).lean();

  const selectedGrandChildIds = grandChildrenOfSelected.map((c) => c._id.toString());

  expandedCategoryIds = [
    ...new Set([
      ...selectedCategoryIds,
      ...selectedChildIds,
      ...selectedGrandChildIds,
    ]),
  ];
}

const categoryMatchClause = {
  $or: [
    { category: { $in: expandedCategoryIds } },
    { sub_category: { $in: expandedCategoryIds } },
  ],
};

let query = {
  status: "Active",
  $and: [
    brandMatchQuery(find_brand),
    categoryMatchClause, 
    priceClause,
    {
      $or: [
        { quantity: { $gt: 0 }, stock_status: "In Stock" },
        { quantity: { $exists: false }, stock_status: "In Stock" },
      ],
    },
  ],
};

    let productsQuery = Product.find(query);

    /* --------------------------------------------------
       5️⃣ Apply FILTERS (group-aware: OR within group, AND across groups)
    -------------------------------------------------- */
    if (filterIds.length > 0) {
      const productIds = await productsQuery.distinct("_id");
      const productIdStrings = productIds.map((id) => id.toString());

      const selectedFilterDocs = await Filter.find({ _id: { $in: filterIds } })
        .populate({ path: "filter_group", select: "filtergroup_name", model: FilterGroup })
        .lean();

      const filtersByGroup = {};
      selectedFilterDocs.forEach((f) => {
        const groupId = f.filter_group?._id?.toString() || f.filter_group || "other";
        if (!filtersByGroup[groupId]) filtersByGroup[groupId] = [];
        filtersByGroup[groupId].push(f._id.toString());
      });

      let matchingProductIds = new Set(productIdStrings);

      for (const groupFilterIds of Object.values(filtersByGroup)) {
        const groupProductFilters = await ProductFilter.find({
          $or: [
            { product_id: { $in: productIdStrings } },
            { product_id: { $in: productIds } },
          ],
          filter_id: { $in: groupFilterIds },
        }).lean();

        const groupMatchingIds = new Set(
          groupProductFilters.map((pf) => pf.product_id.toString())
        );

        matchingProductIds = new Set(
          [...matchingProductIds].filter((id) => groupMatchingIds.has(id))
        );

        if (matchingProductIds.size === 0) break;
      }

      query._id = { $in: [...matchingProductIds] };
      productsQuery = Product.find(query);
    }

    /* --------------------------------------------------
       6️⃣ Pagination
    -------------------------------------------------- */
    const skip = (page - 1) * limit;

    const products = await productsQuery
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
    const matchingIds = await Product.distinct("_id", query);
    const filters = await getFiltersForProductIds(matchingIds);

    return Response.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters,
    });
  } catch (error) {
    console.error("Error in category-brand filter:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
