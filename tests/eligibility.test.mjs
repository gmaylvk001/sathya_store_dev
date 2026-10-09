import test from "node:test";
import assert from "node:assert/strict";
import { isExtendedWarrantyEligible, isInstallationEligible } from "../lib/productServiceEligibility.js";

test("Extended Warranty: Non-electronic accessories (bags, sleeves, cables, mounts) are disqualified", () => {
  assert.equal(isExtendedWarrantyEligible({ name: "Acer Laptop Carry Bag", price: 999 }), false);
  assert.equal(isExtendedWarrantyEligible({ name: "USB-C Fast Charging Cable", price: 499 }), false);
  assert.equal(isExtendedWarrantyEligible({ name: "TV Wall Mount Bracket", price: 2500 }), false);
  assert.equal(isExtendedWarrantyEligible({ name: "Tempered Glass Screen Guard", price: 399 }), false);
});

test("Extended Warranty: Items under ₹2,000 are disqualified", () => {
  assert.equal(isExtendedWarrantyEligible({ name: "Mini Trimmer", price: 1200 }), false);
  assert.equal(isExtendedWarrantyEligible({ name: "Headphone Adapter", price: 1999 }), false);
});

test("Extended Warranty: Electronics >= ₹2,000 are eligible", () => {
  assert.equal(isExtendedWarrantyEligible({ name: "Acer Aspire 5 Laptop", price: 45000, category_name: "Laptops" }), true);
  assert.equal(isExtendedWarrantyEligible({ name: "Samsung 55 Inch Smart TV", price: 52000, category_name: "smart-tv" }), true);
  assert.equal(isExtendedWarrantyEligible({ name: "LG Washing Machine", price: 34000, category_name: "washing-machine" }), true);
  assert.equal(isExtendedWarrantyEligible({ name: "iPhone 15 Mobile", price: 65000, category_name: "Mobiles" }), true);
});

test("Installation Service: Heavy appliances & Laptops with demo services pass", () => {
  assert.equal(isInstallationEligible({ name: "Samsung 55 Inch Smart TV", category_name: "smart-tv" }), true);
  assert.equal(isInstallationEligible({ name: "Voltas 1.5 Ton Split AC", category_name: "split-ac" }), true);
  assert.equal(isInstallationEligible({ name: "LG Front Load Washing Machine", category_name: "washing-machine" }), true);
  assert.equal(isInstallationEligible({ name: "Whirlpool Double Door Refrigerator", category_name: "refrigerator" }), true);
  assert.equal(isInstallationEligible({ name: "Acer Aspire 3 Laptop", category_name: "Laptops" }), true);
  assert.equal(isInstallationEligible({ name: "HP Pavilion 15 Notebook", category_name: "Computers & Laptops" }), true);
});

test("Installation Service: Accessories, Mobiles, and Tablets are disqualified", () => {
  assert.equal(isInstallationEligible({ name: "Acer Laptop Carry Bag", category_name: "accessories" }), false);
  assert.equal(isInstallationEligible({ name: "USB-C Cable", category_name: "Cables" }), false);
  assert.equal(isInstallationEligible({ name: "Apple iPhone 15 Pro", category_name: "Mobiles" }), false);
  assert.equal(isInstallationEligible({ name: "iPad Air Tablet", category_name: "Tablets" }), false);
});

