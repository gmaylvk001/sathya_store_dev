import mongoose from "mongoose";

const CancelOrdersSchema = new mongoose.Schema({
  order_number: { type: String, required: true, trim: true, maxlength: 45 },
  order_id: { type: String, required: true, trim: true, maxlength: 45 },
  customer_id: { type: String, required: true, trim: true, maxlength: 45 },
  order_status: { type: String, required: true, trim: true, maxlength: 255 },
  reason: { type: String, required: true, trim: true, maxlength: 255 },
  comments: { type: String, required: false, default: null },
  created_at: { type: Date, required: false, default: null },
  updated_at: { type: Date, required: false, default: null },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  collection: "cancel_orders",
  strict: true,
});

CancelOrdersSchema.index({ order_number: 1 }, { name: "order_number_idx" });
CancelOrdersSchema.index({ order_id: 1 }, { name: "order_id_idx" });
CancelOrdersSchema.index({ customer_id: 1 }, { name: "customer_id_idx" });

if (mongoose.models.cancel_orders) {
  delete mongoose.models.cancel_orders;
}

export default mongoose.model("cancel_orders", CancelOrdersSchema);
