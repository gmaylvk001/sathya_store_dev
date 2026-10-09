export function normalizeProduct(product, brandMap = {}) {
  if (!product) return null;

  const originalPrice = Number(product.price ?? product.originalPrice) || 0;
  const specialPriceRaw = Number(product.special_price) || 0;
  const hasDiscount = specialPriceRaw > 0 && specialPriceRaw < originalPrice;
  const currentPrice = hasDiscount ? specialPriceRaw : (Number(product.currentPrice) || originalPrice);
  const discountPercent = hasDiscount
    ? Math.round(100 - (specialPriceRaw / originalPrice) * 100)
    : (product.discountPercent || 0);

  const brandId = product.brand?._id || (typeof product.brand === "string" ? product.brand : null);
  const resolvedBrandMap = brandId && brandMap[brandId] ? brandMap[brandId] : "";

  let brandName =
    product.brand?.name ||
    product.brand?.brand_name ||
    product.brand_name ||
    resolvedBrandMap ||
    (typeof product.brand === "string" && !/^[0-9a-fA-F]{24}$/.test(product.brand) && product.brand.toUpperCase() !== "SATHYA" ? product.brand : "") ||
    (product.brandName && product.brandName.toUpperCase() !== "SATHYA" ? product.brandName : "") ||
    product.manufacturer_name ||
    "";

  if (!brandName && product.name) {
    const firstWord = product.name.trim().split(/\s+/)[0];
    const matchedBrand = Object.values(brandMap).find(
      (b) => b && b.toLowerCase() === firstWord.toLowerCase()
    );
    if (matchedBrand) {
      brandName = matchedBrand;
    } else if (/^windzy/i.test(product.name)) {
      brandName = "WINDZY";
    } else if (/^acer/i.test(product.name)) {
      brandName = "Acer";
    }
  }

  const inStock =
    product.inStock !== undefined
      ? Boolean(product.inStock)
      : ((product.stock_status === "In Stock" || product.stock_status === "instock") &&
        Number(product.quantity) > 0);
  const quantity = Number(product.quantity) || 0;

  const ratingValue = Number(
    product.avgRating || product.rating || product.average_rating || 0
  );
  const reviewCount = Number(
    product.reviewCount || product.reviews_count || product.numReviews || 0
  );

  let imgSrc = "/uploads/products/placeholder.jpg";
  const tempURL = "https://www.sathya.store/img/product/";
  const imagepathname = (Array.isArray(product.images) ? product.images[0] : null) || product.imgSrc || "";

  if (imagepathname) {
    if (imagepathname.startsWith("http")) {
      imgSrc = imagepathname;
    } else {
      imgSrc = `${tempURL}${imagepathname
        .replace(/^\/?(uploads\/products\/)?/, "")
        .replace(/^\/+/, "")}`;
    }
  } else if (product.imgSrc) {
    imgSrc = product.imgSrc;
  }

  const _id = product._id || product.id || "";
  const slug = product.slug || _id;

  return {
    ...product,
    _id,
    slug,
    name: product.name || "",
    currentPrice,
    originalPrice,
    price: originalPrice,
    special_price: product.special_price,
    hasDiscount,
    discountPercent,
    brand: product.brand || brandName,
    brand_name: product.brand_name || brandName,
    brandName,
    inStock,
    stock_status: product.stock_status || (inStock ? "In Stock" : "Out of Stock"),
    quantity,
    ratingValue,
    reviewCount,
    imgSrc,
    images: (Array.isArray(product.images) && product.images.length > 0) ? product.images : (imgSrc ? [imgSrc] : []),
    movement: product.movement,
  };
}
