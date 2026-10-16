/**
 * Application Route Constants
 * Centralized, type-safe route definitions to prevent hardcoded string mismatches
 * and protect against broken or dead link redirects.
 */
export const ROUTES = Object.freeze({
  HOME: '/',
  PRODUCTS: '/',
  ALL_PRODUCTS: '/',
  COLLECTION: (slug) => (slug ? `/collection/${slug}` : '/'),
  CATEGORY: (slug) => (slug ? `/category/${slug}` : '/'),
  PRODUCT_DETAIL: (slugOrId) => (slugOrId ? `/product/${slugOrId}` : '/'),
  CART: '/cart',
  CHECKOUT: '/checkout',
  WISHLIST: '/wishlist',
});

/**
 * Validates whether a referrer URL is a safe, internal catalog/category route.
 * Strictly prevents open-redirect vulnerabilities and circular navigational loops
 * (e.g., returning to cart, checkout, or login).
 *
 * @param {string | null | undefined} referrer - document.referrer string
 * @param {string} currentOrigin - window.location.origin
 * @returns {boolean}
 */
export const isValidCatalogReferrer = (referrer, currentOrigin) => {
  if (!referrer || typeof referrer !== 'string') return false;

  try {
    const url = new URL(referrer, currentOrigin);

    // Strict origin boundary: must match application domain
    if (url.origin !== currentOrigin) {
      return false;
    }

    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    // Disallowed internal routes that are not catalog/product discovery
    const blockedRoutes = [
      '/cart',
      '/checkout',
      '/login',
      '/old-login',
      '/profile',
      '/order',
      '/orders',
      '/404',
      '/privacy-policy',
      '/terms-and-conditions',
      '/cancellation-policy',
      '/shipping',
    ];

    if (blockedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      return false;
    }

    // Allowed discovery route prefixes
    const allowedPrefixes = [
      '/',
      '/category',
      '/collection',
      '/product',
      '/brand',
      '/search',
      '/deals-offer',
      '/super-offers',
    ];

    return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
};
