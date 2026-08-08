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
};

export const PAGE_TYPE_LABELS = {
  [PAGE_TYPES.CATEGORY]: "Category",
  [PAGE_TYPES.SUB_CATEGORY]: "Sub Category",
  [PAGE_TYPES.CHILD_CATEGORY]: "Child Category",
};

export const COMPONENT_TYPES = {
  TOP_BANNER: "top_banner",
  IMAGE_CAROUSEL: "image_carousel",
  PRODUCT_CAROUSEL: "product_carousel",
  BANNER_SIDE_PRODUCTS: "banner_side_products",
  BANNER_FOUR_PRODUCTS: "banner_four_products",
  BANNER_GRID: "banner_grid",
  SINGLE_BANNER_PRODUCTS: "single_banner_products",
  BRAND_CAROUSEL: "brand_carousel",
  IMAGE_HOTSPOT_BANNER: "image_hotspot_banner",
  CATEGORY_CONTENT: "category_content",
};

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
    label: "Banner + 4 Images + Products",
    description:
      "Top banner with URL, 4 tiles (image + URL + shared BG color), then related products. See All uses banner URL.",
    icon: "mdi:view-grid",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/banner-four-products.svg",
  },
  [COMPONENT_TYPES.BANNER_GRID]: {
    type: COMPONENT_TYPES.BANNER_GRID,
    label: "Banner Grid (2–4)",
    description:
      "Add 2, 3, or 4 equal-size banners (same height & width, below 600×600; storefront fits within 450×450) with URL links. Responsive row on desktop; mobile stacks 3 as 2+1 centered.",
    icon: "mdi:view-grid-outline",
    enabled: true,
    allowMultiple: true,
    preview: "/uploads/category-page-previews/banner-grid.svg",
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
