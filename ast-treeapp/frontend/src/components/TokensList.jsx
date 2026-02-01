import { styles } from "../styles/astExplorerStyles.js";

export default function TokensList({ tokens }) {
  return (
    <div>
      {/* <h3 style={{ ...styles.h3, marginTop: 18 }}>Tokens (optional)</h3>
      {!tokens?.length ? (
        <div style={styles.placeholderSmall}>No tokens returned.</div>
      ) : (
        <div style={styles.tokenList}>
          {tokens.map((t, i) => (
            <div key={i} style={styles.tokenChip}>
              <span style={{ fontWeight: 700 }}>{t.type}</span>
              <span style={styles.mono}>“{t.value}”</span>
              {t.start != null && t.end != null && (
                <span style={styles.miniMuted}>
                  [{t.start}..{t.end}]
                </span>
              )}
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
}
