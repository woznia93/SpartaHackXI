import { styles } from "../styles/astExplorerStyles.js";

export default function FooterNote() {
  return (
    <footer style={styles.footer}>
      <span style={styles.muted}>
        Backend contract suggestion: <code>POST /api/parse</code> with{" "}
        <code>{"{ tokenRules, grammarRules, source }"}</code>.
      </span>
    </footer>
  );
}
