// PageRankTable component for displaying site topology and internal PageRank distribution
import styles from "./PageRankTable.module.css";

// PageRankTable component for displaying site topology and internal PageRank distribution
export default function PageRankTable({ pages, onSelectTarget }) {
  if (pages.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <h3>Site Topology & PageRank Distribution</h3>
      <table border="1" cellPadding="8" className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
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
              <td className={styles.urlCell}>{page.url}</td>
              <td>{page.title}</td>
              <td>{page.outboundLinks?.length || 0}</td>
              <td>
                <strong className={styles.rankValue}>
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
