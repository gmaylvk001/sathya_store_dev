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
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"], // ✅ Regex validation
    },
  password: { type: String, required: true },
  user_type: { 
    type: String, 
    enum: ["admin", "user", "karnataka_unilet_admin"], // ✅ Define allowed values
    default: "user" // ✅ Set default value
  },
  region: { type: String, default: null },
  store: { type: String, default: null },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ecom_roles_info",
    required: false,
    default: null,
  },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

export default mongoose.models.ecom_users_info || mongoose.model("ecom_users_info", UserSchema);