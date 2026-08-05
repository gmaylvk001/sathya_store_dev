import dbConnect from "@/lib/db";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const categoryIds = searchParams.get('categoryIds')?.split(',') || [];
    const subcategoryIds = searchParams.get('subcategoryIds')?.split(',') || [];
    const brandIds = searchParams.get('brands')?.split(',') || [];
    const minPrice = parseFloat(searchParams.get('minPrice')) || 0;
    const maxPrice = parseFloat(searchParams.get('maxPrice')) || 1000000;
    const filterIds = searchParams.get('filters')?.split(',') || [];
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Base query
    let query = { status: "Active" };

    // Handle category and subcategory filters
    if (categoryIds.length > 0 || subcategoryIds.length > 0) {
      query.$or = [];
      
      if (categoryIds.length > 0) {
        query.$or.push({ category: { $in: categoryIds } });
      }
      
      if (subcategoryIds.length > 0) {
        query.$or.push({ sub_category: { $in: subcategoryIds } });
      }
    }

    // Add brand filters if any
    if (brandIds.length > 0) {
      query.brand = { $in: brandIds };
    }
    
    // Price range filter (considers both price and special_price)
    query.$and = [
      {
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
      }
    ];
    
    let productsQuery = Product.find(query).populate('brand', 'brand_name brand_slug');
  
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
      productsQuery = Product.find(query).populate('brand', 'brand_name brand_slug');
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
    
    return Response.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error in /api/product/filter:', error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}