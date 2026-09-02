import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";
import Product from "@/models/product";
import mongoose from 'mongoose';
import Coupon from '@/models/ecom_offer_info';
import Usedcoupon from '@/models/ecom_coupon_track_info';

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
      customer_comments, // IMPORTANT
      payment_method,
      payment_type,
      order_status,
      delivery_type,
      payment_id,
      order_number,
      order_details,
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
    } = body;

    // Validate required fields
    if (!user_id || !email_address || !order_phonenumber || !order_item?.length || !order_amount) {
      return Response.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const orderFields = {
      user_id,
      order_username,
      order_phonenumber,
      order_item,
      order_amount,
      order_deliveryaddress,
      customer_comments, // IMPORTANT
      payment_method,
      payment_type,
      delivery_type,
      payment_id,
      order_number,
      order_details,
      user_adddeliveryid,
      email_address,
      order_status: order_status || "pending",
      payment_status: payment_status || "unpaid",
      loyalty_points_redeemed: loyalty_points_redeemed || 0,
          loyalty_discount: loyalty_discount || 0,
      loyalty_redemption_token: loyalty_redemption_token || null,
      promotion_code_applied: promotion_code_applied || null,
     promotion_discount_applied: promotion_discount_applied || 0,
      pickup_store: pickup_store || null,
      store_id: store_id || null,
      gst_number: gst_number || null,
    };

    // Check if order already exists (match by order_number if provided, else user + pending order)
    const existingOrder = order_number
      ? await EcomOrderInfo.findOne({ order_number })
      : null;

    let savedOrder;
    let isNew = false;

    if (existingOrder) {
      // Update existing order fields
      Object.assign(existingOrder, orderFields);
      savedOrder = await existingOrder.save();
    } else {
      // Create new order
      const newOrder = new EcomOrderInfo(orderFields);
      savedOrder = await newOrder.save();
      isNew = true;
    }

    // Only run side-effects (stock deduction, coupon tracking) for new orders
    if (isNew) {
      for (const item of order_item) {
        if (item.productId) {
          const product = await Product.findById(item.productId);
          const discount = item.discount;

          if (discount > 0 && item.coupondetails?.length > 0 && item.coupondetails[0]?._id) {
           const userObjectId = new mongoose.Types.ObjectId(user_id);
          const couponid = new mongoose.Types.ObjectId(item.coupondetails[0]._id);

            const coupon_track = new Usedcoupon({ coupon_id: couponid, user_id: userObjectId });
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

      // Create notification only for new orders
      try {
        const Notification = require("@/models/Notification.js");
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
        message: isNew ? "Order created successfully" : "Order updated successfully",
        order: savedOrder,
      },
      { status: isNew ? 201 : 200 }
    );

 } catch (error) {
  console.error("ORDER ERROR:", error.message, error.stack); 
  return Response.json({ 
    success: false, 
    message: "Server error", 
    error: error.message 
  }, { status: 500 });
}
}