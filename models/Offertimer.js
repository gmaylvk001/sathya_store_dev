import mongoose from "mongoose";

const OffertimerSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      enum: ["tamilnadu", "andhra", "kerala", "karnataka", "telangana", "all"],
      default: "all",
      index: true,
    },
    offer_start: { type: Date, required: true },
    offer_end: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    offer_title: { type: String, required: true },
  },
  { timestamps: true }
);

OffertimerSchema.index({ state: 1, status: 1, offer_start: 1, offer_end: 1 });

export default mongoose.models.Offertimer ||
  mongoose.model("Offertimer", OffertimerSchema);
