// Service for crawling websites and extracting structured content and internal links
import { CheerioCrawler, RequestQueue } from "crawlee";
import Page from "../models/Page.js";

// Extensions to ignore during crawling
const IGNORED_EXTENSIONS =
  /\.(pdf|zip|rar|jpg|jpeg|png|gif|svg|webp|mp4|mp3|css|js|xml|json)$/i;

// Normalize URLs to remove fragments (#) and trailing slashes, keeping only same-domain links
function normalizeUrl(rawUrl, baseUrl) {
  try {
    const parsed = new URL(rawUrl, baseUrl);

    // Ignores non-HTTP/HTTPS protocols (mailto, tel, javascript ...)
    if (!["http:", "https:"].includes(parsed.protocol)) return null;

    // Ignores static file extensions
    if (IGNORED_EXTENSIONS.test(parsed.pathname)) return null;

    // Remove # anchors
    parsed.hash = "";

    // Remove tracking parameters SEO/Analytics
    const paramsToDelete = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
    ];
    paramsToDelete.forEach((param) => parsed.searchParams.delete(param));

    let cleanUrl = parsed.toString();

    // Normalize URLs by removing trailing slashes (except for the root path)
    if (parsed.pathname !== "/" && cleanUrl.endsWith("/")) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    return cleanUrl;
  } catch (e) {
    return null;
  }
}

// Run a site crawl starting from the given URL
export async function runSiteCrawl(startUrl, projectId, maxPages = 500) {
  const targetDomain = new URL(startUrl).hostname;
  const scrapedPagesMap = new Map();

  // Dedicated queue for crawl:
  // reusing the default queue would rouse stale "already handled" state for previously crawls
  const requestQueue = await RequestQueue.open(`crawl-${projectId}`);

  const crawler = new CheerioCrawler({
    requestQueue,
    maxRequestsPerCrawl: maxPages,
    maxConcurrency: 5,
    maxRequestsPerMinute: 120, // Limit the number of requests per minute to avoid overloading the server

    // Set a custom User-Agent header before each request (extraHttpHeaders is not a valid HttpCrawlerOptions field)
    preNavigationHooks: [
      async ({ request }) => {
        request.headers = {
          ...request.headers,
          "User-Agent": "SEOInternalLinkerBot/1.0 (+https://tuosito.com/bot)",
        };
      },
    ],

    // Handle each crawled page
    async requestHandler({ $, request, enqueueLinks, response }) {
      // Verifies that the response is an HTML page
      const contentType = response.headers["content-type"] || "";
      if (!contentType.includes("text/html")) return;

      const currentUrl = normalizeUrl(request.url, startUrl);
      if (!currentUrl) return;

      // Captures the page depth during crawl
      const depth = request.userData?.__crawlee?.crawlDepth ?? 0;

      console.log(`[CRAWL] Scanning: ${currentUrl}`);

      // Canonical URL management
      const canonicalHref = $('link[rel="canonical"]').attr("href");
      const canonicalUrl = canonicalHref
        ? normalizeUrl(canonicalHref, currentUrl)
        : currentUrl;

      // Clean the DOM
      // Remove elements not relevant for contextual link analysis
      $(
        "header, footer, nav, aside, script, style, noscript, iframe, noscript, .sidebar, .comments, #comments, .footer, .header, .nav",
      ).remove();

      // Extract the title and main text for paragraphs
      const title = $("title").text().trim() || $("h1").first().text().trim();
      const metaDescription =
        $('meta[name="description"]').attr("content") || "";
      const h1 = $("h1").first().text().trim();

      // Extract paragraphs from the main content
      const paragraphs = [];
      $("p, article, section, h2, h3, h4").each((_, el) => {
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (text.length > 25) {
          // Discard too short sentences
          paragraphs.push(text);
        }
      });

      // Extract internal links present in the main content
      const outboundLinksMap = new Map(); // targetUrl -> {targerUrl, anchorText}

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        const anchorText = $(el).text().replace(/\s+/g, " ").trim();
        const targetClean = normalizeUrl(href, currentUrl);

        if (!targetClean) return;

        try {
          const targetObj = new URL(targetClean);

          // Check if the link is internal and not the current page
          if (
            targetObj.hostname === targetDomain &&
            targetClean !== currentUrl
          ) {
            if (!outboundLinksMap.has(targetClean)) {
              outboundLinksMap.set(targetClean, {
                targetUrl: targetClean,
                anchorText: anchorText || "[Nessun testo / Immagine]",
              });
            }
          }
        } catch (error) {
          // Url not valid
        }
      });

      const outboundLinksDetails = Array.from(outboundLinksMap.values());
      const outboundUrls = outboundLinksDetails.map((l) => l.targetUrl);

      // Stores data in a temporary memory
      scrapedPagesMap.set(canonicalUrl || currentUrl, {
        projectId,
        url: canonicalUrl || currentUrl,
        title,
        h1,
        metaDescription,
        cleanContent: paragraphs.join("\n\n"),
        paragraphs,
        outboundLinks: outboundUrls,
        outboundDetails: outboundLinksDetails,
        depth,
        crawledAt: new Date(),
      });

      // Add discovered links to the Crawlee queue
      await enqueueLinks({
        strategy: "same-domain",
        transformRequestFunction(req) {
          const norm = normalizeUrl(req.url, startUrl);
          if (!norm) return false;
          req.url = norm;
          return req;
        },
      });
    },

    failedRequestHandler({ request, error }) {
      console.error(
        `[CRAWL ERROR] Impossible scanning ${request.url}:`,
        error.message,
      );
    },
  });

  // Star scanning
  await crawler.run([startUrl]);
  console.log(
    `[CRAWL COMPLETE] Scanned ${scrapedPagesMap.size} pages for the project ${projectId}`,
  );

  // Drop the request queue to clean up any remaining state
  await requestQueue.drop();

  // Save the scraped pages to the database
  await savePagesToDatabase(projectId, Array.from(scrapedPagesMap.values()));

  // Rebuild inbound links for the project
  await rebuildInboundLinks(projectId);
}

// Persists the scraped pages via bulk upsert, keyed by projectId + url
async function savePagesToDatabase(projectId, pagesData) {
  if (pagesData.length === 0) return;

  const bulkOps = pagesData.map((page) => ({
    updateOne: {
      filter: { projectId, url: page.url },
      update: { $set: page },
      upsert: true,
    },
  }));

  await Page.bulkWrite(bulkOps);
  console.log(`[DB] Saved/updated ${pagesData.length} pages.`);
}

// Rebuilds the inbound links for a given projectId
export async function rebuildInboundLinks(projectId) {
  console.log(`[DB] Rebuilding inbound links for project ${projectId}...`);

  // MongoDB aggregated pipeline to get inbound links for each outbound link
  const aggregateInbound = await Page.aggregate([
    { $match: { projectId } },
    { $unwind: "$outboundLinks" },
    {
      $group: {
        _id: "$outboundLinks",
        inboundUrls: { $addToSet: "$url" },
      },
    },
  ]);

  // Update bulk
  const bulkOps = aggregateInbound.map((item) => ({
    updateOne: {
      filter: { projectId, url: item._id },
      update: { $set: { inboundLinks: item.inboundUrls } },
    },
  }));

  if (bulkOps.length > 0) {
    await Page.bulkWrite(bulkOps);
  }

  console.log(
    `[DB] Inbound links updated successfully for ${bulkOps.length} pages.`,
  );
}
