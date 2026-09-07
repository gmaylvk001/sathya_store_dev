import mongoose from "mongoose";

const OfferTimerSchema = new mongoose.Schema(
  {
    // Modern fields
    timerId: { type: Number },
    offerTitle: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    state: { type: String, default: "all", trim: true },
    offerViewStates: { type: [String], default: ["all"] },
    timerDisplayStatus: { type: String, enum: ["Yes", "No"], default: "Yes" },
    offerHeading: { type: String, default: "", trim: true },
    offerDescription: { type: String, default: "", trim: true },
    topBanner: { type: String, default: null },
    dealsPopupImage: { type: String, default: null },

    // Legacy fields
    custom_id: { type: Number },
    offer_title: { type: String, trim: true },
    offer_start: { type: Date },
    offer_end: { type: Date },
    top_banner_url: { type: String, default: null },
    popup_image_url: { type: String, default: null },
    popup_image_alt: { type: String, default: "" },
    status: { type: String, default: "active" },
    states: { type: [String], default: ["all"] },
    card_offers: { type: Array, default: [] },
    hasDeleteAction: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.OfferTimer || mongoose.model("OfferTimer", OfferTimerSchema);
