import mongoose from "mongoose";

const ExistSathyaUserSchema = new mongoose.Schema({
  exist_id: {
    type: String,
    required: false,
    default: null,
    trim: true,
  },
  first_name: {
    type: String,
    required: true,
    trim: true,
  },
  last_name: {
    type: String,
    required: false,
    default: null,
    trim: true,
  },
  store_id: {
    type: String,
    required: false,
    default: null,
  },
  role_id: {
    type: String,
    required: false,
    default: null,
  },
  zone_id: {
    type: String,
    required: false,
    default: null,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  remember_token: {
    type: String,
    required: false,
    default: null,
  },
  confirmed: {
    type: Number,
    required: false,
    default: null,
  },
  confirmation_code: {
    type: String,
    required: false,
    default: null,
  },
  provider: {
    type: String,
    required: false,
    default: null,
  },
  provider_id: {
    type: String,
    required: false,
    default: null,
  },
  avatar: {
    type: String,
    required: false,
    default: null,
  },
  avatar_original: {
    type: String,
    required: false,
    default: null,
  },
  notify_pincode: {
    type: String,
    required: false,
    default: null,
  },
  notify_status: {
    type: Number,
    required: false,
    default: 0,
  },
  logged_in: {
    type: Date,
    required: false,
    default: null,
  },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

if (mongoose.models.ecom_exist_sathya_users) {
  delete mongoose.models.ecom_exist_sathya_users;
}

export default mongoose.model("ecom_exist_sathya_users", ExistSathyaUserSchema);
