import { styles } from "../styles/astExplorerStyles.js";

export default function TextEditorCard({ title, value, onChange, help }) {
  return (
    <section style={styles.card}>
      <h2 style={styles.h2}>{title}</h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.textarea}
        spellCheck={false}
      />
      <p style={styles.help}>{help}</p>
    </section>
  );
}
