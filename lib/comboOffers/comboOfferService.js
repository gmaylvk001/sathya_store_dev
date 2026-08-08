import md5 from "md5";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import { resolveStockStatus } from "./stockEngine";
import { syncComboLifecycleStatus } from "./expiryEngine";
import {
  ensureComboOffersCategory,
  syncComboCategoryVisibility,
} from "./categoryVisibilityService";

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(base) {
  let slug = slugify(base) || `combo-${Date.now()}`;
  let n = 0;
  while (await Product.findOne({ slug })) {
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
  return slug;
}

async function buildCategoryChain(categoryId) {
  let md5_chain = [];
  let name_chain = [];
  let id_chain = [];

  let current = await Category.findById(categoryId);
  if (!current) {
    return { md5_chain: "", name_chain: "", root_md5: "" };
  }

  md5_chain.push(current.md5_cat_name);
  name_chain.push(current.category_name);
  id_chain.push(current._id.toString());

  while (current.parentid && current.parentid !== "none") {
    const parent = await Category.findById(current.parentid);
    if (!parent) break;
    md5_chain.push(parent.md5_cat_name);
    name_chain.push(parent.category_name);
    id_chain.push(parent._id.toString());
    current = parent;
  }

  md5_chain.reverse();
  name_chain.reverse();

  return {
    md5_chain: md5_chain.join("##"),
    name_chain: name_chain.join("##"),
    root_md5: md5_chain[0] || "",
  };
}

/**
 * Create or update the sellable Product linked to a ComboOffer.
 */
export async function upsertComboProduct(combo, { images = [] } = {}) {
  const category = await ensureComboOffersCategory();
  const chain = await buildCategoryChain(category._id);
  const stock = resolveStockStatus(combo.comboStock);
  const lifecycle = syncComboLifecycleStatus(combo);

  const productStatus =
    lifecycle === "active" && stock.stock_status === "In Stock"
      ? "Active"
      : "Inactive";

  const imageList =
    images.length > 0
      ? images
      : combo.marketingImage
        ? [combo.marketingImage]
        : [];

  // Product.images store filenames under /uploads/products/
  const normalizedImages = imageList
    .filter(Boolean)
    .map((img) =>
      String(img)
        .replace(/^\/uploads\/products\//, "")
        .replace(/^uploads\/products\//, "")
    );

  const payload = {
    name: combo.name,
    description: combo.longDescription || combo.shortDescription,
    price: combo.originalPrice,
    special_price: combo.offerPrice,
    quantity: stock.quantity,
    stock_status: stock.stock_status,
    status: productStatus,
    product_highlights: combo.highlights || [],
    meta_title: combo.metaTitle || "",
    meta_description: combo.metaDescription || "",
    search_keywords: combo.metaKeywords || "",
    related_products: combo.productIds || [],
    category: "none",
    sub_category: category._id.toString(),
    category_new: chain.root_md5,
    sub_category_new: chain.md5_chain,
    sub_category_new_name: chain.name_chain,
    updatedAt: new Date(),
  };

  if (normalizedImages.length) {
    payload.images = normalizedImages;
  }

  let product;
  if (combo.productId) {
    product = await Product.findByIdAndUpdate(
      combo.productId,
      { $set: payload },
      { new: true }
    );
  }

  if (!product) {
    const slug = await uniqueSlug(combo.name || combo.offerTitle || "combo-offer");
    const item_code = `COMBO-${Date.now()}`;
    product = await Product.create({
      ...payload,
      slug,
      md5_name: md5(slug),
      item_code,
      images: normalizedImages,
      createdAt: new Date(),
    });
  }

  combo.productId = product._id;
  combo.categoryId = category._id;
  combo.status = lifecycle === "draft" ? "draft" : lifecycle;
  await combo.save();

  await syncComboCategoryVisibility();

  return product;
}
