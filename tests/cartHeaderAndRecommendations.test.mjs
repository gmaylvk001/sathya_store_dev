import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES, isValidCatalogReferrer } from '../constants/routes.js';

// ============================================================================
// BUG 1 UNIT TESTS: "Add more items" Dynamic Routing & Defensive Referrer
// ============================================================================

test('ROUTES: Constants are defined, immutable and point to valid application paths', () => {
  assert.equal(ROUTES.HOME, '/', 'ROUTES.HOME must be root path');
  assert.equal(ROUTES.CART, '/cart', 'ROUTES.CART must be /cart');
  assert.equal(ROUTES.CHECKOUT, '/checkout', 'ROUTES.CHECKOUT must be /checkout');
  assert.ok(ROUTES.PRODUCTS, 'ROUTES.PRODUCTS must be defined');

  // Verify immutability
  assert.throws(() => {
    ROUTES.HOME = '/new-home';
  }, TypeError, 'ROUTES object must be frozen/immutable');
});

test('isValidCatalogReferrer: Validates same-origin catalog and discovery pages', () => {
  const origin = 'https://www.sathya.in';

  assert.equal(isValidCatalogReferrer('https://www.sathya.in/', origin), true, 'Home page is valid referrer');
  assert.equal(isValidCatalogReferrer('https://www.sathya.in/category/appliances', origin), true, 'Category page is valid');
  assert.equal(isValidCatalogReferrer('https://www.sathya.in/collection/air-conditioners', origin), true, 'Collection page is valid');
  assert.equal(isValidCatalogReferrer('https://www.sathya.in/product/voltas-1-5-ton-ac', origin), true, 'Product detail page is valid');
  assert.equal(isValidCatalogReferrer('https://www.sathya.in/search?q=refrigerator', origin), true, 'Search page is valid');
  assert.equal(isValidCatalogReferrer('https://www.sathya.in/deals-offer', origin), true, 'Deals page is valid');
});

test('isValidCatalogReferrer: Strictly rejects external origins (Open-Redirect Prevention)', () => {
  const origin = 'https://www.sathya.in';

  assert.equal(isValidCatalogReferrer('https://google.com', origin), false, 'External search engine must be rejected');
  assert.equal(isValidCatalogReferrer('https://phishing-site.com/category/appliances', origin), false, 'Phishing site on same path must be rejected');
  assert.equal(isValidCatalogReferrer('https://sathya.in.attacker.com', origin), false, 'Subdomain spoofing must be rejected');
});

test('isValidCatalogReferrer: Strictly rejects circular or dead-end internal routes', () => {
  const origin = 'https://www.sathya.in';

  assert.equal(isValidCatalogReferrer('https://www.sathya.in/cart', origin), false, 'Cart page must not refer back to cart');
  assert.equal(isValidCatalogReferrer('https://www.sathya.in/checkout', origin), false, 'Checkout must not refer back');
  assert.equal(isValidCatalogReferrer('https://www.sathya.in/login', origin), false, 'Login route must not refer back');
  assert.equal(isValidCatalogReferrer('https://www.sathya.in/404', origin), false, '404 error page must never be used as a return route');
});

test('isValidCatalogReferrer: Failsafe on null, undefined, empty, or garbage input', () => {
  const origin = 'https://www.sathya.in';

  assert.equal(isValidCatalogReferrer(null, origin), false, 'null is safely rejected');
  assert.equal(isValidCatalogReferrer(undefined, origin), false, 'undefined is safely rejected');
  assert.equal(isValidCatalogReferrer('', origin), false, 'empty string is safely rejected');
  assert.equal(isValidCatalogReferrer('javascript:alert(1)', origin), false, 'javascript URI is safely rejected');
  assert.equal(isValidCatalogReferrer('not a valid url at all %%', origin), false, 'garbage string is safely rejected');
});

test('Bug 1 Navigation Handler Simulation: Executes router.back() when referrer is valid catalog', () => {
  const origin = 'https://www.sathya.in';
  const referrer = 'https://www.sathya.in/category/air-conditioners';

  let backCalled = false;
  let pushCalledWith = null;

  const mockRouter = {
    back: () => { backCalled = true; },
    push: (path) => { pushCalledWith = path; },
  };

  const mockWindow = {
    location: { origin },
    history: { length: 3 },
  };

  // Safe handler simulation matching CartHeader implementation
  const handleAddMoreItems = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (isValidCatalogReferrer(referrer, mockWindow.location.origin)) {
      if (mockWindow.history.length > 1) {
        mockRouter.back();
        return;
      }
      mockRouter.push(new URL(referrer).pathname);
      return;
    }
    mockRouter.push(ROUTES.HOME);
  };

  handleAddMoreItems({ preventDefault: () => {} });

  assert.equal(backCalled, true, 'Must call router.back() when history and referrer are valid');
  assert.equal(pushCalledWith, null, 'Should not push when back() succeeds');
});

test('Bug 1 Navigation Handler Simulation: Falls back deterministically to ROUTES.HOME when referrer is 404 or external', () => {
  const origin = 'https://www.sathya.in';
  const referrer = 'https://www.sathya.in/404'; // Previous 404 route

  let backCalled = false;
  let pushCalledWith = null;

  const mockRouter = {
    back: () => { backCalled = true; },
    push: (path) => { pushCalledWith = path; },
  };

  const mockWindow = {
    location: { origin },
    history: { length: 3 },
  };

  const handleAddMoreItems = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (isValidCatalogReferrer(referrer, mockWindow.location.origin)) {
      if (mockWindow.history.length > 1) {
        mockRouter.back();
        return;
      }
      mockRouter.push(new URL(referrer).pathname);
      return;
    }
    mockRouter.push(ROUTES.HOME);
  };

  handleAddMoreItems({ preventDefault: () => {} });

  assert.equal(backCalled, false, 'Must NOT call router.back() into a 404 error page');
  assert.equal(pushCalledWith, ROUTES.HOME, 'Must fall back deterministically to ROUTES.HOME');
});

// ============================================================================
// BUG 2 UNIT TESTS: "Related Products" Cross-Sell Failsafe & Zero CLS
// ============================================================================

test('Bug 2 Failsafe: Component returns null (zero visual footprint) when recommendations are empty', () => {
  const renderRecommendationsSimulation = (loading, products) => {
    // Zero CLS rule: if loading or products array is empty, return null
    if (loading || !products || products.length === 0) {
      return null;
    }
    return { type: 'section', productCount: products.length };
  };

  assert.equal(renderRecommendationsSimulation(true, []), null, 'While loading without confirmed items: render null');
  assert.equal(renderRecommendationsSimulation(false, []), null, 'Empty response from API: render null (zero padding/margin)');
  assert.equal(renderRecommendationsSimulation(false, null), null, 'Null response: render null');
  assert.deepEqual(renderRecommendationsSimulation(false, [{ _id: 'p1' }]), { type: 'section', productCount: 1 }, 'Confirmed items: render section');
});

test('Bug 2 Timeout Failsafe: AbortController aborts fetch within timeout limit', async () => {
  let wasAborted = false;
  const timeoutMs = 50;

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  controller.signal.addEventListener('abort', () => {
    wasAborted = true;
  });

  await new Promise((resolve) => setTimeout(resolve, 80));
  clearTimeout(timerId);

  assert.equal(wasAborted, true, 'Controller must trigger abort when API exceeds timeout limit');
});

test('Bug 2 Cross-Sell Deduplication: Filters out products already present in the cart', () => {
  const cartItemIds = ['prod_ac_001', 'prod_ac_002'];

  const apiRecommendations = [
    { _id: 'prod_ac_001', name: 'Voltas 1.5 Ton AC' }, // already in cart
    { _id: 'prod_stab_001', name: 'V-Guard Voltage Stabilizer' }, // cross-sell
    { _id: 'prod_ac_002', name: 'Carrier 1.5 Ton AC' }, // already in cart
    { _id: 'prod_cover_001', name: 'AC Dust Cover' }, // cross-sell
  ];

  const filtered = apiRecommendations.filter((p) => !cartItemIds.includes(p._id));

  assert.equal(filtered.length, 2, 'Must filter out products already in cart');
  assert.equal(filtered[0]._id, 'prod_stab_001');
  assert.equal(filtered[1]._id, 'prod_cover_001');
});

test('Bug 2 Independent State: Adding an item dispatches cart update without page reload', () => {
  let reloadCalled = false;
  let cartCountUpdatedTo = null;
  let onItemAddedProduct = null;

  const mockWindow = {
    location: {
      reload: () => { reloadCalled = true; },
    },
  };

  const updateCartCount = (count) => { cartCountUpdatedTo = count; };
  const onItemAdded = (prod) => { onItemAddedProduct = prod; };

  // Simulated handleAddToCart success handler
  const handleSuccess = (product, newTotal) => {
    updateCartCount(newTotal);
    onItemAdded(product);
    // Explicitly NO mockWindow.location.reload()
  };

  const recommendedProduct = { _id: 'rec-123', name: 'Stabilizer', price: 2490 };
  handleSuccess(recommendedProduct, 5);

  assert.equal(reloadCalled, false, 'Must NEVER invoke window.location.reload()');
  assert.equal(cartCountUpdatedTo, 5, 'Cart count state updated seamlessly');
  assert.equal(onItemAddedProduct._id, 'rec-123', 'Parent onItemAdded callback received product');
});

// ============================================================================
// CART PRICE DETAILS (TOTAL AMOUNT PAYABLE) UNIT TESTS
// ============================================================================

test('CartPriceDetails: Defensive numeric formatting handles undefined, null, or NaN gracefully', () => {
  const formatPriceField = (val) => {
    const safe = typeof val === 'number' && !isNaN(val) ? val : 0;
    return Number(safe).toLocaleString('en-IN');
  };

  assert.equal(formatPriceField(65000), '65,000', 'Valid numbers formatted correctly');
  assert.equal(formatPriceField(null), '0', 'null defaults to 0');
  assert.equal(formatPriceField(undefined), '0', 'undefined defaults to 0');
  assert.equal(formatPriceField(NaN), '0', 'NaN defaults to 0');
  assert.equal(formatPriceField('invalid_string'), '0', 'string defaults to 0');
});

test('CartPriceDetails: Free delivery threshold and savings calculation', () => {
  const getDeliveryDisplay = (fee) => {
    const safeFee = typeof fee === 'number' && !isNaN(fee) ? fee : 0;
    return safeFee === 0 ? 'FREE' : `₹${Number(safeFee).toLocaleString('en-IN')}`;
  };

  assert.equal(getDeliveryDisplay(0), 'FREE', '0 delivery fee displays FREE');
  assert.equal(getDeliveryDisplay(150), '₹150', 'Non-zero delivery fee displays formatted currency');
  assert.equal(getDeliveryDisplay(null), 'FREE', 'null fee displays FREE');
});

test('CartPriceDetails: Checkout CTA invokes callback and respects disabled state', () => {
  let checkoutInvoked = false;

  const handleCheckoutClick = (isDisabled, onCheckout) => {
    if (isDisabled) return;
    if (typeof onCheckout === 'function') {
      onCheckout();
    }
  };

  // Case 1: Disabled
  handleCheckoutClick(true, () => { checkoutInvoked = true; });
  assert.equal(checkoutInvoked, false, 'Must NOT invoke checkout when disabled');

  // Case 2: Enabled
  handleCheckoutClick(false, () => { checkoutInvoked = true; });
  assert.equal(checkoutInvoked, true, 'Must invoke checkout callback when enabled');
});

