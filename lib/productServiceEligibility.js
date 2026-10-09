// 1. Accessories & Non-Electronic Blacklist Keywords
export const ACCESSORY_KEYWORDS = [
  'bag', 'backpack', 'sleeve', 'case', 'cover', 'pouch',
  'cable', 'cord', 'adapter', 'charger', 'stand', 'bracket',
  'mount', 'trolley', 'stabilizer', 'screen guard', 'tempered glass',
  'mouse pad', 'cleaning kit', 'accessory', 'accessories'
];

// 2. Heavy Appliances & Demo-Eligible Electronics Whitelist
export const INSTALLATION_ELIGIBLE_CATEGORIES = [
  'air-conditioner', 'split-ac', 'window-ac', 'air conditioner',
  'television', 'tv', 'led-tv', 'smart-tv', 'oled', 'qled',
  'washing-machine', 'washing machine', 'dryer',
  'refrigerator', 'fridge', 'deep-freezer', 'freezer',
  'dishwasher', 'water-purifier', 'water purifier',
  'chimney', 'hob', 'cooktop', 'microwave', 'oven',
  'laptop', 'laptops', 'notebook', 'desktop', 'computer'
];

/**
 * Safely extracts all product text attributes (name, title, slug, categories, subcategories)
 * regardless of whether categories are strings, ObjectIds, or populated objects.
 */
export const getProductText = (product) => {
  if (!product) return '';
  const parts = [
    product.name,
    product.title,
    product.slug,
    typeof product.category === 'string' ? product.category : product.category?.name,
    product.category?.category_name,
    product.category?.slug,
    product.category_name,
    product.categoryName,
    typeof product.subcategory === 'string' ? product.subcategory : product.subcategory?.name,
    product.subcategory?.subcategory_name,
    product.subcategory?.slug,
    product.subcategory_name,
    product.sub_category_new_name
  ].filter(Boolean).map(s => String(s).toLowerCase());
  return parts.join(' ');
};

/**
 * Determines if a product is eligible for Extended Warranty.
 * Rejects accessories / consumables and products priced under ₹2,000.
 */
export function isExtendedWarrantyEligible(product) {
  if (!product) return false;
  const text = getProductText(product);
  if (!text) return false;

  // Check if matches accessory blacklist
  const isAccessory = ACCESSORY_KEYWORDS.some(kw => {
    if (kw.includes(' ') || kw.includes('-')) {
      return text.includes(kw);
    }
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(text) || (product.slug && String(product.slug).toLowerCase().includes(kw));
  });
  if (isAccessory) return false;

  const price = Number(product.special_price || product.price || 0);
  if (price < 2000) return false;

  return true;
}

/**
 * Determines if a product is eligible for resQ Installation & Demo Service.
 * - Disqualifies non-electronic accessories, mobiles, and tablets.
 * - Allows heavy home appliances (ACs, TVs, Refrigerators, Washing Machines, etc.)
 *   and Laptops with demo services.
 */
export function isInstallationEligible(product) {
  if (!product) return false;
  const text = getProductText(product);
  if (!text) return false;

  // Accessories NEVER have installation or demo service
  const isAccessory = ACCESSORY_KEYWORDS.some(kw => {
    if (kw.includes(' ') || kw.includes('-')) {
      return text.includes(kw);
    }
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(text) || (product.slug && String(product.slug).toLowerCase().includes(kw));
  });
  if (isAccessory) return false;

  // Mobiles & Tablets do not have home installation / demo service
  const isDisqualified = /\b(mobile|mobiles|smartphone|smartphones|tablet|tablets|ipad)\b/i.test(text);
  if (isDisqualified) return false;

  // Match against installation & demo whitelist
  return INSTALLATION_ELIGIBLE_CATEGORIES.some(c => {
    if (c === 'tv') {
      return /\btv\b/i.test(text) || text.includes('television') || text.includes('smart-tv') || text.includes('led-tv');
    }
    if (c === 'ac') {
      return /\bac\b/i.test(text) || text.includes('air-conditioner') || text.includes('split-ac');
    }
    return text.includes(c);
  });
}
