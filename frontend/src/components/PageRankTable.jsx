// PageRankTable component for displaying site topology and internal PageRank distribution
import { useState } from "react";

const ROWS_PER_PAGE = 10;

export default function PageRankTable({ pages, onSelectTarget }) {
  const [visibleCount, setVisibleCount] = useState(ROWS_PER_PAGE);

  if (pages.length === 0) return null;

  const visiblePages = pages.slice(0, visibleCount);
  const hasMore = visibleCount < pages.length;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-3">
        Site Topology & PageRank Distribution
      </h3>
      <div className="rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-yellow-100">
              <th className="border border-zinc-300 p-2 text-left">URL</th>
              <th className="border border-zinc-300 p-2 text-left">Title</th>
              <th className="border border-zinc-300 p-2 text-left">
                Outbound Links
              </th>
              <th className="border border-zinc-300 p-2 text-left">
                Internal PageRank
              </th>
              <th className="border border-zinc-300 p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {visiblePages.map((page) => (
              <tr key={page._id}>
                <td className="border border-zinc-300 p-2 text-sm font-mono">
                  {page.url}
                </td>
                <td className="border border-zinc-300 p-2">{page.title}</td>
                <td className="border border-zinc-300 p-2">
                  {page.outboundLinks?.length || 0}
                </td>
                <td className="border border-zinc-300 p-2">
                  <strong>
                    {((page.currentPagerank || 0) * 100).toFixed(4)}%
                  </strong>
                </td>
                <td className="border border-zinc-300 p-2">
                  <button
                    onClick={() => onSelectTarget(page.url)}
                    className="bg-secondary text-white px-3 py-1 rounded-md text-sm"
                  >
                    Set as Target
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setVisibleCount((count) => count + ROWS_PER_PAGE)}
            className="bg-secondary text-white px-6 py-2 rounded-md"
          >
            More
          </button>
        </div>
      )}
    </div>
  );
}
