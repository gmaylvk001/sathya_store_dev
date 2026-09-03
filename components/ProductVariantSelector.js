"use client";

import {
  findProductForSelection,
  isVariantValueAvailable,
  uniqueVariantValues,
  variantValue,
} from "@/lib/variantUtils";

function resolveImage(path) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `/uploads/products/${path}`;
}

function normalizeProductValues(values = {}, attributeNames = []) {
  return Object.fromEntries(
    attributeNames.map((name) => [name, variantValue(values[name])])
  );
}

function normalizeSelected(values = {}, attributeNames = []) {
  const next = {};
  for (const name of attributeNames) {
    const value = variantValue(values[name]);
    if (value) next[name] = value;
  }
  return next;
}

export default function ProductVariantSelector({ variantGroup, currentProductId, onSelect }) {
  if (!variantGroup?.products?.length || variantGroup.products.length < 2) return null;
  if (!variantGroup.attributes?.length) return null;

  const attributeNames = variantGroup.attributes.map((attr) => attr.name).filter(Boolean);
  const products = variantGroup.products
    .filter((p) => p.status !== "Inactive")
    .map((product) => ({
      ...product,
      values: normalizeProductValues(product.values, attributeNames),
    }));

  const current =
    products.find((p) => String(p._id) === String(currentProductId)) || products[0];
  const selected = normalizeSelected(current?.values, attributeNames);

  return (
    <div className="mt-1 mb-2 space-y-2">
      {variantGroup.attributes.map((attr) => {
        const values = uniqueVariantValues(products, attr.name);
        if (!values.length) return null;
        const metaByValue = Object.fromEntries(
          (attr.valuesMeta || []).map((meta) => [variantValue(meta.value), meta])
        );
        return (
          <div key={attr.name}>
            <p className="text-sm font-semibold text-gray-800 mb-2">{attr.name}</p>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const available = isVariantValueAvailable(
                  products,
                  attr.name,
                  value,
                  selected,
                  attributeNames
                );
                const isActive = variantValue(selected[attr.name]) === value;
                const meta = metaByValue[value] || {};
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      if (!available) return;
                      const nextSelected = { ...selected, [attr.name]: value };
                      const match = findProductForSelection(
                        products,
                        nextSelected,
                        attributeNames,
                        attr.name
                      );
                      if (match) onSelect(match);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition ${
                      isActive
                        ? "border-[#d72828] bg-red-50 text-[#d72828] font-semibold"
                        : available
                          ? "border-gray-300 bg-white text-gray-800 hover:border-red-400"
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                    }`}
                    title={
                      !available
                        ? "Out of stock or not available with the selected options"
                        : value
                    }
                  >
                    {attr.type === "color" && meta.colorHex && (
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: meta.colorHex }}
                      />
                    )}
                    {meta.image && (
                      <img src={resolveImage(meta.image)} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <span>{value}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
