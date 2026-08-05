import mongoose from "mongoose";

const VideoCardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  thumbnail_image: { type: String, required: true }, // ex: 480x270
  video_url: { type: String, required: true },

  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// avoid model overwrite issue in Next.js
export default mongoose.models.VideoCard ||
  mongoose.model("VideoCard", VideoCardSchema);
