import mongoose from "mongoose";

const LaunchProductSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true },
    products: { type: String }, // textarea content
    desktop_images: [{ type: String }],
    mobile_images: [{ type: String }],
    stock_status: {
      type: String,
      enum: ["Choose", "Pre-Book", "In Stock", "Out Of Stock"],
      default: "Choose",
    },
    status: {
      type: String,
      enum: ["Choose", "Active", "Inactive"],
      default: "Choose",
    },
    page_design: {
      type: String,
      enum: ["Choose", "Old Design (Classic Pre-book)", "New Design"],
      default: "Choose",
    },
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

// Auto-generate slug from product_name before saving if slug is empty
LaunchProductSchema.pre("save", function (next) {
  if (this.isModified("product_name") && !this.slug) {
    this.slug = this.product_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

export default mongoose.models.launch_product ||
  mongoose.model("launch_product", LaunchProductSchema);
