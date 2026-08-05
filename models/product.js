import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: String,
  md5_name : String,
  slug: String,
  item_code: String,
  brand_code: String,
  price: Number,
  special_price: Number,
  quantity: Number,
  description: String,
  category: String,
  sub_category: String,
  brand: String,
  size: { type: String, default: "" },
  star: { type: String, default: "" },
  category: String,
  movement: String,
  model_number: String,
  key_specifications : { type: [String], default: [] },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  stock_status: { type: String, enum: ["In Stock", "Out of Stock"], default: "In Stock" },
  hasVariants: { type: Boolean, default: false },
  variants: { type: Object, default: {} },
  images: { type: [String], default: [] }, 
  filter : { type: Object, default: {} },
  overview_image: { type: [String], default: [] }, 
  featured_products :{ type: Object, default: {} },
  related_products: { 
  type: [mongoose.Schema.Types.ObjectId], 
  ref: "Product", 
  default: [] 
},
add_ons: {
  type: [mongoose.Schema.Types.ObjectId],
  ref: "Product",
  default: [],
},

warranty_ids: {
  type: [String],
  default: [],
},
  warranty: Number,
  extended_warranty:Number,
  extend_warranty: {
    type: [
      {
        year: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    default: [],
  },
  overviewdescription: String,
  product_highlights: {type: [String],default: [],},
  meta_title: { type: String, default: "" }, // Add meta_title field
  meta_description: { type: String, default: "" }, 
  category_new: { type: String, default: "" },
  sub_category_new: { type: String, default: "" },
  search_keywords: { type: String, default: "" },
  sub_category_new_name: { type: String, default: "" },
  productMailsending: { type: Boolean, default: false },
  mailSendingStartedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
