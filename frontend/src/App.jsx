// Main App component for the AI Predictive Internal Linking Software
import { useState } from "react";
import { API_BASE_URL } from "./config";
import CrawlForm from "./components/CrawlForm";
import PageRankTable from "./components/PageRankTable";
import SuggestionsList from "./components/SuggestionsList";

export default function App() {
  const [projectId, setProjectId] = useState(null);
  const [pages, setPages] = useState([]);
  const [targetUrl, setTargetUrl] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
  // Generate predictive suggestions
  const handleGeneratePredictive = async () => {
    if (!targetUrl || !projectId) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/predictive-suggestions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, targetUrl, minDeltaBoost: 0 }),
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

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1>AI Predictive Internal Linking Software</h1>

      {errorMessage && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          {errorMessage}
        </div>
      )}

      <CrawlForm onCrawl={handleCrawl} loading={loading} />

      <PageRankTable pages={pages} onSelectTarget={setTargetUrl} />

      {/* Generate predictive suggestions */}
      {targetUrl && (
        <div
          style={{
            background: "#e0f2fe",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <h3>Generate Suggestions for Target Page</h3>
          <p>
            Selected Target Page: <strong>{targetUrl}</strong>
          </p>
          <button onClick={handleGeneratePredictive} disabled={loading}>
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
