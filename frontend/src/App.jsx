// Main App component for the AI Predictive Internal Linking Software
import { useState, useRef } from "react";
import { API_BASE_URL } from "./config";
import viteLogo from "./assets/vite.svg";
import CrawlForm from "./components/CrawlForm";
import PageRankTable from "./components/PageRankTable";
import AnalyticsSection from "./components/AnalyticsSection";
import SuggestionsList from "./components/SuggestionsList";

export default function App() {
  const [projectId, setProjectId] = useState(null);
  const [pages, setPages] = useState([]);
  const [targetUrl, setTargetUrl] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const suggestionsSectionRef = useRef(null);

  // Selects the target page, scrolls the suggestions section into view, and immediately generates suggestions for it
  const handleSelectTarget = (url) => {
    setTargetUrl(url);
    setTimeout(() => {
      suggestionsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
    generateSuggestionsFor(url);
  };

  // POST /api/projects/crawl
  // Starts the crawling process for a new site
  const handleCrawl = async (startUrl) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/projects/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startUrl, maxPages: 100 }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Error occurred during crawling");

      setProjectId(data.projectId);
      await fetchTopology(data.projectId);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // GET /api/projects/:projectId/topology
  // Fetch project topology
  const fetchTopology = async (id) => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}/topology`);
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || "Error occurred while fetching topology");
    setPages(data);
  };

  // POST /api/projects/predictive-suggestions
  // Generate predictive suggestions for the given target URL (accepted as a param to avoid stale-state issues)
  const generateSuggestionsFor = async (url) => {
    if (!url || !projectId) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/predictive-suggestions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, targetUrl: url, minDeltaBoost: 0 }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "Error occurred while generating suggestions",
        );

      setSuggestions(data.suggestions);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePredictive = () => generateSuggestionsFor(targetUrl);

  return (
    <div className="max-w-300 mx-auto pt-20 font-sans text-center bg-primary relative">
      <img
        src={viteLogo}
        alt="Vite logo"
        className="absolute top-6 left-0.5 h-10 w-10"
      />
      <h1 className="text-6xl font-bold text-[#5d2cd5] mb-3">Firelink</h1>
      <h2 className="text-6xl font-bold mb-8">
        Predict your online visibility with AI
      </h2>
      <p className="text-lg mb-25">
        Leverage AI to optimize your internal linking strategy and boost your
        website's visibility.
      </p>

      {errorMessage && (
        <div className="bg-red-100 text-red-800 px-4 py-3 rounded-md mb-4">
          {errorMessage}
        </div>
      )}

      <CrawlForm onCrawl={handleCrawl} loading={loading} />

      <PageRankTable pages={pages} onSelectTarget={handleSelectTarget} />

      <AnalyticsSection pages={pages} />

      {/* Generate predictive suggestions */}
      {targetUrl && (
        <div
          ref={suggestionsSectionRef}
          className="bg-secondary/20 p-6 rounded-lg mb-8"
        >
          <h3 className="text-lg font-semibold mb-2">
            Generate Suggestions for Target Page
          </h3>
          <p className="mb-3">
            Selected Target Page: <strong>{targetUrl}</strong>
          </p>
          <button
            onClick={handleGeneratePredictive}
            disabled={loading}
            className="bg-secondary text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {loading
              ? "Processing Gemini AI..."
              : "Calculate Impact & Suggest Links"}
          </button>
        </div>
      )}

      <SuggestionsList suggestions={suggestions} />
    </div>
  );
}
