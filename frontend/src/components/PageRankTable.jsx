// PageRankTable component for displaying site topology and internal PageRank distribution
export default function PageRankTable({ pages, onSelectTarget }) {
  if (pages.length === 0) return null;

  return (
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
                <button onClick={() => onSelectTarget(page.url)}>
                  Set as Target
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
