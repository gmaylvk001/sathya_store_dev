/**
 * Category page component registry (admin gallery + storefront).
 *
 * Rules:
 * - Top Banner: allowMultiple=false → one per category page.
 *   Multiple images inside it = carousel only.
 * - Image Carousel (and future): allowMultiple=true → same type can be added
 *   many times (different names/products). Each instance on Drag & Drop Order.
 */

export const PAGE_TYPES = {
  CATEGORY: "category",
  SUB_CATEGORY: "sub_category",
  CHILD_CATEGORY: "child_category",
  BRAND: "brand",
  CATEGORY_BRAND: "category_brand",
};

export const PAGE_TYPE_LABELS = {
  [PAGE_TYPES.CATEGORY]: "Category",
  [PAGE_TYPES.SUB_CATEGORY]: "Sub Category",
  [PAGE_TYPES.CHILD_CATEGORY]: "Child Category",
  [PAGE_TYPES.BRAND]: "Brand",
  [PAGE_TYPES.CATEGORY_BRAND]: "Category + Brand",
};

export const COMPONENT_TYPES = {
  TOP_BANNER: "top_banner",
  IMAGE_CAROUSEL: "image_carousel",
  PRODUCT_CAROUSEL: "product_carousel",
  BANNER_SIDE_PRODUCTS: "banner_side_products",
  BANNER_FOUR_PRODUCTS: "banner_four_products",
  BANNER_GRID: "banner_grid",
  IMAGE_COLUMNS: "image_columns",
  SINGLE_BANNER_PRODUCTS: "single_banner_products",
  BRAND_CAROUSEL: "brand_carousel",
  IMAGE_HOTSPOT_BANNER: "image_hotspot_banner",
  CATEGORY_CONTENT: "category_content",
  SPLIT_BANNER: "split_banner",
};

/** Shared accept list for Home / Category / Brand settings image inputs. */
export const CATEGORY_PAGE_IMAGE_ACCEPT = "image/avif,image/webp,.avif,.webp";

export const CATEGORY_PAGE_IMAGE_ACCEPT_HINT =
  "Only AVIF and WebP images are allowed.";

const ALLOWED_PAGE_BUILDER_IMAGE_MIMES = new Set([
  "image/avif",
  "image/webp",
]);
const ALLOWED_PAGE_BUILDER_IMAGE_EXTS = new Set(["avif", "webp"]);

function pageBuilderImageExt(file) {
  const name = String(file?.name || "");
  if (!name.includes(".")) return "";
  return name.split(".").pop().toLowerCase();
}

export function isAllowedCategoryPageImage(file) {
  if (!file || typeof file !== "object") return false;
  const mime = String(file.type || "").toLowerCase();
  const ext = pageBuilderImageExt(file);
  const mimeOk = ALLOWED_PAGE_BUILDER_IMAGE_MIMES.has(mime);
  const extOk = ALLOWED_PAGE_BUILDER_IMAGE_EXTS.has(ext);
  if (mime.startsWith("image/") && !mimeOk) return false;
  return mimeOk || extOk;
}

export function getCategoryPageImageError(file) {
  if (!file) return "";
  if (isAllowedCategoryPageImage(file)) return "";
  return "Only AVIF and WebP images are allowed.";
}

export function consumeAllowedCategoryPageImage(file, inputEl) {
  if (!file) return { file: null, error: "" };
  const error = getCategoryPageImageError(file);
  if (error) {
    if (inputEl) inputEl.value = "";
    return { file: null, error };
  }
  return { file, error: "" };
}

export function assertAllowedCategoryPageImage(file) {
  if (!file) throw new Error("Invalid image file");
  const error = getCategoryPageImageError(file);
  if (error) throw new Error(error);
}

export const componentRegistry = {
  [COMPONENT_TYPES.TOP_BANNER]: {
    type: COMPONENT_TYPES.TOP_BANNER,
    label: "Top Banner",
    description:
      "One Top Banner per category page. Multiple images = left–right carousel only (not multiple Top Banner blocks).",
    icon: "mdi:image-area",
    enabled: true,
    allowMultiple: false,
    preview: "/uploads/category-page-previews/top-banner.svg",
  },
  [COMPONENT_TYPES.IMAGE_CAROUSEL]: {
    type: COMPONENT_TYPES.IMAGE_CAROUSEL,
    label: "Image Carousel",
    description:
      "Select to open this component. Lists existing sets; ADD NEW creates another (many images + URLs per set).",
    icon: "mdi:view-carousel",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/image-carousel.svg",
  },
  [COMPONENT_TYPES.PRODUCT_CAROUSEL]: {
    type: COMPONENT_TYPES.PRODUCT_CAROUSEL,
    label: "Product Carousel",
    description:
      "Named product row (like Best Selling). Search & add products from this category only.",
    icon: "mdi:shopping",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/product-carousel.svg",
  },
  [COMPONENT_TYPES.BANNER_SIDE_PRODUCTS]: {
    type: COMPONENT_TYPES.BANNER_SIDE_PRODUCTS,
    label: "Banner + Side + Products",
    description:
      "Main banner with URL, side image (left or right), product search row. See All uses main banner URL.",
    icon: "mdi:view-split-vertical",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/banner-side-products.svg",
  },
  [COMPONENT_TYPES.BANNER_FOUR_PRODUCTS]: {
    type: COMPONENT_TYPES.BANNER_FOUR_PRODUCTS,
    label: "Banner + 3/4 Images + Products",
    description:
      "Top banner with URL, 3 or 4 tiles (image + URL + shared BG color), then related products. See All uses banner URL.",
    icon: "mdi:view-grid",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/banner-four-products.svg",
  },
  [COMPONENT_TYPES.BANNER_GRID]: {
    type: COMPONENT_TYPES.BANNER_GRID,
    label: "Banner Grid (2–4) + Products",
    description:
      "Add 2, 3, or 4 equal-size linked banners. An optional product row can be added with a name and at least 6 products.",
    icon: "mdi:view-grid-outline",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/banner-grid.svg",
  },
  [COMPONENT_TYPES.IMAGE_COLUMNS]: {
    type: COMPONENT_TYPES.IMAGE_COLUMNS,
    label: "Image Columns (3 Layouts)",
    description:
      "Five-image mosaic: center big, left big, or right big. Optional URL per image.",
    icon: "mdi:view-column",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/image-columns.svg",
  },
  [COMPONENT_TYPES.SINGLE_BANNER_PRODUCTS]: {
    type: COMPONENT_TYPES.SINGLE_BANNER_PRODUCTS,
    label: "Single Banner + Products",
    description:
      "One promotional banner with URL, then a product row (min 6). See All uses the same banner URL.",
    icon: "mdi:image-text",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/single-banner-products.svg",
  },
  [COMPONENT_TYPES.BRAND_CAROUSEL]: {
    type: COMPONENT_TYPES.BRAND_CAROUSEL,
    label: "Brand Carousel",
    description:
      "Brand logo carousel — add images + URLs. Auto-scrolls on storefront like Image Carousel.",
    icon: "mdi:storefront-outline",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/brand-carousel.svg",
  },
  [COMPONENT_TYPES.IMAGE_HOTSPOT_BANNER]: {
    type: COMPONENT_TYPES.IMAGE_HOTSPOT_BANNER,
    label: "Image Hotspot Banner",
    description:
      "Upload one banner and draw unlimited clickable hotspot regions (links). Coordinates are %-based and responsive.",
    icon: "mdi:image-filter-center-focus",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/image-hotspot-banner.svg",
  },
  [COMPONENT_TYPES.CATEGORY_CONTENT]: {
    type: COMPONENT_TYPES.CATEGORY_CONTENT,
    label: "Category Content",
    description:
      "Write category content in one text field. Shown on the category page with a white background.",
    icon: "mdi:text-box-outline",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/category-content.svg",
  },
  [COMPONENT_TYPES.SPLIT_BANNER]: {
    type: COMPONENT_TYPES.SPLIT_BANNER,
    label: "Single / Double Banner",
    description:
      "Choose 1 banner (full width) or 2 banners (left + right). Each banner has an image and optional URL. No title needed.",
    icon: "mdi:image-multiple-outline",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/split-banner.svg",
  },
};

export function getAvailableComponents() {
  return Object.values(componentRegistry).filter((c) => c.enabled);
}

export function getComponentMeta(type) {
  return componentRegistry[type] || null;
}

export function isValidComponentType(type) {
  return Boolean(componentRegistry[type]?.enabled);
}

export function allowsMultipleInstances(type) {
  const meta = getComponentMeta(type);
  return Boolean(meta?.allowMultiple);
}

/**
 * Build display labels for order / builder UI.
 */
export function getInstanceLabels(components = []) {
  const sorted = [...components].sort((a, b) => a.order - b.order);
  const totals = {};
  for (const c of sorted) {
    totals[c.type] = (totals[c.type] || 0) + 1;
  }

  const typeIndex = {};
  const labels = {};
  for (const c of sorted) {
    const meta = getComponentMeta(c.type);
    const base = meta?.label || c.type;

    if (meta?.allowMultiple) {
      typeIndex[c.type] = (typeIndex[c.type] || 0) + 1;
      const n = typeIndex[c.type];
      const total = totals[c.type] || 1;
      let label = total > 1 ? `${base} #${n}` : base;
      if (c.title) label += ` — ${c.title}`;
      labels[c.instanceId] = label;
    } else {
      labels[c.instanceId] = base;
    }
  }
  return labels;
}
