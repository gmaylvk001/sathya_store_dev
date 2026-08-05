import mongoose from "mongoose";

const ProductallSchema = new mongoose.Schema({
  item_code: String,
  price: Number,
  special_price: Number,
  quantity: Number,
  brand: String,
  movement: String,
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product_all || mongoose.model("Product_all", ProductallSchema);
