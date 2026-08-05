import mongoose from "mongoose";

const BannerItemSchema = new mongoose.Schema(
  {
    desktopImage: { type: String, default: "" },
    mobileImage: { type: String, default: "" },
    url: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

/**
 * Top Banner set for one Category / Sub Category / Child Category.
 * Multiple banner images per category document.
 */
const CategoryTopBannerSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ecom_category_infos",
      required: true,
    },
    categoryName: { type: String, default: "" },
    categorySlug: { type: String, default: "" },
    pageType: {
      type: String,
      enum: ["category", "sub_category", "child_category"],
      default: "category",
    },
    banners: { type: [BannerItemSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

CategoryTopBannerSchema.index({ categoryId: 1 }, { unique: true });
CategoryTopBannerSchema.index({ categorySlug: 1 });

export default mongoose.models.CategoryTopBanner ||
  mongoose.model("CategoryTopBanner", CategoryTopBannerSchema);
