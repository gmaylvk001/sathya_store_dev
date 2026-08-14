import dbConnect from "@/lib/db";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import Brand from "@/models/ecom_brand_info";
import ecom_category_info from "@/models/ecom_category_info";
import mongoose from "mongoose";
import { getFiltersForProductIds } from "@/lib/availableProductFilters";

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const categoryIds = (searchParams.get('categoryIds')?.split(',') || []).filter(Boolean);
    const subcategoryIds = (searchParams.get('subcategoryIds')?.split(',') || []).filter(Boolean);
    const brandIds = (searchParams.get('brands')?.split(',') || []).filter(Boolean);
    const minPrice = parseFloat(searchParams.get('minPrice')) || 0;
    const maxPrice = parseFloat(searchParams.get('maxPrice')) || 1000000;
    const filterIds = (searchParams.get('filters')?.split(',') || []).filter(Boolean);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Base query
    let query = { status: "Active" };
    const andClauses = [];

    let expandedCategoryIds = [...categoryIds, ...subcategoryIds];
    if (categoryIds.length > 0 && subcategoryIds.length === 0) {
      const children = await ecom_category_info.find({
        parentid: { $in: categoryIds },
        status: "Active",
      }).lean();
      const childIds = children.map((c) => c._id.toString());
      const grand = childIds.length
        ? await ecom_category_info.find({
            parentid: { $in: childIds },
            status: "Active",
          }).lean()
        : [];
      expandedCategoryIds = [
        ...new Set([
          ...categoryIds,
          ...childIds,
          ...grand.map((c) => c._id.toString()),
        ]),
      ];
    }

    if (expandedCategoryIds.length > 0) {
      andClauses.push({
        $or: [
          { category: { $in: expandedCategoryIds } },
          { sub_category: { $in: expandedCategoryIds } },
        ],
      });
    }

    // Add brand filters if any (products store brand as ObjectId string or name)
    if (brandIds.length > 0) {
      const validIds = brandIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      const brandDocs = validIds.length
        ? await Brand.find({ _id: { $in: validIds } }).select("brand_name").lean()
        : [];
      const brandNames = brandDocs
        .map((b) => String(b.brand_name || "").trim())
        .filter(Boolean);
      andClauses.push({
        $or: [
          { brand: { $in: brandIds } },
          ...(brandNames.length ? [{ brand: { $in: brandNames } }] : []),
        ],
      });
    }
    
    // Price range filter (considers both price and special_price)
    andClauses.push({
      $or: [
        { 
          $and: [
            { special_price: { $ne: null, $ne: 0 } },
            { special_price: { $gte: minPrice, $lte: maxPrice } }
          ]
        },
        { 
          $and: [
            { $or: [{ special_price: null }, { special_price: 0 }] },
            { price: { $gte: minPrice, $lte: maxPrice } }
          ]
        }
      ]
    });
    query.$and = andClauses;
    
    let productsQuery = Product.find(query);
  
    // Apply additional filters if any
    if (filterIds.length > 0) {
      const productIds = await productsQuery.distinct('_id');
      
      const productFilters = await ProductFilter.find({
        product_id: { $in: productIds },
        filter_id: { $in: filterIds }
      });
      
      const filtersByProduct = productFilters.reduce((acc, pf) => {
        const productId = pf.product_id.toString();
        if (!acc[productId]) acc[productId] = new Set();
        acc[productId].add(pf.filter_id.toString());
        return acc;
      }, {});
      
      // Get only product IDs that match all filters
      const filteredProductIds = productIds.filter(id => {
        const productId = id.toString();
        const productFilterIds = filtersByProduct[productId] || new Set();
        return filterIds.every(fid => productFilterIds.has(fid));
      });
      
      // Update the query to only include filtered products
      query._id = { $in: filteredProductIds };
      productsQuery = Product.find(query);
    }
    
    // Apply pagination
    const skip = (page - 1) * limit;
    const products = await productsQuery
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination info
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
        hasPrev: page > 1
      },
      filters,
    });
  } catch (error) {
    console.error('Error in /api/product/filter:', error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}