// Main App component for the AI Predictive Internal Linking Software
import { useState } from "react";
import { API_BASE_URL } from "./config";

export default function App() {
  const [startUrl, setStartUrl] = useState("");
  const [projectId, setProjectId] = useState(null);
  const [pages, setPages] = useState([]);
  const [targetUrl, setTargetUrl] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // POST /api/projects/crawl
  // Starts the crawling process for a new site
  const handleCrawl = async () => {
    if (!startUrl) return;
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

      {/*Start crawling */}
      <div
        style={{
          background: "#f4f4f5",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h3>Crawl New Site</h3>
        <input
          type="url"
          placeholder="https://example.com"
          value={startUrl}
          onChange={(e) => setStartUrl(e.target.value)}
          style={{ width: "70%", padding: "0.5rem", marginRight: "1rem" }}
        />
        <button onClick={handleCrawl} disabled={loading || !startUrl}>
          {loading ? "Scanning in progress..." : "Start Crawl"}
        </button>
      </div>

      {/* Topology Table + PageRank */}
      {pages.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>Site Topology & PageRank Distribution</h3>
          <table
            border="1"
            cellPadding="8"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ background: "#e4e4e7" }}>
                <th>URL</th>
                <th>Title</th>
                <th>Outbound Links</th>
                <th>Internal PageRank</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page._id}>
                  <td style={{ fontSize: "0.85rem" }}>{page.url}</td>
                  <td>{page.title}</td>
                  <td>{page.outboundLinks?.length || 0}</td>
                  <td>
                    <strong>
                      {((page.currentPagerank || 0) * 100).toFixed(4)}%
                    </strong>
                  </td>
                  <td>
                    <button onClick={() => setTargetUrl(page.url)}>
                      Set as Target
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      {/* Suggestions Results */}
      {suggestions.length > 0 && (
        <div>
          <h3>Predictive Internal Linking Suggestions (Gemini AI)</h3>
          {suggestions.map((s) => (
            <div
              key={s._id}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <p>
                <strong>Source URL:</strong> {s.sourceUrl}
              </p>
              <p>
                <strong>Estimated PageRank Boost (ΔPR):</strong>{" "}
                <span style={{ color: "green", fontWeight: "bold" }}>
                  +{(s.predictedPageRankBoost * 100).toFixed(5)}%
                </span>
              </p>
              <p>
                <strong>Exact Position / Source Paragraph:</strong>
              </p>
              <blockquote
                style={{
                  background: "#f8fafc",
                  padding: "0.75rem",
                  borderLeft: "4px solid #3b82f6",
                  fontStyle: "italic",
                }}
              >
                "{s.exactParagraphContext}"
              </blockquote>
              <p>
                <strong>Anchor Text Suggested by Gemini:</strong>
              </p>
              <ul>
                {s.suggestedAnchorText.map((anchor, idx) => (
                  <li key={idx}>
                    <code>{anchor}</code>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: "0.9rem", color: "#475569" }}>
                <strong>SEO Reasoning:</strong> {s.reasoning}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
