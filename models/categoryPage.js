import mongoose from "mongoose";
import { PAGE_TYPES } from "@/lib/categoryPageComponents/registry";

/**
 * Layout for one Category / Sub / Child category page.
 * components[] = ordered pluggable blocks (Top Banner first; more later).
 */
const PageComponentSchema = new mongoose.Schema(
  {
    instanceId: { type: String, required: true },
    type: { type: String, required: true },
    /** Links to type-specific config doc (required for multi-instance components) */
    configId: { type: mongoose.Schema.Types.ObjectId, default: null },
    /** Optional admin label (e.g. product set name) shown on Order page */
    title: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const CategoryPageSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      enum: Object.values(PAGE_TYPES),
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ecom_category_infos",
      required: true,
    },
    categoryName: { type: String, default: "" },
    categorySlug: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    components: { type: [PageComponentSchema], default: [] },
  },
  { timestamps: true }
);

CategoryPageSchema.index({ pageType: 1, categoryId: 1 }, { unique: true });
CategoryPageSchema.index({ categorySlug: 1, pageType: 1 });

export default mongoose.models.CategoryPage ||
  mongoose.model("CategoryPage", CategoryPageSchema);
