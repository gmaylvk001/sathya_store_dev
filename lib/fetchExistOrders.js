import ExistSathyaOrder from "@/models/ExistSathyaOrder";
import ExistSathyaOrderDetail from "@/models/ExistSathyaOrderDetail";
import OrderNew from "@/models/orders_new";
import OrderDetailsNew from "@/models/order_details_new";
import PaymentsNew from "@/models/payments_new";
import PaymentNewLive from "@/models/payment_new_live";
import OrderHistoryNew from "@/models/order_history_new";
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

function matchStringList(value) {
  return existIdMatchValues(value).map(String);
}

function normalizeStatusKey(value) {
  return toText(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function mapOrderStatus(value) {
  const raw = toText(value);
  if (["pending", "cancelled", "shipped", "Order Placed", "Failure", "payment_initialized", "Billed", "Order Accepted", "ordered", "Complete"].includes(raw)) {
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
    "order accepted": "Order Accepted",
    ordered: "ordered",
    billed: "Billed",
    complete: "Complete",
    completed: "Complete",
  };
  return map[lower] || "pending";
}

function mapDeliveryType(value) {
  const raw = toText(value);
  if (raw === "home" || raw === "store_pickup") {
    return raw;
  }
  const lower = normalizeStatusKey(raw);
  if (
    lower === "store" ||
    lower === "store pickup" ||
    lower === "storepickup" ||
    lower === "pickup"
  ) {
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

function buildNewOrderHeader(existOrder, details, user, payment) {
  const orderNumber = emptyToNull(existOrder.order_number);
  const liveUserId = String(user._id);
  const email = emptyToNull(user.email) || `exist-${liveUserId}@sathya.local`;
  const username = emptyToNull(existOrder.order_username) || emptyToNull(user.name) || "User";
  const phone = emptyToNull(existOrder.order_phonenumber) || emptyToNull(user.mobile) || "0";
  const amount = emptyToNull(existOrder.order_amount) || "0";
  const orderStatus = mapOrderStatus(existOrder.order_status);
  const paymentMode = emptyToNull(payment?.PaymentMode) || emptyToNull(payment?.ModeType);
  let paymentStatus = mapPaymentStatus(payment?.status || existOrder.online_pay_ref_status);
  if (orderStatus === "payment_initialized" && paymentStatus !== "paid") {
    paymentStatus = "payment_initialized";
  }

  return {
    exist_id: emptyToNull(existOrder.exist_id),
    cart_id: emptyToNull(existOrder.cart_id),
    user_id: liveUserId,
    sales_person_id: toNumber(existOrder.sales_person_id),
    sales_person_role: toNumber(existOrder.sales_person_role),
    user_adddeliveryid: emptyToNull(existOrder.user_adddeliveryid),
    user_addbillingid: emptyToNull(existOrder.user_addbillingid),
    order_username: username,
    order_phonenumber: phone,
    email_address: email,
    order_item: buildOrderItems(details, existOrder.order_item),
    order_amount: amount,
    order_deliveryaddress: emptyToNull(existOrder.order_deliveryaddress),
    order_billingaddress: emptyToNull(existOrder.order_billingaddress),
    customer_comments: "",
    payment_method: paymentMode || emptyToNull(existOrder.payment_method),
    payment_type: emptyToNull(payment?.ModeType) || emptyToNull(existOrder.payment_type) || paymentMode,
    payment_mode: paymentMode || emptyToNull(existOrder.payment_type),
    payment_status: paymentStatus,
    order_status: orderStatus,
    delivery_type: mapDeliveryType(existOrder.delivery_type),
    pickup_store: emptyToNull(existOrder.pickup_type),
    pickup_type: emptyToNull(existOrder.pickup_type),
    store_id: emptyToNull(details[0]?.store_id),
    payment_id: emptyToNull(existOrder.payment_id),
    order_number: orderNumber,
    api_status: emptyToNull(existOrder.api_status) || "PENDING",
    api_reason: emptyToNull(existOrder.api_reason),
    type: emptyToNull(existOrder.type) || emptyToNull(details[0]?.type) || "online",
    file_path: emptyToNull(existOrder.file_path),
    invoice: emptyToNull(existOrder.invoice),
    is_tac: toNumber(existOrder.is_tac),
    archive: toNumber(existOrder.archive) ?? 0,
    referrel_url: emptyToNull(existOrder.referrel_url),
    utm_source: emptyToNull(existOrder.utm_source),
    utm_campaign: emptyToNull(existOrder.utm_campaign),
    coupon_discount: toNumber(existOrder.coupon_discount),
    eo_discount: toNumber(existOrder.eo_discount),
    coupon_id: emptyToNull(existOrder.coupon_id),
    offline_order_date: existOrder.offline_order_date || null,
    emi_txn_ref_no: emptyToNull(existOrder.emi_txn_ref_no),
    rcu_status: toNumber(existOrder.rcu_status) ?? 0,
    asset_status: toNumber(existOrder.asset_status) ?? 0,
    do_generation_status: toNumber(existOrder.do_generation_status) ?? 0,
    doc_status: toNumber(existOrder.doc_status) ?? 0,
    qc_status: toNumber(existOrder.qc_status) ?? 0,
    bajajbilling: toNumber(existOrder.bajajbilling) ?? 0,
    schema_request: existOrder.schema_request ?? null,
    bajaj_do_checkout: existOrder.bajaj_do_checkout != null ? String(existOrder.bajaj_do_checkout) : null,
    netamt: emptyToNull(payment?.ModeValue) || emptyToNull(existOrder.netamt) || amount,
    online_pay_refid: emptyToNull(payment?.payment_id) || emptyToNull(existOrder.online_pay_refid),
    online_pay_ref_status: emptyToNull(payment?.status) || emptyToNull(existOrder.online_pay_ref_status),
    order_owner: emptyToNull(existOrder.order_owner) === "unilet" ? "unilet" : "sathya",
    created_at: existOrder.created_at || new Date(),
    updated_at: existOrder.updated_at || new Date(),
  };
}

function buildNewDetailRows(details, savedOrder, liveUserId) {
  return details.map((row) => ({
    exist_id: emptyToNull(row.exist_id),
    order_id: savedOrder._id,
    item_code: emptyToNull(row.item_code),
    product_id: row.product_id != null ? String(row.product_id) : null,
    product_name: emptyToNull(row.product_name),
    product_price: row.product_price != null ? String(row.product_price) : null,
    model: emptyToNull(row.model),
    user_id: liveUserId,
    created_at: row.created_at || savedOrder.created_at || new Date(),
    updated_at: row.updated_at || new Date(),
    quantity: toNumber(row.quantity, 1),
    store_id: emptyToNull(row.store_id),
    orderNumber: emptyToNull(savedOrder.order_number) || emptyToNull(row.orderNumber),
    coupon_discount: toNumber(row.coupon_discount, 0),
    is_gift: toNumber(row.is_gift),
    gift_Price_to_apply: toNumber(row.gift_Price_to_apply),
    is_combo: toNumber(row.is_combo),
    warranty_product_code: emptyToNull(row.warranty_product_code),
    is_warranty: toNumber(row.is_warranty),
    is_view: toNumber(row.is_view),
    type: emptyToNull(row.type) || "online",
    is_exchange_offer: toNumber(row.is_exchange_offer),
    eo_amount: toNumber(row.eo_amount),
    exchange_off_type: emptyToNull(row.exchange_off_type),
    exchange_off_brand: emptyToNull(row.exchange_off_brand),
    exchange_off_cond: emptyToNull(row.exchange_off_cond),
    exchange_off_pin: toNumber(row.exchange_off_pin),
    exchange_off_amount: toNumber(row.exchange_off_amount),
    special_offer_id: toNumber(row.special_offer_id),
    special_discount_id: toNumber(row.special_discount_id),
    special_discount_type: emptyToNull(row.special_discount_type),
    special_offer_discount: toNumber(row.special_offer_discount),
    is_special_offer: toNumber(row.is_special_offer),
    is_checkout_offer: toNumber(row.is_checkout_offer),
    checkout_offer_type: emptyToNull(row.checkout_offer_type),
    checkout_offer_id: toNumber(row.checkout_offer_id),
    checkout_offer_discount: toNumber(row.checkout_offer_discount),
  }));
}

function findPaymentForOrder(existOrder, paymentByKey) {
  for (const key of existIdMatchValues(existOrder.payment_id)) {
    const payment = paymentByKey.get(String(key));
    if (payment) return payment;
  }
  return null;
}

async function loadPaymentsByOrderRefs(existOrders) {
  const keys = [...new Set(
    existOrders.flatMap((order) => matchStringList(order.payment_id)).filter(Boolean)
  )];
  if (!keys.length) return new Map();

  const payments = await PaymentsNew.find({
    exist_id: { $in: keys },
  }).lean();

  const map = new Map();
  for (const payment of payments) {
    existIdMatchValues(payment.exist_id).forEach((key) => map.set(String(key), payment));
  }
  return map;
}

function buildLivePayment(existOrder, savedOrder, user, payment) {
  const amount = toNumber(payment?.ModeValue)
    ?? toNumber(existOrder.netamt)
    ?? toNumber(existOrder.order_amount);

  return {
    orderId: savedOrder._id,
    userId: user._id,
    exist_id: emptyToNull(payment?.exist_id) || emptyToNull(existOrder.payment_id),
    order_number: emptyToNull(savedOrder.order_number),
    amount,
    status: emptyToNull(payment?.status) || emptyToNull(existOrder.online_pay_ref_status) || "pending",
    ModeType: emptyToNull(payment?.ModeType),
    PaymentMode: emptyToNull(payment?.PaymentMode) || emptyToNull(existOrder.payment_method),
    ModeReference: emptyToNull(payment?.ModeReference),
    ReferenceDate: payment?.ReferenceDate || null,
    ModeValue: emptyToNull(payment?.ModeValue) || emptyToNull(existOrder.netamt) || emptyToNull(existOrder.order_amount),
    payment_id: emptyToNull(payment?.payment_id) || emptyToNull(existOrder.online_pay_refid),
    payment_date: emptyToNull(payment?.payment_date),
    pinelab_plural_orderid: emptyToNull(payment?.pinelab_plural_orderid),
    pinelab_payment_id: emptyToNull(payment?.pinelab_payment_id),
    created_at: payment?.created_at || existOrder.created_at || new Date(),
    updated_at: payment?.updated_at || existOrder.updated_at || new Date(),
  };
}

async function insertLivePayment(existOrder, savedOrder, user, payment) {
  const existing = await PaymentNewLive.findOne({ orderId: savedOrder._id }).lean();
  if (existing) {
    return false;
  }

  try {
    await PaymentNewLive.create(buildLivePayment(existOrder, savedOrder, user, payment));
    return true;
  } catch (error) {
    if (error?.code === 11000) {
      return false;
    }
    throw error;
  }
}

async function linkHistory(existOrder, savedOrder) {
  const orderId = String(savedOrder._id);
  const orderNumber = emptyToNull(savedOrder.order_number);
  const historyKeys = [
    ...matchStringList(orderNumber),
    ...matchStringList(existOrder.exist_id),
  ];

  if (!historyKeys.length) {
    return 0;
  }

  const result = await OrderHistoryNew.updateMany(
    {
      exist_id: { $type: "string" },
      $or: [
        { order_number: { $in: historyKeys } },
        { order_id: { $in: matchStringList(existOrder.exist_id) } },
      ],
    },
    { $set: { order_id: orderId, order_number: orderNumber } }
  );
  return result.modifiedCount || result.matchedCount || 0;
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
    ? await OrderNew.find(
      { order_number: { $in: orderNumberValues.map(String) } },
      { order_number: 1, _id: 1, exist_id: 1, payment_id: 1 }
    ).lean()
    : [];
  const existingByNumber = new Map();
  for (const order of existingLive) {
    existIdMatchValues(order.order_number).forEach((key) => existingByNumber.set(String(key), order));
  }

  const paymentByKey = await loadPaymentsByOrderRefs(existOrders);

  let inserted = 0;
  let skipped = 0;
  let paymentsLinked = 0;
  let historyLinked = 0;

  for (const existOrder of existOrders) {
    const orderNumber = emptyToNull(existOrder.order_number);
    if (!orderNumber) {
      skipped += 1;
      continue;
    }

    const already = existingByNumber.get(orderNumber)
      || [...existIdMatchValues(orderNumber)].map((value) => existingByNumber.get(String(value))).find(Boolean);
    const lineItems = detailsByOrder.get(orderNumber)
      || detailsByOrder.get(String(Math.trunc(Number(orderNumber)) || orderNumber))
      || [];
    const payment = findPaymentForOrder(existOrder, paymentByKey);

    if (already) {
      skipped += 1;
      if (await insertLivePayment(existOrder, already, user, payment)) {
        paymentsLinked += 1;
      }
      historyLinked += (await linkHistory(existOrder, already)) ? 1 : 0;
      continue;
    }

    try {
      const saved = await OrderNew.create(buildNewOrderHeader(existOrder, lineItems, user, payment));
      if (lineItems.length) {
        await OrderDetailsNew.insertMany(buildNewDetailRows(lineItems, saved, user._id));
      }
      if (await insertLivePayment(existOrder, saved, user, payment)) {
        paymentsLinked += 1;
      }
      historyLinked += (await linkHistory(existOrder, saved)) ? 1 : 0;
      inserted += 1;
      existIdMatchValues(orderNumber).forEach((key) => existingByNumber.set(String(key), saved));
    } catch (error) {
      skipped += 1;
      console.error("Exist order insert failed:", error.message);
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
    paymentsLinked,
    historyLinked,
    fetched: inserted > 0 || skipped > 0,
    message: inserted > 0
      ? `Orders fetched: ${inserted} inserted, ${skipped} already existed. Live payments inserted: ${paymentsLinked}, history linked: ${historyLinked}`
      : `No new orders inserted. ${skipped} already existed. Live payments inserted: ${paymentsLinked}, history linked: ${historyLinked}`,
  };
}
