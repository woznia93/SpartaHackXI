import { styles } from "../styles/astExplorerStyles.js";

export default function NodeInspector({ node }) {
  return (
    <div>
      <h3 style={styles.h3}>Node Inspector</h3>
      {!node ? (
        <div style={styles.placeholderSmall}>Select a node in the tree.</div>
      ) : (
        <div>
          <div style={styles.kvRow}>
            <div style={styles.kvKey}>type</div>
            <div style={styles.kvVal}>{node.type}</div>
          </div>
          {"value" in node && (
            <div style={styles.kvRow}>
              <div style={styles.kvKey}>value</div>
              <div style={styles.kvVal}>{String(node.value)}</div>
            </div>
          )}
          {node.range && (
            <div style={styles.kvRow}>
              <div style={styles.kvKey}>range</div>
              <div style={styles.kvVal}>
                {node.range.start}…{node.range.end}
              </div>
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <div style={styles.smallLabel}>raw</div>
            <pre style={styles.pre}>{JSON.stringify(node, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
