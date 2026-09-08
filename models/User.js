import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: false, default: null, trim: true },
  mobile: {
    type: String,
    required: false,
    default: null,
    trim: true,
  },
  email: {
    type: String,
    required: false,
    default: null,
    trim: true,
    lowercase: true,
    validate: {
      validator(value) {
        if (value === undefined || value === null || value === "") {
          return true;
        }
        return /^\S+@\S+\.\S+$/.test(value);
      },
      message: "Please enter a valid email address",
    },
  },
  password: { type: String, required: false, default: null },
  exist_id: { type: String, required: false, default: null, trim: true },
  user_type: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
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

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string", $gt: "" } },
    name: "email_unique_nonempty",
  }
);

UserSchema.index(
  { mobile: 1 },
  {
    unique: true,
    partialFilterExpression: { mobile: { $type: "string", $gt: "" } },
    name: "mobile_unique_nonempty",
  }
);

if (mongoose.models.ecom_users_info) {
  delete mongoose.models.ecom_users_info;
}

const User = mongoose.model("ecom_users_info", UserSchema);

export async function ensureUserIndexes() {
  for (const indexName of ["email_1", "mobile_1"]) {
    try {
      await User.collection.dropIndex(indexName);
    } catch {
      // Old unique index may already be gone.
    }
  }
  try {
    await User.syncIndexes();
  } catch (error) {
    console.error("User index sync:", error.message);
  }
}

export default User;
