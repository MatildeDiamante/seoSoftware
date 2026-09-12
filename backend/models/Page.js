// Mongoose model for individual pages within an SEO project, storing URL, title, content, links, and PageRank values
import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  url: { type: String, required: true, index: true },
  title: { type: String },
  cleanContent: { type: String },
  paragraphs: [{ type: String }],
  outboundLinks: [{ type: String }], // List of URLs this page points to
  depth: { type: Number, default: 0 }, // Distance in clicks from the crawl start URL
  currentPagerank: { type: Number, default: 0 },
  inboundLinks: [{ type: String }], // List of URLs pointing to this page
  currentPagerank: { type: Number, default: 0 },
  simulatedPagerank: { type: Number, default: 0 },
});

export default mongoose.model("Page", pageSchema);
