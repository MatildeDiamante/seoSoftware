// Main server file for the SEO internal linker application, setting up Express, connecting to MongoDB, and defining API routes
// dotenv/config must load first: ESM imports below run before any other top-level code, including apiRoutes -> geminiService reading process.env
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import apiRoutes from "./routes/apiRoutes.js";

// Initialize Express application and configure middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 5050;

mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/seo-internal-linker",
  )
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((error) => console.error("DB connection error:", error));
