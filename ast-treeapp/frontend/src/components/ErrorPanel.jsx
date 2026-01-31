import { styles } from "../styles/astExplorerStyles.js";

export default function ErrorPanel({ errors }) {
  if (!errors?.length) return null;

  return (
    <div style={styles.errorBox}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Errors</div>
      {errors.map((err, idx) => (
        <div key={idx} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>{err.message ?? "Error"}</div>
          {err.at && (
            <div style={styles.mono}>
              at line {err.at.line}, col {err.at.col}
            </div>
          )}
          {err.details && (
            <pre style={styles.pre}>
              {typeof err.details === "string"
                ? err.details
                : JSON.stringify(err.details, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
