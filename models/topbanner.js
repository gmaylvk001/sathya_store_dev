import mongoose from "mongoose";

const TopBannerSchema = new mongoose.Schema({
  banner_image: { type: String, required: true }, // store image path
  redirect_url: { type: String, required: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  order: { type: Number, default: 0 }, // 👈 added for sorting
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.top_banners ||
  mongoose.model("top_banners", TopBannerSchema);
