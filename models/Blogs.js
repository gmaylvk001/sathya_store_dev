import mongoose from "mongoose";

const FaqSchema = new mongoose.Schema({
  question: { type: String },
  answer: { type: String },
});

const BlogsSchema = new mongoose.Schema(
  {
    blogTitle: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    stores: [{ type: String }],
    isAllStores: { type: Boolean, default: false },
    category: { type: String },
    shortDescription: { type: String },
    description: { type: String },
    faqs: [FaqSchema],
    author: { type: String },
    readingTime: { type: Number },
    publishDate: { type: Date },
    bannerImage: { type: String },
    featuredImage: { type: String },
    metaTitle: { type: String },
    metaKeywords: { type: String },
    metaDescription: { type: String },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.models.Blogs || mongoose.model("Blogs", BlogsSchema);
