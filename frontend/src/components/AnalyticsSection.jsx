import ReactECharts from "echarts-for-react";

const DEPTH_THRESHOLD = 3; // pages beyond this level are considered "too-deep"

export default function AnalyticsSection({ pages }) {
  if (pages.length === 0) return null;

  // Orphan pages: no internal link reaches them (homepage is the only exception, because it doesn't have inbound)
  const orphanPages = pages.filter(
    (p) => (p.inboundLinks?.length || 0) === 0 && (p.depth || 0) > 0,
  );

  // Pages too deep: beyond the homepage's treshold click distance
  const deepPages = pages.filter((p) => (p.depth || 0) > DEPTH_THRESHOLD);

  // Graphic: distribution PageRank (top 15 pages)
  const topPages = [...pages]
    .sort((a, b) => (b.currentPagerank || 0) - (a.currentPagerank || 0))
    .slice(0, 15);

  const pageRankChartOption = {
    tooltip: {},
    xAxis: { type: "value" },
    yAxis: {
      type: "category",
      data: topPages.map((p) => p.title || p.url).reverse(),
    },
    series: [
      {
        type: "bar",
        data: topPages
          .map((p) => ((p.currentPagerank || 0) * 100).toFixed(4))
          .reverse(),
      },
    ],
  };

  // Graphic: pages distribution based on depth level
  const depthCounts = {};
  pages.forEach((p) => {
    const d = p.depth || 0;
    depthCounts[d] = (depthCounts[d] || 0) + 1;
  });
  const depthChartOption = {
    tooltip: {},
    xAxis: {
      type: "category",
      data: Object.keys(depthCounts).map((d) => `Depth ${d}`),
    },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: Object.values(depthCounts) }],
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-3">Internal Linking Analytics</h3>

      {/* Critical findings */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-100 p-4 rounded-lg">
          <p className="font-bold">{orphanPages.length} Orphan Pages</p>
          <ul className="text-sm font-mono text-left">
            {orphanPages.slice(0, 5).map((p) => (
              <li key={p._id}>{p.url}</li>
            ))}
          </ul>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="font-bold">
            {deepPages.length} Pages Too Deep (&gt; {DEPTH_THRESHOLD} clicks)
          </p>
          <ul className="text-sm font-mono text-left">
            {deepPages.slice(0, 5).map((p) => (
              <li key={p._id}>
                {p.url} (depth {p.depth})
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interactive graphics */}
      <ReactECharts option={pageRankChartOption} style={{ height: 400 }} />
      <ReactECharts option={depthChartOption} style={{ height: 300 }} />
    </div>
  );
}
