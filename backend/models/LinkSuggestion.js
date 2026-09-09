// Mongoose model for link suggestions within an SEO project, storing source and target URLs, suggested anchor text, context, predicted PageRank boost, reasoning, status, and creation date
import mongoose from "mongoose";

const linkSuggestionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  sourceUrl: { type: String, required: true },
  targetUrl: { type: String, required: true },
  suggestedAnchorText: [{ type: String }],
  exactParagraphContext: { type: String },
  predictedPageRankBoost: { type: Number, default: 0 },
  reasoning: { type: String },
  status: {
    type: String,
    enum: ["pending", "applied", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("LinkSuggestion", linkSuggestionSchema);