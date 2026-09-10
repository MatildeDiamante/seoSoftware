// Controller for SEO-related operations, including site crawling and PageRank calculation
import Project from "../models/Project.js";
import Page from "../models/Page.js";
import LinkSuggestion from "../models/LinkSuggestion.js";
import { runSiteCrawl } from "../services/crawlerService.js";
import {
  recalculateAndSavePageRank,
  simulateMultipleCandidates,
} from "../services/pageRankService.js";
import { generateLinkRecommendation } from "../services/geminiService.js";

// Starts the crawling process for a given project and calculates the initial PageRank
export async function startCrawling(req, res) {
  try {
    const { startUrl, maxPages } = req.body;
    if (!startUrl) {
      return res.status(400).json({ error: "startUrl is required" });
    }

    const domain = new URL(startUrl).hostname;
    const project = await Project.create({ domain, startUrl });

    // runSiteCrawl saves the pages and reconstructs the inboundLinks internally
    await runSiteCrawl(startUrl, project._id, maxPages || 100);

    const totalPages = await Page.countDocuments({ projectId: project._id });
    project.totalPages = totalPages;
    await project.save();

    // Calculates and persists the initial PageRank (graphology)
    await recalculateAndSavePageRank(project._id);

    res.status(200).json({
      message: "Crawling and PageRank calculation completed successfully",
      projectId: project._id,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Retrieves the topology of a project, sorted by current PageRank
export async function getProjectTopology(req, res) {
  try {
    const { projectId } = req.params;
    const pages = await Page.find({ projectId }).sort({ currentPagerank: -1 });
    res.status(200).json(pages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Generates predictive link suggestions for a target page within a project, using AI recommendations and simulated PageRank boosts
export async function generatePredictiveLink(req, res) {
  try {
    const { projectId, targetUrl, minDeltaBoost = 0 } = req.body;
    if (!projectId || !targetUrl) {
      return res
        .status(400)
        .json({ error: "projectId and targetUrl are required" });
    }

    const allPages = await Page.find({ projectId });
    const targetPage = allPages.find((p) => p.url === targetUrl);
    if (!targetPage) {
      return res.status(404).json({ message: "Target page not found" });
    }

    // Candidate source pages: pages that do not already link to the target page
    const candidateSourceUrls = allPages
      .filter(
        (page) => page.url !== targetUrl && !page.outboundLinks?.includes(targetUrl),
      )
      .map((page) => page.url);

    const simulations = simulateMultipleCandidates(
      allPages,
      targetUrl,
      candidateSourceUrls,
      minDeltaBoost,
    );

    const suggestions = [];

    // Sequentially process each simulation to respect the rate limits of the Gemini API
    for (const sim of simulations) {
      const sourcePage = allPages.find((page) => page.url === sim.sourceUrl);

      const aiResponse = await generateLinkRecommendation(
        sourcePage,
        targetPage,
      );

      const newSuggestion = await LinkSuggestion.create({
        projectId,
        sourceUrl: sim.sourceUrl,
        targetUrl: sim.targetUrl,
        suggestedAnchorText: aiResponse.suggestedAnchorText,
        exactParagraphContext: aiResponse.exactParagraphContext,
        predictedPageRankBoost: sim.deltaPR,
        reasoning: aiResponse.reasoning,
      });

      suggestions.push(newSuggestion);
    }

    res.status(200).json({
      message: `Generated ${suggestions.length} predictive link suggestions`,
      suggestions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
