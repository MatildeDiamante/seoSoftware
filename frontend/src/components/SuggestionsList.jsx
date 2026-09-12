// SuggestionsList component for displaying predictive internal linking suggestions from Gemini AI
import styles from "./SuggestionsList.module.css";

// SuggestionsList component for displaying predictive internal linking suggestions from Gemini AI
export default function SuggestionsList({ suggestions }) {
  if (suggestions.length === 0) return null;

  return (
    <div>
      <h3>Predictive Internal Linking Suggestions (Gemini AI)</h3>
      {suggestions.map((s) => (
        <div
          key={s._id}
          className={styles.card}
        >
          <p>
            <strong>Source URL:</strong> {s.sourceUrl}
          </p>
          <p>
            <strong>Estimated PageRank Boost (ΔPR):</strong>{" "}
            <span className={styles.boost}>
              +{(s.predictedPageRankBoost * 100).toFixed(5)}%
            </span>
          </p>
          <p>
            <strong>Exact Position / Source Paragraph:</strong>
          </p>
          <blockquote
            className={styles.contextQuote}
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
          <p className={styles.reasoning}>
            <strong>SEO Reasoning:</strong> {s.reasoning}
          </p>
        </div>
      ))}
    </div>
  );
}
