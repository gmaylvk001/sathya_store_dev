import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";
import OrderDetailsNew from "@/models/order_details_new";
import OrderHistoryNew from "@/models/order_history_new";
import PaymentNewLive from "@/models/payment_new_live";
import Product from "@/models/product";
import mongoose from "mongoose";
import Coupon from "@/models/ecom_offer_info";
import Usedcoupon from "@/models/ecom_coupon_track_info";
import Notification from "@/models/Notification.js";
import { sendOrderData } from "@/lib/sendOrderData";

const ORDER_STATUS_ENUM = [
  "Billed",
  "Cancelled",
  "Complete",
  "failure",
  "Order Accepted",
  "Order Placed",
  "ordered",
  "Payment Initiated",
  "pending",
];

function mapDeliveryType(value) {
  if (value === "store_pickup" || value === "store") return "store";
  return "home";
}

function mapOrderStatus(value, payment_status) {
  const paymentKey = String(payment_status || "").toLowerCase().replace(/[_-]+/g, " ").trim();
  if (paymentKey === "payment initialized" || paymentKey === "payment initiated") {
    return "Payment Initiated";
  }
  if (value && ORDER_STATUS_ENUM.includes(value)) return value;
  if (String(value || "").toLowerCase().replace(/[_-]+/g, " ").trim() === "payment initialized") {
    return "Payment Initiated";
  }
  return "pending";
}

function toObjectId(value) {
  if (!value) return null;
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
}

function stringify(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

function toNumber(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function makeOrderNumber(base, index) {
  const raw = stringify(base) || `ORD${Date.now()}`;
  if (index === 0) return raw;
  const prefixMatch = raw.match(/^(ORD)/i);
  const prefix = prefixMatch ? prefixMatch[1] : "ORD";
  const numeric = raw.replace(/^ORD/i, "");
  if (/^\d+$/.test(numeric)) {
    return `${prefix}${String(BigInt(numeric) + BigInt(index))}`;
  }
  return `${raw}-${index + 1}`;
}

function lineAmount(item) {
  const price = toNumber(item.price ?? item.product_price, 0) || 0;
  const qty = toNumber(item.quantity, 1) || 1;
  const discount = toNumber(item.discount, 0) || 0;
  const warranty = toNumber(item.warrantyData?.price ?? item.warranty, 0) || 0;
  const total = price * qty - discount + warranty;
  return Number.isFinite(total) && total > 0 ? total : price * qty;
}

function buildOrderDetailRows(order_item, order_details, savedOrder, userId) {
  const source = Array.isArray(order_details) && order_details.length
    ? order_details
    : Array.isArray(order_item) ? order_item : [];

  return source.map((row) => {
    const rawCode = row.item_code || row.itemCode || "";
    const itemCode = rawCode
      ? (String(rawCode).startsWith("ITEM") ? String(rawCode) : `ITEM${rawCode}`)
      : null;
    const productId = row.product_id ?? row.productId ?? row.id ?? null;
    const price = row.product_price ?? row.price ?? null;

    return {
      order_id: savedOrder._id,
      user_id: toObjectId(userId),
      item_code: itemCode,
      product_id: productId != null ? String(productId) : null,
      product_name: stringify(row.product_name || row.name),
      product_price: price != null ? String(price) : null,
      model: stringify(row.model),
      quantity: toNumber(row.quantity, 1),
      store_id: stringify(row.store_id),
      orderNumber: stringify(savedOrder.order_number),
      coupon_discount: toNumber(row.coupon_discount ?? row.coupondiscount, 0),
      image: stringify(row.image),
      discount: toNumber(row.discount),
      warrantyData: row.warrantyData || null,
      coupondetails: row.coupondetails ?? null,
      type: stringify(row.type) || "online",
    };
  }).filter((row) => row.product_name || row.item_code || row.product_id);
}

async function applyItemSideEffects(item, user_id) {
  const productId = item.productId || item.id || item.product_id;
  if (!productId) return;

  const product = await Product.findById(productId);
  const discount = item.discount;

  if (
    discount > 0 &&
    item.coupondetails?.length > 0 &&
    item.coupondetails[0]?._id
  ) {
    const userObjectId = new mongoose.Types.ObjectId(user_id);
    const couponid = new mongoose.Types.ObjectId(item.coupondetails[0]._id);

    const coupon_track = new Usedcoupon({
      coupon_id: couponid,
      user_id: userObjectId,
    });
    await coupon_track.save();

    const updatecoupon = await Coupon.findById(couponid);
    if (updatecoupon) {
      updatecoupon.used_by += 1;
      await updatecoupon.save();
    }
  }

  if (product && product.quantity > 0) {
    product.quantity = product.quantity - item.quantity;
    await product.save();
  }
}

async function saveOrderHistory(savedOrder) {
  const existingHistory = await OrderHistoryNew.countDocuments({
    $or: [
      { order_id: String(savedOrder._id) },
      { order_number: savedOrder.order_number },
    ],
  });
  if (existingHistory > 0) return;

  await OrderHistoryNew.create({
    order_id: String(savedOrder._id),
    order_number: stringify(savedOrder.order_number),
    order_status: stringify(savedOrder.order_status) || "pending",
    notify: 0,
    comment: "Order placed",
  });
}

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();

    const {
      user_id,
      order_username,
      order_phonenumber,
      order_item,
      order_amount,
      order_deliveryaddress,
      customer_comments,
      payment_method,
      payment_type,
      order_status,
      delivery_type,
      payment_id,
      order_number,
      payment_status,
      user_adddeliveryid,
      email_address,
      loyalty_points_redeemed,
      loyalty_discount,
      loyalty_redemption_token,
      promotion_code_applied,
      promotion_discount_applied,
      pickup_store,
      store_id,
      gst_number,
      order_billingaddress,
      user_addbillingid,
      order_details,
      pickup_type,
    } = body;

    if (
      !user_id ||
      !email_address ||
      !order_phonenumber ||
      !order_item?.length ||
      !order_amount
    ) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const isKarnatakaOrder =
      /karnataka/i.test(order_deliveryaddress || "") ||
      (order_item &&
        order_item.some((item) => item.store_id === "unilet" || item.isUnilet)) ||
      store_id === "unilet";

    const resolvedRegion = isKarnatakaOrder
      ? "karnataka"
      : body.region || "tamilnadu";
    const resolvedStoreId = isKarnatakaOrder ? "unilet" : store_id || null;

    const mappedStatus = mapOrderStatus(order_status, payment_status);
    const mappedDelivery = mapDeliveryType(delivery_type);
    const baseOrderNumber = stringify(order_number) || `ORD${Date.now()}`;
    const detailsList = Array.isArray(order_details) ? order_details : [];

    const sharedFields = {
      user_id: String(user_id),
      order_username,
      order_phonenumber,
      order_deliveryaddress,
      customer_comments,
      payment_method,
      payment_type,
      payment_mode: payment_type || payment_method || null,
      delivery_type: mappedDelivery,
      payment_id: payment_id || null,
      user_adddeliveryid: user_adddeliveryid || null,
      email_address,
      order_status: mappedStatus,
      payment_status: payment_status || "unpaid",
      loyalty_redemption_token: loyalty_redemption_token || null,
      pickup_store: pickup_store || null,
      store_id: resolvedStoreId,
      region: resolvedRegion,
      gst_number: gst_number || null,
      order_billingaddress: order_billingaddress || null,
      user_addbillingid: user_addbillingid || null,
      order_owner: isKarnatakaOrder ? "unilet" : "sathya",
      pickup_type: pickup_type || null,
    };

    const siblingNumbers = order_item.map((_, index) => makeOrderNumber(baseOrderNumber, index));
    const existingOrders = await OrderNew.find({
      order_number: { $in: siblingNumbers },
    });
    const existingByNumber = new Map(
      existingOrders.map((order) => [order.order_number, order])
    );

    const savedOrders = [];
    let createdAny = false;

    for (let index = 0; index < order_item.length; index++) {
      const item = order_item[index];
      const thisOrderNumber = siblingNumbers[index];
      const existing = existingByNumber.get(thisOrderNumber);
      const thisAmount = lineAmount(item);

      const perOrderFields = {
        ...sharedFields,
        order_item: [item],
        order_amount: String(thisAmount || order_amount),
        order_number: thisOrderNumber,
        loyalty_points_redeemed: index === 0 ? (loyalty_points_redeemed || 0) : 0,
        loyalty_discount: index === 0 ? (loyalty_discount || 0) : 0,
        promotion_code_applied: index === 0 ? (promotion_code_applied || null) : null,
        promotion_discount_applied: index === 0 ? (promotion_discount_applied || 0) : 0,
      };

      let savedOrder;
      let isNew = false;

      if (existing) {
        existing.payment_id = payment_id || existing.payment_id;
        existing.payment_status = payment_status || existing.payment_status;
        existing.payment_method = payment_method || existing.payment_method;
        existing.payment_type = payment_type || existing.payment_type;
        existing.payment_mode = payment_type || payment_method || existing.payment_mode;
        existing.order_status = mappedStatus;
        savedOrder = await existing.save();
      } else {
        savedOrder = await new OrderNew(perOrderFields).save();
        isNew = true;
        createdAny = true;
      }

      const existingDetailCount = await OrderDetailsNew.countDocuments({
        order_id: savedOrder._id,
      });
      if (existingDetailCount === 0) {
        const matchedDetail = detailsList[index] ? [detailsList[index]] : [item];
        const detailRows = buildOrderDetailRows([item], matchedDetail, savedOrder, user_id);
        if (detailRows.length) {
          await OrderDetailsNew.insertMany(detailRows);
        }
      }

      if (isNew) {
        await applyItemSideEffects(item, user_id);
        await saveOrderHistory(savedOrder);

        try {
          const notification = new Notification({
            userId: user_id,
            message: `Order #${savedOrder.order_number || savedOrder._id} placed successfully!`,
            orderId: savedOrder._id,
          });
          await notification.save();
        } catch (notifErr) {
          console.error("Notification creation failed:", notifErr);
        }
      }

      savedOrders.push(savedOrder);
    }

    const primaryOrder = savedOrders[0];

    if (payment_id && primaryOrder) {
      const gatewayPaymentId = String(payment_id);
      let paymentDoc = await PaymentNewLive.findOneAndUpdate(
        { payment_id: gatewayPaymentId },
        {
          $set: {
            orderId: primaryOrder._id,
            order_number: primaryOrder.order_number || null,
            userId: toObjectId(user_id),
          },
        },
        { new: true }
      );

      if (!paymentDoc && mongoose.isValidObjectId(gatewayPaymentId)) {
        paymentDoc = await PaymentNewLive.findByIdAndUpdate(
          gatewayPaymentId,
          {
            $set: {
              orderId: primaryOrder._id,
              order_number: primaryOrder.order_number || null,
              userId: toObjectId(user_id),
            },
          },
          { new: true }
        );
      }

      if (paymentDoc?._id) {
        const paymentObjectId = String(paymentDoc._id);
        await OrderNew.updateMany(
          { _id: { $in: savedOrders.map((order) => order._id) } },
          { $set: { payment_id: paymentObjectId } }
        );
        savedOrders.forEach((order) => {
          order.payment_id = paymentObjectId;
        });
      }
    }

    // Auto CreateSalesOrder for Store Pickup
    if (primaryOrder && sharedFields.delivery_type === "store") {
      const pm = String(sharedFields.payment_method || "").toLowerCase().trim();
      const ps = String(sharedFields.payment_status || "").toLowerCase().trim();
      
      const isOfflinePayment = 
        pm === "cash on delivery" || 
        pm === "cod" ||
        pm === "pay_at_store" || 
        pm === "pay at store" ||
        pm === "emi" ||
        pm === "bajaj finance" ||
        pm === "bajajemioffline";
        
      const isOnlinePaid = (pm === "online" && (ps === "paid" || ps === "success"));

      if (isOfflinePayment || isOnlinePaid) {
        try {
          await sendOrderData(primaryOrder._id, "Auto CreateSalesOrder for store checkout");
        } catch (err) {
          console.error("Auto sendOrderData error:", err);
        }
      }
    }

    return Response.json(
      {
        success: true,
        message: createdAny
          ? "Order created successfully"
          : "Order updated successfully",
        order: primaryOrder,
        orders: savedOrders,
      },
      { status: createdAny ? 201 : 200 }
    );
  } catch (error) {
    console.error("ORDER ERROR:", error.message, error.stack);
    return Response.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
