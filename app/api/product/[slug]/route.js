import dbConnect from "@/lib/db";
import Product from "@/models/product";
import OwnerProduct from "@/models/OwnerProduct";
import { normalizeRegion } from "@/lib/regionHelper";
import { resolveProductPrice } from "@/lib/priceResolver";

export async function GET(request, context) {
  const { params } = await context;
  const { slug } = await params;
  await dbConnect();

  if (!slug) {
    return new Response(JSON.stringify({ message: "Missing product slug" }), {
      status: 400,
    });
  }

  try {
    const url = request?.url ? new URL(request.url) : null;
    const rawState =
      url?.searchParams.get("state") ||
      url?.searchParams.get("region") ||
      request.cookies?.get("sathya_location")?.value;

    let region = "tamilnadu";
    if (rawState) {
      try {
        if (rawState.startsWith("{")) {
          const parsed = JSON.parse(rawState);
          region = normalizeRegion(parsed.region || parsed.state || parsed.stateName);
        } else {
          region = normalizeRegion(rawState);
        }
      } catch {
        region = normalizeRegion(rawState);
      }
    }

    const product = await Product.findOne({ 
      slug, 
      status: "Active" // ✅ Only return active products
    }).lean();

    if (!product) {
      return new Response(JSON.stringify({ message: "Product not found" }), {
        status: 404,
      });
    }

    let ownerProduct = null;
    if (region === "karnataka") {
      ownerProduct = await OwnerProduct.findOne({
        $or: [{ product_id: product._id }, { product_item_code: product.item_code }],
        is_active: true,
      }).lean();
    }

    const priceInfo = resolveProductPrice(product, ownerProduct, region);

    const responseProduct = {
      ...product,
      price: priceInfo.price,
      special_price: priceInfo.special_price,
      quantity: priceInfo.stock,
      stock_status: priceInfo.inStock ? "In Stock" : "Out of Stock",
      isUnilet: priceInfo.isUnilet,
      resolvedRegion: region,
    };

    return new Response(JSON.stringify(responseProduct), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
    });
  }
}
