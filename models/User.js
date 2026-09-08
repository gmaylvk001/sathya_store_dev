import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // mobile: { type: String, required: true, unique: true },
  // email: { type: String, required: true, unique: true },
  mobile: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"], // ✅ Regex validation
  },

  email: {
    type: String,
    required: false,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"], // ✅ Regex validation
  },
  password: { type: String, required: true },
  exist_id: { type: String, required: false, default: null, trim: true },
  user_type: {
    type: String,
    enum: ["admin", "user"], // ✅ Define allowed values
    default: "user" // ✅ Set default value
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ecom_roles_info",
    required: false,
    default: null,
  },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  store_id: { type: String, required: false, default: null },
  last_name: { type: String, required: false, default: null, trim: true },
  confirmed: { type: Number, required: false, default: null },
  confirmation_code: { type: String, required: false, default: null },
  provider: { type: String, required: false, default: null },
  provider_id: { type: String, required: false, default: null },
  notify_pincode: { type: String, required: false, default: null },
  notify_status: { type: Number, required: false, default: null },
  logged_in: { type: Date, required: false, default: null },
  zone_id: { type: String, required: false, default: null },
  remember_token: { type: String, required: false, default: null },
  avatar: { type: String, required: false, default: null },
  avatar_original: { type: String, required: false, default: null },
}, { timestamps: true });

if (mongoose.models.ecom_users_info) {
  delete mongoose.models.ecom_users_info;
}

export default mongoose.model("ecom_users_info", UserSchema);