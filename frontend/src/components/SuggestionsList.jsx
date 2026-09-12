// SuggestionsList component for displaying predictive internal linking suggestions from Gemini AI
export default function SuggestionsList({ suggestions }) {
  if (suggestions.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">
        Predictive Internal Linking Suggestions (Gemini AI)
      </h3>
      {suggestions.map((s) => (
        <div
          key={s._id}
          className="bg-secondary/10 border border-secondary/40 rounded-lg p-4 mb-4"
        >
          <p>
            <strong>Source URL:</strong>{" "}
            <span className="font-mono">{s.sourceUrl}</span>
          </p>
          <p>
            <strong>Estimated PageRank Boost (ΔPR):</strong>{" "}
            <span className="text-green-600 font-bold">
              +{(s.predictedPageRankBoost * 100).toFixed(5)}%
            </span>
          </p>
          <p>
            <strong>Exact Position / Source Paragraph:</strong>
          </p>
          <blockquote className="bg-slate-50 p-3 border-l-4 border-sky-500 italic">
            "{s.exactParagraphContext}"
          </blockquote>
          <p>
            <strong>Anchor Text Suggested by Gemini:</strong>
          </p>
          <ul className="list-disc list-inside">
            {s.suggestedAnchorText.map((anchor, idx) => (
              <li key={idx}>
                <code className="font-mono">{anchor}</code>
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-600">
            <strong>SEO Reasoning:</strong> {s.reasoning}
          </p>
        </div>
      ))}
    </div>
  );
}
