// Service to build a directed graph from project pages for PageRank calculations
import Graph from "graphology";
import pagerank from "graphology-metrics/centrality/pagerank.js";
import Page from "../models/Page.js";

// Builds a directed graph from the given pages, suitable for PageRank calculations
// Every node represents a page URL, and every edge represents an internal link from the source to the target.
function buildGraphFromPages(pages) {
  const graph = new Graph({
    type: "directed",
    multi: false,
    allowSelfLoops: false, // if a page links to itself, do not create a self-loop
  });

  // Add all nodes BEFORE adding edges (necessary for pages with 0 outbound/inbound)
  pages.forEach((page) => {
    if (!graph.hasNode(page.url)) {
      graph.addNode(page.url);
    }
  });

  // Add edges only if the target actually exists among the scanned pages
  //    (avoids pointing to URLs not present in the DB, e.g., pages excluded from the crawl)
  const knownUrls = new Set(pages.map((page) => page.url));

  pages.forEach((page) => {
    (page.outboundLinks || []).forEach((targetUrl) => {
      if (
        knownUrls.has(targetUrl) &&
        targetUrl !== page.url &&
        !graph.hasEdge(page.url, targetUrl)
      ) {
        graph.addEdge(page.url, targetUrl);
      }
    });
  });

  return graph;
}

// Calculates the PageRank for the entire project topology based on the given pages
// Returns a map { url: score }
export function calculatePageRank(pages, options = {}) {
  const graph = buildGraphFromPages(pages);

  if (graph.order === 0) return {};

  // graphology-metrics automatically handles dangling nodes (nodes without outgoing edges)
  const scores = pagerank(graph, {
    alpha: options.dampingFactor ?? 0.85, // Damping factor standard
    maxIterations: options.iterations ?? 100,
    tolerance: options.tolerance ?? 1e-6, // Criteria for convergence instead of fixed iterations
  });

  return scores; // { "https://example.com/page-a": 0.023, ... }
}

// Recalculates and saves the current PageRank for all pages of a project
export async function recalculateAndSavePageRank(projectId) {
  const pages = await Page.find({ projectId }, "url outboundLinks");
  const scores = calculatePageRank(pages);

  const bulkOps = pages.map((page) => ({
    updateOne: {
      filter: { projectId, url: page.url },
      update: { $set: { currentPagerank: scores[page.url] || 0 } },
    },
  }));

  if (bulkOps.length > 0) {
    await Page.bulkWrite(bulkOps);
  }

  console.log(
    `[PAGERANK] Updated ${bulkOps.length} scores for project ${projectId}`,
  );
  return scores;
}

// Simulates the impact on the PageRank of the target page if a new link from sourceUrl to targetUrl were added
// and returns the predicted change in PageRank for the target page
export function simulateLinkImpact(pages, sourceUrl, targetUrl) {
  const baseGraph = buildGraphFromPages(pages);

  if (!baseGraph.hasNode(sourceUrl) || !baseGraph.hasNode(targetUrl)) {
    throw new Error(
      "sourceUrl or targetUrl not present in the project topology",
    );
  }

  // Actual PageRank (baseline)
  const currentScores = pagerank(baseGraph, { alpha: 0.85 });

  // Clone the graph and add the hypothetical link
  const simulatedGraph = baseGraph.copy();
  if (!simulatedGraph.hasEdge(sourceUrl, targetUrl)) {
    simulatedGraph.addEdge(sourceUrl, targetUrl);
  }

  // Simulated PageRank
  const simulatedScores = pagerank(simulatedGraph, { alpha: 0.85 });

  const oldPR = currentScores[targetUrl] || 0;
  const newPR = simulatedScores[targetUrl] || 0;
  const deltaPR = newPR - oldPR;
  const percentageIncrease =
    oldPR > 0 ? Number(((deltaPR / oldPR) * 100).toFixed(2)) : 0;

  return {
    sourceUrl,
    targetUrl,
    currentPR: oldPR,
    simulatedPR: newPR,
    deltaPR,
    percentageIncrease,
  };
}

// Optimized version for generating multiple simulations on the same topology
export function simulateMultipleCandidates(
  pages,
  targetUrl,
  candidateSourceUrls,
  minDeltaBoost = 0,
) {
  const baseGraph = buildGraphFromPages(pages);
  const currentScores = pagerank(baseGraph, { alpha: 0.85 });
  const oldPR = currentScores[targetUrl] || 0;

  const results = [];

  for (const sourceUrl of candidateSourceUrls) {
    if (
      !baseGraph.hasNode(sourceUrl) ||
      baseGraph.hasEdge(sourceUrl, targetUrl)
    )
      continue;

    const simulatedGraph = baseGraph.copy();
    simulatedGraph.addEdge(sourceUrl, targetUrl);

    const simulatedScores = pagerank(simulatedGraph, { alpha: 0.85 });
    const newPR = simulatedScores[targetUrl] || 0;
    const deltaPR = newPR - oldPR;

    if (deltaPR >= minDeltaBoost) {
      results.push({
        sourceUrl,
        targetUrl,
        currentPR: oldPR,
        simulatedPR: newPR,
        deltaPR,
      });
    }
  }

  // Sort by descending impact: the most effective sources at the top
  return results.sort((a, b) => b.deltaPR - a.deltaPR);
}
