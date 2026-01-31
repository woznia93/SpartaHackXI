import { styles } from "../styles/astExplorerStyles.js";

export default function RulesGridCard({
  title,
  rows,
  setRows,
  leftPlaceholder,
  rightPlaceholder,
  help,
  addLabel = "Add row",
}) {
  function updateRow(index, key, value) {
    const next = rows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
    setRows(next);
  }

  function addRow() {
    setRows([...rows, { left: "", right: "" }]);
  }

  function removeRow(index) {
    const next = rows.filter((_, i) => i !== index);
    setRows(next.length ? next : [{ left: "", right: "" }]);
  }

  return (
    <section style={styles.card}>
      <h2 style={styles.h2}>{title}</h2>

      <div style={styles.gridRows}>
        {rows.map((row, i) => (
          <div key={`row-${i}`} style={styles.gridRow}>
            <input
              value={row.left}
              onChange={(e) => updateRow(i, "left", e.target.value)}
              placeholder={leftPlaceholder}
              style={styles.gridInput}
              spellCheck={false}
            />
            <input
              value={row.right}
              onChange={(e) => updateRow(i, "right", e.target.value)}
              placeholder={rightPlaceholder}
              style={styles.gridInput}
              spellCheck={false}
            />
            <button type="button" onClick={() => removeRow(i)} style={styles.rowBtn}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div style={styles.rowActions}>
        <button type="button" onClick={addRow} style={styles.addBtn}>
          {addLabel}
        </button>
      </div>

      <p style={styles.help}>{help}</p>
    </section>
  );
}
