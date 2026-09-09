// Mongoose model for SEO projects, storing domain, start URL, creation date, and total pages crawled
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  startUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  totalPages: { type: Number, default: 0 },
});

export default mongoose.model("Project", projectSchema);
