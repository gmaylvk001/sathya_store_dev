import dbConnect from "@/lib/db";
import ecom_category_info from "@/models/ecom_category_info";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import Brand from "@/models/ecom_brand_info"; 
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const {sub_slug} = await params;
    
    // Fetch category
    const category = await ecom_category_info.findOne({ category_slug: sub_slug });
    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }
    
    // Fetch products under this category
    /*
    const products = await Product.find({
      sub_category: category._id,
      status: "Active" 
    });
*/
    const products = await Product.find({
          status: "Active",
          sub_category_new: { 
            $regex: category.md5_cat_name,
            $options: "i"
          }, quantity: { $gt: 0 }
        });

    if (!products || products.length === 0) {
      return Response.json({ category, products: [], brands: [], filters: [] });
    }
    
     // ✅ 3. Extract valid brand IDs (skip empty/null)
           const brandIds = [
             ...new Set(
               products
                 .map((p) => p.brand)
                 .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
             ),
           ];
           let brandsWithCount = [];
           if (brandIds.length > 0) {
             // Fetch valid brands only
             const brands = await Brand.find({ _id: { $in: brandIds } });
              // Count products per brand
             const brandCountMap = products.reduce((acc, product) => {
               const brandId = product.brand?.toString();
               if (brandId) acc[brandId] = (acc[brandId] || 0) + 1;
               return acc;
             }, {});
       
             // Attach count to each brand
             brandsWithCount = brands.map((b) => ({
               ...b.toObject(),
               count: brandCountMap[b._id.toString()] || 0,
             }));
           }
    
    // Extract product IDs for filtering
    const productIds = products.map(product => product._id);
    const productFilters = await ProductFilter.find({ product_id: { $in: productIds } });

    //  // Count products per brand
    // const brandCountMap = products.reduce((acc, product) => {
    //   const brandId = product.brand?.toString();
    //   if (brandId) {
    //     acc[brandId] = (acc[brandId] || 0) + 1;
    //   }
    //   return acc;
    // }, {});

    // // Attach count to brands
    // const brandsWithCount = brands.map(b => ({
    //   ...b.toObject(),
    //   count: brandCountMap[b._id.toString()] || 0
    // }));
    
    // Extract unique filter IDs
    const filterIds = [...new Set(productFilters.map(pf => pf.filter_id))];
    const filters = await Filter.find({ _id: { $in: filterIds } }).populate({
            path: 'filter_group',
            select: 'filtergroup_name -_id',
            model: FilterGroup
          })
          .lean();
    // Add filter_group_name to filters
    const enrichedFilters = filters.map(filter => ({
        ...filter,
        filtergroup_name: filter.filter_group?.filtergroup_name || "Unknown"
      }));

      const formattedFilters = filters.map(filter => ({
        ...filter,
        filter_group_name: filter.filter_group?.filtergroup_name || 'No Group',
        filter_group: filter.filter_group?._id // Keep original ID
      }));
    return Response.json({ category, products, brands: brandsWithCount, filters: formattedFilters });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
