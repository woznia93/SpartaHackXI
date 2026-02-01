import { styles } from "../styles/astExplorerStyles.js";
import ErrorPanel from "./ErrorPanel.jsx";

export default function SourceEditorCard({ value, onChange, onUpload, errors }) {
  return (
    <section style={styles.card}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <h2 style={{ ...styles.h2, margin: 0 }}>Source</h2>
        <label style={styles.uploadBtn}>
          Upload file
          <input
            type="file"
            accept=".txt,.js,.ts,.py,.json,.c,.cpp,.java,.md"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
        </label>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.textarea}
        spellCheck={false}
      />

      <ErrorPanel errors={errors} />
    </section>
  );
}
