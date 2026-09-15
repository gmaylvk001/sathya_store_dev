export function normalizeProduct(product, brandMap = {}) {
  if (!product) return null;

  const originalPrice = Number(product.price) || 0;
  const specialPriceRaw = Number(product.special_price) || 0;
  const hasDiscount = specialPriceRaw > 0 && specialPriceRaw < originalPrice;
  const currentPrice = hasDiscount ? specialPriceRaw : originalPrice;
  const discountPercent = hasDiscount
    ? Math.round(100 - (specialPriceRaw / originalPrice) * 100)
    : 0;

  const brandName =
    brandMap[product.brand] ||
    product.brand_name ||
    (typeof product.brand === "string" ? product.brand : "") ||
    "SATHYA";

  const inStock =
    (product.stock_status === "In Stock" || product.stock_status === "instock") &&
    Number(product.quantity) > 0;
  const quantity = Number(product.quantity) || 0;

  const ratingValue = Number(
    product.avgRating || product.rating || product.average_rating || 0
  );
  const reviewCount = Number(
    product.reviewCount || product.reviews_count || product.numReviews || 0
  );

  let imgSrc = "/uploads/products/placeholder.jpg";
  const tempURL = "https://www.sathya.store/img/product/";
  const imagepathname = product.images?.[0] || "";

  if (imagepathname) {
    if (imagepathname.startsWith("http")) {
      imgSrc = imagepathname;
    } else {
      imgSrc = `${tempURL}${imagepathname
        .replace(/^\/?(uploads\/products\/)?/, "")
        .replace(/^\/+/, "")}`;
    }
  }

  const _id = product._id || product.id || "";
  const slug = product.slug || _id;

  return {
    _id,
    slug,
    name: product.name || "",
    currentPrice,
    originalPrice,
    hasDiscount,
    discountPercent,
    brandName,
    inStock,
    quantity,
    ratingValue,
    reviewCount,
    imgSrc,
    movement: product.movement,
    special_price: product.special_price, // Needed by child cart component
  };
}
