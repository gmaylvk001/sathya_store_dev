import OrderNew from "@/models/orders_new";
import CancelOrders from "@/models/cancel_orders";
import OrderHistoryNew from "@/models/order_history_new";
import StoreListing from "@/models/store_listings";
import { wondersoftAuthtoken, wondersoftCancelSalesOrder } from "@/lib/wondersoft";
import { sendCancelSms } from "@/lib/cancelSms";

const DEFAULT_STORE_CONTACT = "8068424842";

const CANCEL_SMS = {
  cancelled_wondersoft: {
    contentid: "1607100000000338032",
    build: (order, contactNo) =>
      `Hey ${toText(order.order_username) || "user"}! As per your request, order with ID: ${toText(order.order_number)} is canceled. Amount paid if any will be refunded in 3 to 5 days. https://www.sathya.store/user/orders Contact: ${contactNo}`,
  },
  cancelled_local: {
    contentid: "1307161734368746167",
    build: (order, contactNo) =>
      `Hey ${toText(order.order_username) || "user"}! As per your request, order with ID: ${toText(order.order_number)} is canceled. Amount paid if any will be refunded in 3 to 5 days. https://www.sathya.store/user/orders Contact: ${contactNo}`,
  },
  wondersoft_failed: {
    contentid: "1677100000000390761",
    build: (order, contactNo) =>
      `Hey ${toText(order.order_username) || "user"}! Your cancelation request for Order No: ${toText(order.order_number)} is not accepted. Please contact us at ${contactNo} for further clarifications. https://www.sathya.store/user/orders - SATHYA`,
  },
  billed_processing: {
    contentid: "1307161734328194669",
    build: (order, contactNo) =>
      `Hey ${toText(order.order_username) || "user"}! Your cancelation request for Order No: ${toText(order.order_number)} is being processed. We will notify you once the request is accepted. https://www.sathya.store/user/orders Contact: ${contactNo}`,
  },
};

function toText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

async function saveCancelRequest({ order, reason, comments, customerId, orderStatus }) {
  return CancelOrders.create({
    order_number: toText(order.order_number),
    order_id: String(order._id),
    customer_id: toText(customerId || order.user_id),
    order_status: toText(orderStatus || order.order_status),
    reason: toText(reason),
    comments: toText(comments) || null,
  });
}

async function saveOrderHistory(order, status, comment) {
  await OrderHistoryNew.create({
    order_id: String(order._id),
    order_number: toText(order.order_number) || null,
    order_status: status,
    notify: 1,
    comment: comment || null,
  });
}

async function markOrderCancelled(orderId) {
  await OrderNew.updateOne(
    { _id: orderId },
    { $set: { order_status: "Cancelled" } }
  );
}

/**
 * Exist: Listing by branch_code = pickup_type → Adtarbo virtual_no
 * Fallback: 8068424842
 */
async function getStoreContactNo(order) {
  const pickupType = toText(order.pickup_type);
  if (!pickupType) return DEFAULT_STORE_CONTACT;

  try {
    const listing = await StoreListing.findOne({ branch_code: pickupType }).lean();
    if (!listing) return DEFAULT_STORE_CONTACT;

    const listingId = toText(listing.exist_id) || String(listing._id);
    const apiUrl = `https://adtarbo.eywamedia.com/api/SathyaVNApi/${listingId}`;
    const res = await fetch(apiUrl, { method: "GET", headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => null);

    if (data && String(data.msg || "").toLowerCase() === "success" && data.virtual_no) {
      return String(data.virtual_no).trim();
    }
  } catch (error) {
    console.error("[getStoreContactNo]", error.message);
  }

  return DEFAULT_STORE_CONTACT;
}

async function sendCancelSms(order, kind, contactNo) {
  try {
    const mobile = toText(order.order_phonenumber);
    if (!mobile) return { success: false, skipped: true };

    const template = CANCEL_SMS[kind];
    if (!template) return { success: false, skipped: true, reason: "Unknown SMS kind" };

    const text = template.build(order, contactNo || DEFAULT_STORE_CONTACT);
    // Match Laravel: SMSHelper::send_sms(urlencode($text), ...)
    return sendCancelSms(encodeURIComponent(text), mobile, template.contentid);
  } catch (error) {
    console.error("[cancel SMS]", error.message);
    return { success: false, error: error.message };
  }
}

async function cancelOrderAPI(order) {
  const tokenResult = await wondersoftAuthtoken();
  if (!tokenResult.ok) {
    return {
      success: false,
      failureReason: "Error...Access token generate issue in wondersoft api",
      token: tokenResult,
    };
  }

  const created = order.created_at ? new Date(order.created_at) : new Date();
  const orderdate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(created)
    .reduce((acc, part) => {
      if (part.type === "year" || part.type === "month" || part.type === "day") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  const payload = {
    SalesOrderCancel: {
      OrderNumber: toText(order.order_number),
      OrderDate: `${orderdate.year}${orderdate.month}${orderdate.day}`,
      OrderLocation: toText(order.pickup_type),
    },
  };

  const posted = await wondersoftCancelSalesOrder(payload, tokenResult.accessToken);
  const apiStatus = posted.result || "";
  const failureReason =
    posted.failureReason ||
    posted.statusMessage ||
    "CancelSalesOrder failed";

  return {
    success: apiStatus === "SUCCESS",
    apiStatus,
    failureReason: apiStatus === "SUCCESS" ? "" : failureReason,
    statusMessage: posted.statusMessage || "",
    wondersoft: posted,
    payload,
  };
}

/**
 * Exist Laravel cancelOrder() branching + SMS templates/contentids + store contact.
 */
export async function cancelOrder({
  order,
  reason,
  comments = "",
  customerId = "",
  orderStatus = "",
}) {
  const currentStatus = toText(orderStatus || order.order_status);
  const pickupType = toText(order.pickup_type);
  const isBilled = currentStatus.toLowerCase() === "billed";
  const contactNo = await getStoreContactNo(order);

  const cancelPayload = {
    order,
    reason,
    comments,
    customerId,
    orderStatus: currentStatus,
  };

  // Billed → request only, status unchanged
  if (isBilled) {
    await saveCancelRequest(cancelPayload);
    await saveOrderHistory(order, "Waiting for Cancellation", reason);
    await sendCancelSms(order, "billed_processing", contactNo);
    return {
      result: "Success",
      order_status: currentStatus,
      branch: "billed_request_only",
      contact_no: contactNo,
    };
  }

  // Not billed + no store assigned → local cancel
  if (!pickupType) {
    await saveCancelRequest(cancelPayload);
    await markOrderCancelled(order._id);
    await saveOrderHistory(order, "Cancelled", reason);
    await sendCancelSms(order, "cancelled_local", contactNo);
    return {
      result: "Success",
      order_status: "Cancelled",
      branch: "local_cancelled",
      contact_no: contactNo,
    };
  }

  // Not billed + store assigned → Wondersoft CancelSalesOrder
  const api = await cancelOrderAPI(order);
  if (api.success) {
    await saveCancelRequest(cancelPayload);
    await markOrderCancelled(order._id);
    await saveOrderHistory(order, "Cancelled", reason);
    await sendCancelSms(order, "cancelled_wondersoft", contactNo);
    return {
      result: "Success",
      order_status: "Cancelled",
      branch: "wondersoft_cancelled",
      contact_no: contactNo,
      wondersoft: {
        result: api.apiStatus,
        statusMessage: api.statusMessage,
      },
    };
  }

  // FAIL → do NOT save cancel_orders / do NOT change order status
  await sendCancelSms(order, "wondersoft_failed", contactNo);
  return {
    result: api.failureReason || "CancelSalesOrder failed",
    order_status: currentStatus,
    branch: "wondersoft_failed",
    contact_no: contactNo,
    wondersoft: {
      result: api.apiStatus || "FAILURE",
      failureReason: api.failureReason,
    },
  };
}
