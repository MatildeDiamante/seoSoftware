// CrawlForm component for initiating a new site crawl
import { useState } from "react";

export default function CrawlForm({ onCrawl, loading }) {
  const [startUrl, setStartUrl] = useState("");

  const handleSubmit = () => {
    if (!startUrl) return;
    onCrawl(startUrl);
  };

  return (
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
      <button onClick={handleSubmit} disabled={loading || !startUrl}>
        {loading ? "Scanning in progress..." : "Start Crawl"}
      </button>
    </div>
  );
}
