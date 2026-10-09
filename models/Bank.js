import mongoose from "mongoose";

const BankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Bank code is required"],
      trim: true,
      uppercase: true,
      index: true,
    },
    shortCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    logo: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "Active", "Inactive"],
      default: "ACTIVE",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Synchronize backward-compatible aliases on save
BankSchema.pre("save", function (next) {
  if (!this.code && this.shortCode) this.code = this.shortCode.toUpperCase();
  if (!this.shortCode && this.code) this.shortCode = this.code.toUpperCase();
  if (
    (this.code === "HDFC" || this.shortCode === "HDFC") &&
    (!this.logoUrl || this.logoUrl.includes("uploads/banks/hdfc"))
  ) {
    this.logoUrl = "/images/banks/hdfc.svg";
  }
  if (!this.logoUrl && this.logo) this.logoUrl = this.logo;
  if (!this.logo && this.logoUrl) this.logo = this.logoUrl;
  if (this.isActive === undefined && this.status) {
    this.isActive = this.status.toUpperCase() === "ACTIVE";
  }
  next();
});

// Ensure getters handle aliases
BankSchema.virtual("effectiveCode").get(function () {
  return this.code || this.shortCode || "";
});

BankSchema.virtual("effectiveLogoUrl").get(function () {
  if (
    (this.code === "HDFC" || this.shortCode === "HDFC") &&
    (!this.logoUrl || this.logoUrl.includes("uploads/banks/hdfc"))
  ) {
    return "/images/banks/hdfc.svg";
  }
  return this.logoUrl || this.logo || "";
});

export default mongoose.models.Bank || mongoose.model("Bank", BankSchema);
