import ExistSathyaOrder from "@/models/ExistSathyaOrder";
import ExistSathyaOrderDetail from "@/models/ExistSathyaOrderDetail";
import EcomOrderInfo from "@/models/ecom_order_info";
import User from "@/models/User";

function toText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function emptyToNull(value) {
  const text = toText(value);
  return text === "" || text.toLowerCase() === "null" ? null : text;
}

function toNumber(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function existIdMatchValues(value) {
  const text = toText(value);
  if (!text) return [];
  const values = new Set([text]);
  if (/^\d+(\.0+)?$/.test(text)) {
    const n = Math.trunc(Number(text));
    values.add(String(n));
    values.add(`${n}.0`);
    values.add(n);
  }
  return [...values];
}

function normalizeStatusKey(value) {
  return toText(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function mapOrderStatus(value) {
  const raw = toText(value);
  if (["pending", "cancelled", "shipped", "Order Placed", "Failure", "payment_initialized", "Billed"].includes(raw)) {
    return raw;
  }
  const lower = normalizeStatusKey(raw);
  const map = {
    pending: "pending",
    cancelled: "cancelled",
    canceled: "cancelled",
    shipped: "shipped",
    "order placed": "Order Placed",
    placed: "Order Placed",
    failure: "Failure",
    failed: "Failure",
    "payment initialized": "payment_initialized",
    "payment initiated": "payment_initialized",
    accepted: "pending",
    billed: "Billed",
  };
  return map[lower] || "pending";
}

function mapDeliveryType(value) {
  const lower = toText(value).toLowerCase().replace(/\s+/g, "_");
  if (lower === "store_pickup" || lower === "storepickup" || lower === "pickup") {
    return "store_pickup";
  }
  return "home";
}

function mapPaymentStatus(value) {
  const lower = normalizeStatusKey(value);
  if (lower === "paid" || lower === "success" || lower === "captured") return "paid";
  if (lower === "payment initialized" || lower === "payment initiated") return "payment_initialized";
  return "pending";
}

function parseMaybeJsonArray(value) {
  if (Array.isArray(value)) return value;
  const text = toText(value);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildOrderItems(details, fallbackItem) {
  if (details.length) {
    return details.map((row, index) => ({
      id: index + 1,
      name: emptyToNull(row.product_name),
      price: toNumber(row.product_price, 0),
      item_code: emptyToNull(row.item_code),
      model: emptyToNull(row.model),
      coupondiscount: toNumber(row.coupon_discount, 0),
      coupondetails: [],
      quantity: toNumber(row.quantity, 1),
      store_id: emptyToNull(row.store_id),
      warranty: toNumber(row.is_warranty, 0),
      extendedWarranty: 0,
      warrantyData: {
        item_no: emptyToNull(row.warranty_product_code),
        name: null,
        year: null,
        price: null,
      },
      image: null,
      original_quantity: toNumber(row.quantity, 1),
      discount: toNumber(row.coupon_discount, 0),
      created_at: row.created_at || new Date(),
      updated_at: row.updated_at || new Date(),
    }));
  }
  return parseMaybeJsonArray(fallbackItem);
}

function buildOrderDetails(details, liveUserId, orderNumber) {
  return details.map((row) => ({
    exist_id: emptyToNull(row.exist_id),
    item_code: emptyToNull(row.item_code),
    product_id: toNumber(row.product_id),
    product_name: emptyToNull(row.product_name),
    product_price: toNumber(row.product_price, 0),
    model: emptyToNull(row.model),
    user_id: String(liveUserId),
    coupondiscount: toNumber(row.coupon_discount, 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    quantity: toNumber(row.quantity, 1),
    store_id: emptyToNull(row.store_id),
    orderNumber: emptyToNull(orderNumber) || emptyToNull(row.orderNumber),
  }));
}

function buildLiveOrder(existOrder, details, user) {
  const orderNumber = emptyToNull(existOrder.order_number);
  const liveUserId = String(user._id);
  const email = emptyToNull(user.email) || `exist-${liveUserId}@sathya.local`;
  const username = emptyToNull(existOrder.order_username) || emptyToNull(user.name) || "User";
  const phone = emptyToNull(existOrder.order_phonenumber) || emptyToNull(user.mobile) || "0";
  const amount = emptyToNull(existOrder.order_amount) || "0";
  const orderStatus = mapOrderStatus(existOrder.order_status);
  let paymentStatus = mapPaymentStatus(existOrder.online_pay_ref_status);
  if (orderStatus === "payment_initialized" && paymentStatus !== "paid") {
    paymentStatus = "payment_initialized";
  }

  return {
    exist_id: emptyToNull(existOrder.exist_id) || emptyToNull(user.exist_id),
    cart_id: emptyToNull(existOrder.cart_id),
    user_id: liveUserId,
    order_username: username,
    order_phonenumber: phone,
    email_address: email,
    order_item: buildOrderItems(details, existOrder.order_item),
    order_details: buildOrderDetails(details, liveUserId, orderNumber),
    order_amount: amount,
    order_deliveryaddress: emptyToNull(existOrder.order_deliveryaddress),
    customer_comments: "",
    payment_method: emptyToNull(existOrder.payment_method),
    payment_type: emptyToNull(existOrder.payment_type),
    delivery_type: mapDeliveryType(existOrder.delivery_type),
    pickup_store: emptyToNull(existOrder.pickup_type),
    store_id: emptyToNull(details[0]?.store_id),
    payment_id: emptyToNull(existOrder.payment_id),
    order_number: orderNumber,
    user_adddeliveryid: emptyToNull(existOrder.user_adddeliveryid),
    order_status: orderStatus,
    payment_status: paymentStatus,
    api_status: emptyToNull(existOrder.api_status),
    api_reason: emptyToNull(existOrder.api_reason),
    sales_person_id: emptyToNull(existOrder.sales_person_id),
    sales_person_role: emptyToNull(existOrder.sales_person_role),
    order_billingaddress: emptyToNull(existOrder.order_billingaddress),
    type: emptyToNull(existOrder.type),
    user_addbillingid: emptyToNull(existOrder.user_addbillingid),
    pickup_type: emptyToNull(existOrder.pickup_type),
    file_path: emptyToNull(existOrder.file_path),
    invoice: emptyToNull(existOrder.invoice),
    is_tac: emptyToNull(existOrder.is_tac),
    archive: emptyToNull(existOrder.archive),
    referrel_url: emptyToNull(existOrder.referrel_url),
    utm_source: emptyToNull(existOrder.utm_source),
    utm_campaign: emptyToNull(existOrder.utm_campaign),
    coupon_discount: emptyToNull(existOrder.coupon_discount),
    eo_discount: emptyToNull(existOrder.eo_discount),
    coupon_id: emptyToNull(existOrder.coupon_id),
    offline_order_date: existOrder.offline_order_date || null,
    emi_txn_ref_no: emptyToNull(existOrder.emi_txn_ref_no),
    rcu_status: emptyToNull(existOrder.rcu_status),
    asset_status: emptyToNull(existOrder.asset_status),
    do_generation_status: emptyToNull(existOrder.do_generation_status),
    doc_status: emptyToNull(existOrder.doc_status),
    qc_status: emptyToNull(existOrder.qc_status),
    bajajbilling: emptyToNull(existOrder.bajajbilling),
    schema_request: existOrder.schema_request ?? null,
    bajaj_do_checkout: existOrder.bajaj_do_checkout ?? null,
    netamt: emptyToNull(existOrder.netamt),
    online_pay_refid: emptyToNull(existOrder.online_pay_refid),
    online_pay_ref_status: emptyToNull(existOrder.online_pay_ref_status),
    order_owner: emptyToNull(existOrder.order_owner),
    order_history: [],
    createdAt: existOrder.created_at || new Date(),
    updatedAt: existOrder.updated_at || new Date(),
  };
}

export async function fetchExistOrdersForLiveUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    return { error: "User not found", status: 404 };
  }
  if (user.user_type !== "admin") {
    return { error: "Only system users can fetch exist orders here", status: 400 };
  }

  const existId = toText(user.exist_id);
  if (!existId) {
    return { error: "This user has no Exist ID", status: 400 };
  }

  const existOrders = await ExistSathyaOrder.find({
    user_id: { $in: existIdMatchValues(existId) },
  }).lean();

  if (!existOrders.length) {
    return {
      error: "No exist orders found for this user",
      status: 404,
      found: 0,
      inserted: 0,
      skipped: 0,
    };
  }

  const orderNumbers = [...new Set(existOrders.map((order) => toText(order.order_number)).filter(Boolean))];
  const orderNumberValues = [...new Set(orderNumbers.flatMap((value) => existIdMatchValues(value)))];

  const details = orderNumberValues.length
    ? await ExistSathyaOrderDetail.find({ orderNumber: { $in: orderNumberValues } }).lean()
    : [];

  const detailsByOrder = new Map();
  for (const row of details) {
    const key = toText(row.orderNumber);
    if (!key) continue;
    const list = detailsByOrder.get(key) || [];
    list.push(row);
    existIdMatchValues(key).forEach((variant) => detailsByOrder.set(String(variant), list));
  }

  const existingLive = orderNumbers.length
    ? await EcomOrderInfo.find(
      { order_number: { $in: orderNumberValues.map(String) } },
      { order_number: 1 }
    ).lean()
    : [];
  const existingNumbers = new Set(
    existingLive.map((order) => toText(order.order_number)).filter(Boolean)
  );

  const docs = [];
  let skipped = 0;
  for (const existOrder of existOrders) {
    const orderNumber = emptyToNull(existOrder.order_number);
    if (!orderNumber) {
      skipped += 1;
      continue;
    }
    const already = existingNumbers.has(orderNumber)
      || [...existIdMatchValues(orderNumber)].some((value) => existingNumbers.has(String(value)));
    if (already) {
      skipped += 1;
      continue;
    }
    const lineItems = detailsByOrder.get(orderNumber)
      || detailsByOrder.get(String(Math.trunc(Number(orderNumber)) || orderNumber))
      || [];
    docs.push(buildLiveOrder(existOrder, lineItems, user));
    existingNumbers.add(orderNumber);
  }

  let inserted = 0;
  if (docs.length) {
    try {
      await EcomOrderInfo.collection.insertMany(docs, { ordered: false });
      inserted = docs.length;
    } catch (error) {
      const insertedIds = error.result?.insertedIds || error.insertedIds || {};
      inserted = Object.keys(insertedIds).length || 0;
      skipped += Math.max(0, docs.length - inserted);
    }
  }

  if (inserted > 0 || skipped > 0) {
    await User.updateOne({ _id: user._id }, { $set: { orders_fetched: 1 } });
  }

  return {
    success: true,
    found: existOrders.length,
    inserted,
    skipped,
    fetched: inserted > 0 || skipped > 0,
    message: inserted > 0
      ? `Orders fetched: ${inserted} inserted, ${skipped} already existed`
      : `No new orders inserted. ${skipped} already existed in live Orders`,
  };
}
