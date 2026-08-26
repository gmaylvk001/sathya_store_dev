import mongoose from "mongoose";

const OwnerProductSchema = new mongoose.Schema(
  {
    owner_id: { type: String, default: "unilet", index: true },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    product_item_code: { type: String, index: true },
    vendor_item_code: { type: String },
    vendor_product_name: { type: String },
    price: { type: Number, required: true },
    offer_price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    warranty: { type: String },
    delivery_days: { type: Number, default: 1 },
    region: {
      type: String,
      enum: ["all", "tamilnadu", "karnataka", "andhra", "kerala", "telangana"],
      default: "karnataka",
      index: true,
    },
    is_active: { type: Boolean, default: true, index: true },
    stock_status: {
      type: String,
      enum: ["In Stock", "Out of Stock"],
      default: "In Stock",
    },
  },
  { timestamps: true }
);

OwnerProductSchema.index({ product_id: 1, is_active: 1 });
OwnerProductSchema.index({ product_id: 1, region: 1, is_active: 1 });
OwnerProductSchema.index({ product_item_code: 1, is_active: 1 });

export default mongoose.models.OwnerProduct ||
  mongoose.model("OwnerProduct", OwnerProductSchema);
