/**
 * Helper utility for Card Offer navigation and dynamic category resolution.
 * Translates explicit URLs (stripping external domains) or dynamically maps
 * card metadata (title, description, keywords) to the exact matching category route.
 */

/**
 * Normalizes any external or internal URL to a clean Next.js relative route.
 * Handles URLs like "https://www.sathya.store/category/washing-machine/front-loading"
 * -> "/category/washing-machine/front-loading".
 *
 * @param {string} rawUrl
 * @returns {string|null}
 */
export function normalizeRedirectUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === "#") return null;

  // If it's a full URL (http:// or https://)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      let pathname = parsed.pathname || "/";
      if (parsed.search) pathname += parsed.search;
      if (parsed.hash) pathname += parsed.hash;
      return pathname.startsWith("/") ? pathname : `/${pathname}`;
    } catch {
      // Fallback regex strip protocol & host
      const relative = trimmed.replace(/^https?:\/\/[^\/]+/, "");
      return relative.startsWith("/") ? relative : `/${relative}`;
    }
  }

  // Already relative or path
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // If path doesn't start with '/', ensure it starts with /category/ if it looks like a category
  if (trimmed.startsWith("category/") || trimmed.startsWith("category-division/")) {
    return `/${trimmed}`;
  }

  return `/${trimmed}`;
}

/**
 * Dynamically refines a general category path to a specific subcategory
 * based on contextual keywords in title or description.
 *
 * @param {string} currentPath
 * @param {string} text - Combined title, description, and keywords
 * @returns {string}
 */
export function refineSubcategory(currentPath, text) {
  const lower = (text || "").toLowerCase();

  // 1. Dishwasher (checked before washing machine to avoid "washer" substring collision)
  if (
    currentPath.includes("/category/dishwasher") ||
    /dishwasher|dish\s*washer/i.test(lower)
  ) {
    return "/category/dishwasher";
  }

  // 2. Washing Machine refinements
  if (
    (currentPath.includes("/category/washing-machine") ||
      currentPath.includes("/washing-machine") ||
      /washing\s*machine|front\s*load|top\s*load|semi\s*auto/i.test(lower)) &&
    !/dish/i.test(lower)
  ) {
    if (/front\s*load|front\s*loading|frontload/i.test(lower)) {
      return "/category/washing-machine/front-loading";
    }
    if (/top\s*load|top\s*loading|topload/i.test(lower)) {
      return "/category/washing-machine/top-loading";
    }
    if (/semi\s*auto|semi-auto|semiauto/i.test(lower)) {
      return "/category/washing-machine/semi-automatic";
    }
    if (/washer\s*dryer|only\s*washer/i.test(lower)) {
      return "/category/large-appliances/washing-machine/washer-dryer";
    }
    return "/category/washing-machine";
  }

  // 3. Refrigerator refinements
  if (
    currentPath.includes("/category/refrigerator") ||
    currentPath.includes("/refrigerator") ||
    /refrigerator|fridge/i.test(lower)
  ) {
    if (/single\s*door|1\s*door/i.test(lower)) {
      return "/category/refrigerator/single-door";
    }
    if (/double\s*door|2\s*door/i.test(lower)) {
      return "/category/refrigerator/double-door";
    }
    if (/triple\s*door|3\s*door/i.test(lower)) {
      return "/category/refrigerator/triple-door";
    }
    if (/side\s*by\s*side|french\s*door/i.test(lower)) {
      return "/category/refrigerator/side-by-side";
    }
    if (/deep\s*freezer|freezer|d-freezer/i.test(lower)) {
      return "/category/deep-freezer";
    }
    if (/mini\s*fridge/i.test(lower)) {
      return "/category/large-appliances/refrigerator/mini-fridge";
    }
    if (/bottom\s*mount/i.test(lower)) {
      return "/category/large-appliances/refrigerator/bottom-mount";
    }
    return "/category/refrigerator";
  }

  // 4. Air Conditioner refinements
  if (
    currentPath.includes("/category/air-conditioner") ||
    /air\s*conditioner|\bac\b|\bton\b/i.test(lower)
  ) {
    if (/split\s*ac|split/i.test(lower)) {
      return "/category/air-conditioner/split-ac";
    }
    if (/window\s*ac|window/i.test(lower)) {
      return "/category/air-conditioner/window-ac";
    }
    if (/inverter\s*ac|inverter/i.test(lower)) {
      return "/category/air-conditioner/inverter-ac";
    }
    if (/cassette\s*ac|cassette/i.test(lower)) {
      return "/category/air-conditioner/cassette-ac";
    }
    return "/category/air-conditioner";
  }

  // 5. Television / LED TV
  if (
    currentPath.includes("/category/led-tv") ||
    currentPath.includes("/category/televisions") ||
    /\btv\b|television|led\s*tv|smart\s*tv|qled|oled/i.test(lower)
  ) {
    return "/category/led-tv";
  }

  // 6. Soundbar / Audio
  if (
    currentPath.includes("soundbar") ||
    currentPath.includes("home-theatre") ||
    /sound\s*bar|soundbar|home\s*theatre|speaker/i.test(lower)
  ) {
    return "/category-division/home-theatre-speakers";
  }

  // 7. Water Dispenser
  if (
    currentPath.includes("water-dispenser") ||
    /dispencer|dispenser|water\s*dispenser/i.test(lower)
  ) {
    return "/category/utility-appliances/water-dispenser";
  }

  // 8. Water Heater
  if (
    currentPath.includes("water-heater") ||
    /water\s*heater|geyser/i.test(lower)
  ) {
    return "/category/utility-appliances/water-heater";
  }

  // 9. Fan
  if (
    currentPath.includes("/fan") ||
    /fan|ceiling\s*fan|table\s*fan|pedestal\s*fan|tower\s*fan/i.test(lower)
  ) {
    return "/category/utility-appliances/fan";
  }

  // 10. Air Cooler
  if (
    currentPath.includes("air-cooler") ||
    /air\s*cooler|cooler/i.test(lower)
  ) {
    return "/category/air-cooler";
  }

  return currentPath;
}

/**
 * Resolves the destination URL for any card offer with full dynamic matching.
 * Priority:
 * 1. Normalized explicit redirectUrl/link/url/redirect_url from Excel/DB.
 * 2. Intelligent refinement if the URL is broad and card has specific subcategory details.
 * 3. Dynamic category matching against title, description, and keywords.
 * 4. Safe fallback to /category/large-appliances.
 *
 * @param {object} card
 * @returns {string}
 */
export function getCardOfferCategoryHref(card) {
  if (!card) return "/category/large-appliances";

  // Check explicit link fields
  const explicitUrl =
    card.redirectUrl ||
    card.redirect_url ||
    card.url ||
    card.link ||
    card.targetUrl ||
    null;

  const combinedText = [
    card.title || "",
    card.description || "",
    card.offerName || "",
    card.originalImageName || "",
  ]
    .join(" ")
    .trim();

  // 1. If explicit URL is provided
  if (explicitUrl) {
    const normalized = normalizeRedirectUrl(explicitUrl);
    if (normalized) {
      return refineSubcategory(normalized, combinedText);
    }
  }

  // 2. If explicit category_slug is provided
  if (card.category_slug) {
    const baseSlug = `/category/${card.category_slug}`;
    return refineSubcategory(baseSlug, combinedText);
  }

  // 3. Dynamic category matching based on title / description / keywords
  const text = combinedText.toLowerCase();

  // Dishwasher (before washing machine)
  if (/dishwasher|dish\s*washer/i.test(text)) {
    return "/category/dishwasher";
  }

  // Washing Machine
  if (/front\s*load|front\s*loading|frontload/i.test(text)) {
    return "/category/washing-machine/front-loading";
  }
  if (/top\s*load|top\s*loading|topload/i.test(text)) {
    return "/category/washing-machine/top-loading";
  }
  if (/semi\s*auto|semi-auto|semiauto/i.test(text)) {
    return "/category/washing-machine/semi-automatic";
  }
  if (/washing\s*machine/i.test(text)) {
    return "/category/washing-machine";
  }

  // Refrigerator / Freezer
  if (/single\s*door|1\s*door/i.test(text)) {
    return "/category/refrigerator/single-door";
  }
  if (/double\s*door|2\s*door/i.test(text)) {
    return "/category/refrigerator/double-door";
  }
  if (/triple\s*door|3\s*door/i.test(text)) {
    return "/category/refrigerator/triple-door";
  }
  if (/side\s*by\s*side/i.test(text)) {
    return "/category/refrigerator/side-by-side";
  }
  if (/deep\s*freezer|freezer|d-freezer/i.test(text)) {
    return "/category/deep-freezer";
  }
  if (/mini\s*fridge/i.test(text)) {
    return "/category/large-appliances/refrigerator/mini-fridge";
  }
  if (/refrigerator|fridge/i.test(text)) {
    return "/category/refrigerator";
  }

  // Air Conditioner
  if (/split\s*ac/i.test(text)) {
    return "/category/air-conditioner/split-ac";
  }
  if (/window\s*ac/i.test(text)) {
    return "/category/air-conditioner/window-ac";
  }
  if (/inverter\s*ac/i.test(text)) {
    return "/category/air-conditioner/inverter-ac";
  }
  if (/air\s*conditioner|\bac\b|\bton\b/i.test(text)) {
    return "/category/air-conditioner";
  }

  // Television
  if (/\btv\b|television|led\s*tv|smart\s*tv|qled|oled/i.test(text)) {
    return "/category/led-tv";
  }

  // Audio / Soundbar
  if (/sound\s*bar|soundbar|home\s*theatre|speaker/i.test(text)) {
    return "/category-division/home-theatre-speakers";
  }

  // Utility Appliances
  if (/water\s*heater|geyser/i.test(text)) {
    return "/category/utility-appliances/water-heater";
  }
  if (/dispencer|dispenser|water\s*dispenser/i.test(text)) {
    return "/category/utility-appliances/water-dispenser";
  }
  if (/fan|ceiling\s*fan|table\s*fan|pedestal\s*fan|tower\s*fan/i.test(text)) {
    return "/category/utility-appliances/fan";
  }
  if (/air\s*cooler|cooler/i.test(text)) {
    return "/category/air-cooler";
  }
  if (/air\s*purifier/i.test(text)) {
    return "/category/small-appliances/home-care-comfort/air-purifier";
  }
  if (/vacuum\s*cleaner/i.test(text)) {
    return "/category/small-appliances/home-care-comfort/vacuum-cleaner";
  }
  if (/iron|iron\s*box/i.test(text)) {
    return "/category/utility-appliances/iron";
  }

  // Kitchen Appliances
  if (/induction\s*stove|induction/i.test(text)) {
    return "/category/kitchen-appliances/induction-stove";
  }
  if (/gas\s*stove|stove|hob|burner/i.test(text)) {
    return "/category/kitchen-appliances/gas-stove";
  }
  if (/mixie|mixer\s*grinder|blender/i.test(text)) {
    return "/category/kitchen-appliances/mixer-grinder";
  }
  if (/wet\s*grinder/i.test(text)) {
    return "/category/kitchen-appliances/wet-grinder";
  }
  if (/air\s*fryer|fryer/i.test(text)) {
    return "/category/kitchen-appliances/air-fryer";
  }
  if (/microwave|oven|otg/i.test(text)) {
    return "/category/kitchen-appliances/microwave-oven";
  }
  if (/chimney/i.test(text)) {
    return "/category/kitchen-appliances/chimney";
  }
  if (/kitchen|cooker|cooktop|kettle|toaster/i.test(text)) {
    return "/category/kitchen-appliances";
  }

  // Mobiles & Laptops
  if (/mobile|phone|tablet|wearable|smartwatch/i.test(text)) {
    return "/category/mobiles-accessories";
  }
  if (/laptop|computer|monitor|pc|desktop/i.test(text)) {
    return "/category/computers-laptops";
  }

  return "/category/large-appliances";
}
