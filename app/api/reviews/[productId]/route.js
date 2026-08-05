import dbConnect from "@/lib/db";
import Review from "@/models/Review";
import User from "@/models/User";
import product from "@/models/product";
import ecom_order_info from "@/models/ecom_order_info";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  await dbConnect();
  const { productId } = await params;

  try {
    const reviews = await Review.find({ product_id : productId, review_status: "active"})
      .populate("user_id", "name email")
      .sort({ created_date: -1 }); 
      console.log(reviews);
      // Calculate avg rating
      const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.reviews_rating, 0) / reviews.length
        : 0;

    return new Response(
      JSON.stringify({
        success: true,
        reviews,
        avgRating,
        count: reviews.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
    });
  }
}

export async function POST(request, { params }) {
  await dbConnect();
  const { productId } = await params;

  try {
    const body = await request.json();
    const { userId, reviews_title, reviews_rating, reviews_comments } = body;

    if (!userId || !reviews_title || !reviews_rating) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const products    = await product.findOne({_id : productId}).sort({created_date : 1});
    const item_code   = products.item_code;

    const order_check = await ecom_order_info.countDocuments({ "order_item.item_code": item_code, order_status : "shipped", user_id : userId });
    console.log(order_check);

    if (order_check >= 1) {

      const review_check = await Review.countDocuments({user_id : userId, product_id : productId});
      console.log(review_check);

      if(review_check < 1) {
        const newReview = await Review.create({
          user_id: userId,
          product_id: productId,
          reviews_title,
          reviews_rating,
          reviews_comments,
        });

        return new Response(
          JSON.stringify({ success: true, review: newReview }),
          { status: 201 }
        );
      }else {
        return new Response(
          JSON.stringify({ success: false, error: "You have already reviewed this product!.." }),
          { status: 409 }
        );
      }
    }else {
      return new Response(
        JSON.stringify({ success: false, error: "You are not buying this product yet, So you cannot Review this product" }),
        { status: 403 }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}