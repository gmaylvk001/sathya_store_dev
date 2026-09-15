import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";
import PaymentNewLive from "@/models/payment_new_live";
import Product from "@/models/product";
import mongoose from "mongoose";
import Coupon from "@/models/ecom_offer_info";
import Usedcoupon from "@/models/ecom_coupon_track_info";
import Notification from "@/models/Notification.js";

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

function mapOrderStatus(value) {
  if (value && ORDER_STATUS_ENUM.includes(value)) return value;
  if (String(value || "").toLowerCase() === "payment_initialized") return "Payment Initiated";
  return "pending";
}

function toObjectId(value) {
  if (!value) return null;
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
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

    const orderFields = {
      user_id: String(user_id),
      order_username,
      order_phonenumber,
      order_item,
      order_amount: String(order_amount),
      order_deliveryaddress,
      customer_comments,
      payment_method,
      payment_type,
      payment_mode: payment_type || payment_method || null,
      delivery_type: mapDeliveryType(delivery_type),
      payment_id: payment_id || null,
      order_number: order_number || null,
      user_adddeliveryid: user_adddeliveryid || null,
      email_address,
      order_status: mapOrderStatus(order_status),
      payment_status: payment_status || "unpaid",
      loyalty_points_redeemed: loyalty_points_redeemed || 0,
      loyalty_discount: loyalty_discount || 0,
      loyalty_redemption_token: loyalty_redemption_token || null,
      promotion_code_applied: promotion_code_applied || null,
      promotion_discount_applied: promotion_discount_applied || 0,
      pickup_store: pickup_store || null,
      store_id: resolvedStoreId,
      region: resolvedRegion,
      gst_number: gst_number || null,
      order_billingaddress: order_billingaddress || null,
      user_addbillingid: user_addbillingid || null,
      order_owner: isKarnatakaOrder ? "unilet" : "sathya",
    };

    const existingOrder = order_number
      ? await OrderNew.findOne({ order_number })
      : null;

    let savedOrder;
    let isNew = false;

    if (existingOrder) {
      Object.assign(existingOrder, orderFields);
      savedOrder = await existingOrder.save();
    } else {
      const newOrder = new OrderNew(orderFields);
      savedOrder = await newOrder.save();
      isNew = true;
    }

    if (payment_id) {
      await PaymentNewLive.findOneAndUpdate(
        { payment_id: String(payment_id) },
        {
          $set: {
            orderId: savedOrder._id,
            order_number: savedOrder.order_number || null,
            userId: toObjectId(user_id),
          },
        }
      );
    }

    if (isNew) {
      for (const item of order_item) {
        if (item.productId) {
          const product = await Product.findById(item.productId);
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
      }

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

    return Response.json(
      {
        success: true,
        message: isNew
          ? "Order created successfully"
          : "Order updated successfully",
        order: savedOrder,
      },
      { status: isNew ? 201 : 200 }
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
