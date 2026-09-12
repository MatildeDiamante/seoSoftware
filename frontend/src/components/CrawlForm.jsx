// CrawlForm component for initiating a new site crawl
import { useState } from "react";

export default function CrawlForm({ onCrawl, loading }) {
  const [startUrl, setStartUrl] = useState("");

  const handleSubmit = () => {
    if (!startUrl) return;
    onCrawl(startUrl);
  };

  return (
    <div className="bg-secondary/20 pt-8 pb-8 pl-15 pr-15 rounded-lg mb-20 max-w-xl mx-auto shadow-lg">
      <h3 className="text-lg font-semibold mb-3">Crawl New Site</h3>
      <input
        type="url"
        placeholder="https://example.com"
        value={startUrl}
        onChange={(e) => setStartUrl(e.target.value)}
        className="w-full p-2 mb-3 border font-mono border-zinc-300 rounded-md"
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !startUrl}
        className="bg-secondary text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? "Scanning in progress..." : "Start Crawl"}
      </button>
    </div>
  );
}
