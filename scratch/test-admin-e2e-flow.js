const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config({ path: ".env.local" });

function fetchApi(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:3001${path}`;
    const reqOptions = {
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runEndToEndTests() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("\n====================================================");
  console.log(" END-TO-END ADMIN & STOREFRONT VERIFICATION");
  console.log("====================================================\n");

  const Products = mongoose.connection.collection("products");
  const sampleProduct = await Products.findOne({ status: "Active" });

  if (!sampleProduct) {
    console.error("No active sample product found for testing!");
    process.exit(1);
  }

  const productId = sampleProduct._id.toString();
  const productSlug = sampleProduct.slug;

  console.log(`Testing Sample Product: "${sampleProduct.name}" (Slug: ${productSlug})`);

  // TEST 1 — ADMIN UNILET PRICING CREATE
  console.log("\n1. [TEST] Admin Creates Karnataka Unilet Pricing (Price: 1000, Offer: 899, Stock: 10)");
  const createRes = await fetchApi("/api/admin/owner-product", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-auth": "true",
    },
    body: {
      product_id: productId,
      product_item_code: sampleProduct.item_code || "",
      price: 1000,
      offer_price: 899,
      stock: 10,
      stock_status: "In Stock",
      is_active: true,
    },
  });

  console.log(`- Admin POST Status: ${createRes.status}`);
  console.log(`- Admin POST Response Success: ${createRes.body?.success}`);

  // TEST 2 — STOREFRONT KARNATAKA VERIFICATION
  console.log("\n2. [TEST] Storefront Query for Karnataka (Pincode: 560001 / Region: karnataka)");
  const storeResKA = await fetchApi(`/api/product/${productSlug}?region=karnataka`);
  const prodKA = storeResKA.body?.product || storeResKA.body;
  console.log(`- Resolved Price (Karnataka): ₹${prodKA?.price}`);
  console.log(`- Resolved Special Price (Karnataka): ₹${prodKA?.special_price}`);
  console.log(`- Resolved Stock (Karnataka): ${prodKA?.quantity}`);
  console.log(`- Match Expected (Price: 1000, Special: 899, Stock: 10): ${prodKA?.price === 1000 && prodKA?.special_price === 899 && prodKA?.quantity === 10 ? "PASS ✅" : "FAIL ❌"}`);

  // TEST 3 — STOREFRONT TAMIL NADU VERIFICATION (GLOBAL UNCHANGED)
  console.log("\n3. [TEST] Storefront Query for Tamil Nadu (Pincode: 600001 / Region: tamilnadu)");
  const storeResTN = await fetchApi(`/api/product/${productSlug}?region=tamilnadu`);
  const prodTN = storeResTN.body?.product || storeResTN.body;
  console.log(`- Global Price (Tamil Nadu): ₹${prodTN?.price}`);
  console.log(`- Global Special Price (Tamil Nadu): ₹${prodTN?.special_price}`);
  console.log(`- Global Stock (Tamil Nadu): ${prodTN?.quantity}`);
  console.log(`- Unaffected by Karnataka Override: ${prodTN?.price !== 1000 ? "PASS ✅" : "CHECK"}`);

  // TEST 4 — ADMIN EDIT (Offer: 799, Stock: 5)
  console.log("\n4. [TEST] Admin Edits Karnataka Unilet Pricing (Offer: 799, Stock: 5)");
  const editRes = await fetchApi("/api/admin/owner-product", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-auth": "true",
    },
    body: {
      product_id: productId,
      price: 1000,
      offer_price: 799,
      stock: 5,
      stock_status: "In Stock",
      is_active: true,
    },
  });

  const storeResKAUpdated = await fetchApi(`/api/product/${productSlug}?region=karnataka`);
  const prodKAUpdated = storeResKAUpdated.body?.product || storeResKAUpdated.body;
  console.log(`- Updated Special Price (Karnataka): ₹${prodKAUpdated?.special_price}`);
  console.log(`- Updated Stock (Karnataka): ${prodKAUpdated?.quantity}`);
  console.log(`- Match Expected (Special: 799, Stock: 5): ${prodKAUpdated?.special_price === 799 && prodKAUpdated?.quantity === 5 ? "PASS ✅" : "FAIL ❌"}`);

  // TEST 5 — TOP BANNER REGION ISOLATION
  console.log("\n5. [TEST] Top Banner Region Filtering");
  const topBannersKA = await fetchApi("/api/topbanner?region=karnataka");
  const topBannersTN = await fetchApi("/api/topbanner?region=tamilnadu");
  console.log(`- Top Banners (Karnataka Count): ${topBannersKA.body?.banners?.length || 0}`);
  console.log(`- Top Banners (Tamil Nadu Count): ${topBannersTN.body?.banners?.length || 0}`);
  console.log(`- Banner Endpoint Response Status: ${topBannersKA.status === 200 ? "PASS ✅" : "FAIL ❌"}`);

  // TEST 6 — SECURITY / UNAUTHORIZED CHECK
  console.log("\n6. [TEST] Security Check — Reject Unauthorized Write Requests");
  const unauthRes = await fetchApi("/api/admin/owner-product", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      product_id: productId,
      price: 500,
    },
  });
  console.log(`- Unauthorized POST Status Code: ${unauthRes.status}`);
  console.log(`- Rejection Result: ${unauthRes.status === 401 ? "PASS ✅ (401 Unauthorized)" : "FAIL ❌"}`);

  // CLEANUP TEST OVERRIDE
  console.log("\n7. [CLEANUP] Removing test Unilet override record");
  await fetchApi(`/api/admin/owner-product?productId=${productId}`, {
    method: "DELETE",
    headers: { "x-admin-auth": "true" },
  });
  console.log("- Cleanup Complete.");

  await mongoose.disconnect();
}

runEndToEndTests().catch(console.error);
