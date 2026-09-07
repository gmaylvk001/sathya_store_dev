import mongoose from "mongoose";

const OfferTimerSchema = new mongoose.Schema(
  {
    timerId: { type: Number, unique: true },
    offerTitle: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    state: { type: String, default: "all", trim: true },
    offerViewStates: { type: [String], default: ["all"] },
    timerDisplayStatus: { type: String, enum: ["Yes", "No"], default: "Yes" },
    offerHeading: { type: String, default: "", trim: true },
    offerDescription: { type: String, default: "", trim: true },
    topBanner: { type: String, default: null },
    dealsPopupImage: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.OfferTimer || mongoose.model("OfferTimer", OfferTimerSchema);
