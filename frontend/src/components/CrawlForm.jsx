// CrawlForm component for initiating a new site crawl
import { useState } from "react";
import styles from "./CrawlForm.module.css";

// CrawlForm component for initiating a new site crawl
export default function CrawlForm({ onCrawl, loading }) {
  const [startUrl, setStartUrl] = useState("");

  const handleSubmit = () => {
    if (!startUrl) return;
    onCrawl(startUrl);
  };

  return (
    <div className={styles.container}>
      <h3>Crawl New Site</h3>
      <input
        type="url"
        placeholder="https://example.com"
        value={startUrl}
        onChange={(e) => setStartUrl(e.target.value)}
        className={styles.urlInput}
      />
      <button onClick={handleSubmit} disabled={loading || !startUrl}>
        {loading ? "Scanning in progress..." : "Start Crawl"}
      </button>
    </div>
  );
}
