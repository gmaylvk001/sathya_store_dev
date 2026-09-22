// utils/compareHelpers.js
//
// Utility functions for the Compare feature:
//   - normalizeAttributes: builds the union of attribute rows for the compare table
//   - mergeCompareLists:   client-side dedup helper for optimistic UI during sync
//   - trackCompareAdd / trackCompareRemove / trackCompareView: GA4 analytics events
//
// These functions are pure helpers with no side effects — safe to import anywhere.

// ─── Attribute Normalization ─────────────────────────────────────────────────

/**
 * Builds the ordered union of comparable attributes across all selected products.
 *
 * Product.key_specifications is an Array<String> of "Key: Value" formatted lines
 * (e.g. "Capacity: 1.5 Ton"). We parse each into { key, value } pairs so the
 * table can render them as rows. Products that don't have a given key will show
 * "–" in their column.
 *
 * @param {Array<Object>} products — fully-populated product objects
 * @returns {Array<{ key: string, values: Array<string|null> }>}
 *   Each row = one attribute. values[i] is the value for products[i].
 */
export function normalizeAttributes(products) {
  if (!products || products.length === 0) return [];

  // Parse each product's key_specifications into a Map<key, value>
  const productMaps = products.map((product) => {
    const map = new Map();

    // Parse "Key: Value" strings from key_specifications
    if (Array.isArray(product?.key_specifications)) {
      product.key_specifications.forEach((spec) => {
        if (typeof spec === 'string' && spec.includes(':')) {
          const colonIdx = spec.indexOf(':');
          const key = spec.slice(0, colonIdx).trim();
          const value = spec.slice(colonIdx + 1).trim();
          if (key) map.set(key, value);
        }
      });
    }

    // Also include top-level filter object keys as supplementary attributes
    // (e.g. { capacity: "1.5 Ton", star_rating: "5 Star" })
    if (product?.filter && typeof product.filter === 'object') {
      Object.entries(product.filter).forEach(([key, value]) => {
        const label = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()); // "star_rating" → "Star Rating"
        if (!map.has(label) && value !== undefined && value !== null && value !== '') {
          map.set(label, String(value));
        }
      });
    }

    return map;
  });

  // Build the union of all attribute keys, preserving order of first appearance
  const keyOrder = [];
  const seen = new Set();
  productMaps.forEach((map) => {
    map.forEach((_, key) => {
      if (!seen.has(key)) {
        seen.add(key);
        keyOrder.push(key);
      }
    });
  });

  // Build each row: { key, values: [val for product 0, val for product 1, ...] }
  return keyOrder.map((key) => ({
    key,
    values: productMaps.map((map) => map.get(key) || null),
  }));
}

/**
 * Tries to parse a value as a number for "best value" highlighting in the table.
 * Returns the numeric value, or null if it cannot be parsed.
 *
 * @param {string|null} val
 * @returns {number|null}
 */
export function parseNumericValue(val) {
  if (!val) return null;
  // Strip common suffixes: "₹", "INR", "W", "kg", "L", "Star", etc.
  const cleaned = String(val).replace(/[₹,INR\s]/g, '').match(/[\d.]+/);
  return cleaned ? parseFloat(cleaned[0]) : null;
}

// ─── Compare List Merge (Client-side) ────────────────────────────────────────

/**
 * Merges a guest's localStorage compare list into the DB-fetched list, respecting:
 *   - Deduplication by productId
 *   - Max 4 items total (existing DB items take priority)
 *
 * This mirrors the server-side merge logic and is used for optimistic UI updates
 * while the real /api/compare/merge call is in-flight.
 *
 * @param {Array<{ productId: string, category_slug: string }>} localList
 * @param {Array<{ productId: string, category_slug: string }>} dbList
 * @returns {Array<{ productId: string, category_slug: string }>} merged list (max 4)
 */
export function mergeCompareLists(localList, dbList) {
  const existingIds = new Set(dbList.map((item) => String(item.productId)));
  const newItems = localList.filter((item) => !existingIds.has(String(item.productId)));
  const availableSlots = 4 - dbList.length;
  return [...dbList, ...newItems.slice(0, availableSlots)];
}

// ─── Analytics Helpers ───────────────────────────────────────────────────────
// Follow the same window.gtag pattern as utils/nextjs-event-tracking.js

/**
 * Fire GA4 event when a product is added to the compare list.
 * @param {{ productId: string, productName: string, category_slug: string }} param
 */
export function trackCompareAdd({ productId, productName, category_slug }) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'compare_add', {
      product_id: productId,
      product_name: productName,
      category: category_slug,
    });
  }
}

/**
 * Fire GA4 event when a product is removed from the compare list.
 * @param {{ productId: string, productName: string }} param
 */
export function trackCompareRemove({ productId, productName }) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'compare_remove', {
      product_id: productId,
      product_name: productName,
    });
  }
}

/**
 * Fire GA4 event when the user navigates to the compare page.
 * @param {{ count: number, category_slug: string }} param
 */
export function trackCompareView({ count, category_slug }) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'compare_view', {
      item_count: count,
      category: category_slug,
    });
  }
}
