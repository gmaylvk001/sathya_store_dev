export function normalizeVariantValues(values = {}, attributeNames = []) {
  const next = {};
  const source = values && typeof values === "object" ? values : {};
  for (const name of attributeNames) {
    next[name] = String(source[name] ?? "").trim();
  }
  return next;
}

export function variantValue(value) {
  return String(value ?? "").trim();
}

export function valuesKeyFromNames(values = {}, attributeNames = []) {
  return attributeNames
    .map((name) => variantValue(values[name]).toLowerCase())
    .join("||");
}

export function activeSelections(values = {}, attributeNames = []) {
  const next = {};
  for (const name of attributeNames) {
    const value = variantValue(values[name]);
    if (value) next[name] = value;
  }
  return next;
}

export function isProductPurchasable(product) {
  if (!product || product.status === "Inactive") return false;
  const qty = Number(product.quantity);
  if (!Number.isFinite(qty) || qty <= 0) return false;
  return String(product.stock_status || "") !== "Out of Stock";
}

export function isVariantValueAvailable(products, attrName, value, selected, attributeNames) {
  const target = variantValue(value);
  if (!target) return false;

  return products.some((product) => {
    if (variantValue(product.values?.[attrName]) !== target) return false;
    if (!isProductPurchasable(product)) return false;
    return attributeNames.every((name) => {
      if (name === attrName) return true;
      const selectedVal = variantValue(selected?.[name]);
      if (!selectedVal) return true;
      return variantValue(product.values?.[name]) === selectedVal;
    });
  });
}

export function findProductForSelection(products, selection, attributeNames, changedAttr = null) {
  const normalized = activeSelections(selection, attributeNames);

  const exactMatches = products.filter((product) =>
    attributeNames.every(
      (name) => variantValue(product.values?.[name]) === (normalized[name] || "")
    )
  );
  const exactInStock = exactMatches.find(isProductPurchasable);
  if (exactInStock) return exactInStock;
  if (exactMatches[0]) return exactMatches[0];

  if (changedAttr && normalized[changedAttr]) {
    const candidates = products.filter(
      (product) => variantValue(product.values?.[changedAttr]) === normalized[changedAttr]
    );
    if (!candidates.length) return null;
    const inStock = candidates.filter(isProductPurchasable);
    const pool = inStock.length ? inStock : candidates;

    let best = pool[0];
    let bestScore = -1;
    for (const product of pool) {
      let score = 0;
      for (const name of attributeNames) {
        if (name === changedAttr) continue;
        if (normalized[name] && variantValue(product.values?.[name]) === normalized[name]) {
          score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = product;
      }
    }
    return best;
  }

  return (
    products.find((product) =>
      Object.entries(normalized).every(
        ([name, val]) => variantValue(product.values?.[name]) === val
      )
    ) || null
  );
}

export function uniqueVariantValues(products, attrName) {
  const values = [];
  for (const product of products) {
    const value = variantValue(product.values?.[attrName]);
    if (value && !values.includes(value)) values.push(value);
  }
  return values;
}
