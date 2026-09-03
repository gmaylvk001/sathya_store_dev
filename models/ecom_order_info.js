<<<<<<< Updated upstream
import mongoose from "mongoose";


const OrderHistorySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },   // When the status was updated
    status: { 
      type: String, 
      enum: ["Pending", "Accepted", "Cancelled", "Shipped"], 
      required: true 
    },
    comment: { type: String, maxlength: 150 }, // Optional comment
    customer_notified: { type: Boolean, default: false } // whether customer got notified
  },
  { _id: false } // prevent automatic _id for subdocs
);

const OrderSchema = new mongoose.Schema(
  {
  user_id:{ type: String, required: true},
  order_username : { type: String, required: true },
  order_phonenumber: { type: String, required: true },
  email_address: { type: String, required: true },
   order_item: [{
      id: { type: Number },
      name: { type: String },
      price: { type: Number },
      item_code: { type: String },
      model:{ type: String },
      coupondiscount:{ type: Number},
      coupondetails : { type: [String], default: [] },
      quantity: { type: Number },
      store_id: { type:String },
      warranty: { type:Number },
      extendedWarranty:{ type: Number },
        warrantyData: {
        item_no: { type: String, default: null },
        name: { type: String, default: null },
        year: { type: Number, default: null },
        price: { type: Number, default: null },
       
      },
      image: { type:String },
      original_quantity:{ type: Number },
      discount: { type:Number },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now }
    }],
  order_details: [{
    item_code: String,
    product_id: Number,
    product_name: String,
    product_price: Number,
    model: String,
    user_id: String,
    coupondiscount: Number,
    created_at: Date,
    updated_at: Date,
    quantity: Number,
    store_id: String,
    orderNumber: String
  }],
   order_amount:{ type: String, required: true},
  order_deliveryaddress:{ type: String},
  customer_comments: {
  type: String,
  default: "",
},

  payment_method:{ type: String},
  payment_type:{ type: String},
  delivery_type: { 
      type: String,
      enum: ["home", "store_pickup"],
      default: "standard"
    },
    pickup_store: { type: String },  // Store name for pickup
    store_id: { type: String },   
  //delivery_type:{ type: String},
  payment_id:{ type: String},
  order_number:{ type: String, required: true},
  user_adddeliveryid:{ type: String},
   delivery_date: { type: Date },
  order_status: {
    type: String,
    enum: ["pending", "cancelled", "shipped","Order Placed","Failure","payment_initialized"],
    default: "pending",
  },
  payment_status: {
    type: String,
    enum: ["paid", "pending","payment_initialized"],
    default: "unpaid",
  },
  api_status: {
    type: String,
  },
  api_reason: {
    type: String,
  },

  loyalty_points_awarded: { type: Number, default: 0 },
  truco_transaction_id: { type: String, default: null },
  loyalty_points_redeemed: { type: Number, default: 0 },
loyalty_discount: { type: Number, default: 0 },
loyalty_redemption_token: { type: String, default: null },
points_per_currency_unit: { type: Number, default: null },
promotion_code_applied: { type: String, default: null },
promotion_discount_applied: { type: Number, default: 0 },
gst_number: { type: String, default: null },


    order_history: [OrderHistorySchema]
},

  { timestamps: true }
);

export default mongoose.models.ecom_order_info || mongoose.model("ecom_order_info", OrderSchema);


=======
import mongoose from "mongoose";


const OrderHistorySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },   // When the status was updated
    status: { 
      type: String, 
      enum: ["Pending", "Accepted", "Cancelled", "Shipped"], 
      required: true 
    },
    comment: { type: String, maxlength: 150 }, // Optional comment
    customer_notified: { type: Boolean, default: false } // whether customer got notified
  },
  { _id: false } // prevent automatic _id for subdocs
);

const OrderSchema = new mongoose.Schema(
  {
  user_id:{ type: String, required: true},
  order_username : { type: String, required: true },
  order_phonenumber: { type: String, required: true },
  email_address: { type: String, required: true },
   order_item: [{
      id: { type: Number },
      name: { type: String },
      price: { type: Number },
      item_code: { type: String },
      model:{ type: String },
      coupondiscount:{ type: Number},
      coupondetails : { type: [String], default: [] },
      quantity: { type: Number },
      store_id: { type:String },
      warranty: { type:Number },
      extendedWarranty:{ type: Number },
        warrantyData: {
        item_no: { type: String, default: null },
        name: { type: String, default: null },
        year: { type: Number, default: null },
        price: { type: Number, default: null },
       
      },
      image: { type:String },
      original_quantity:{ type: Number },
      discount: { type:Number },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now }
    }],
  order_details: [{
    item_code: String,
    product_id: Number,
    product_name: String,
    product_price: Number,
    model: String,
    user_id: String,
    coupondiscount: Number,
    created_at: Date,
    updated_at: Date,
    quantity: Number,
    store_id: String,
    orderNumber: String
  }],
   order_amount:{ type: String, required: true},
  order_deliveryaddress:{ type: String},
  customer_comments: {
  type: String,
  default: "",
},

  payment_method:{ type: String},
  payment_type:{ type: String},
  delivery_type: { 
      type: String,
      enum: ["home", "store_pickup"],
      default: "standard"
    },
    pickup_store: { type: String },  // Store name for pickup
    store_id: { type: String },   
    region: { type: String, default: "tamilnadu" },
  //delivery_type:{ type: String},
  payment_id:{ type: String},
  order_number:{ type: String, required: true},
  user_adddeliveryid:{ type: String},
   delivery_date: { type: Date },
  order_status: {
    type: String,
    enum: ["pending", "cancelled", "shipped","Order Placed","Failure","payment_initialized"],
    default: "pending",
  },
  payment_status: {
    type: String,
    enum: ["paid", "pending","payment_initialized"],
    default: "unpaid",
  },
  api_status: {
    type: String,
  },
  api_reason: {
    type: String,
  },

  promotion_code_applied: { type: String, default: null },
  promotion_discount_applied: { type: Number, default: 0 },
  gst_number: { type: String, default: null },


    order_history: [OrderHistorySchema]
},

  { timestamps: true }
);

export default mongoose.models.ecom_order_info || mongoose.model("ecom_order_info", OrderSchema);


>>>>>>> Stashed changes
