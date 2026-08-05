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
