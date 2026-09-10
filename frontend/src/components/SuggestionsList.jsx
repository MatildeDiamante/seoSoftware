// SuggestionsList component for displaying predictive internal linking suggestions from Gemini AI
export default function SuggestionsList({ suggestions }) {
  if (suggestions.length === 0) return null;

  return (
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
  );
}
