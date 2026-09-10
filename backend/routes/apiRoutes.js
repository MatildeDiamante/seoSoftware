// API routes for SEO-related operations, including site crawling, project topology retrieval, and predictive link suggestions
import express from "express";
import {
  startCrawling,
  getProjectTopology,
  generatePredictiveLink,
} from "../controllers/seoController.js";

const router = express.Router();

router.post("/projects/crawl", startCrawling);
router.get("/projects/:projectId/topology", getProjectTopology);
router.post("/projects/predictive-suggestions", generatePredictiveLink);

export default router;
