import { useState } from "react";
import { styles } from "../styles/astExplorerStyles.js";

export default function RulesGridCard({
  title,
  rows,
  setRows,
  leftPlaceholder,
  rightPlaceholder,
  help,
  helpLeft,
  helpRight,
  addLabel = "Add row",
  showIgnore = false,
}) {
  const [editing, setEditing] = useState(false);

  function updateRow(index, key, value) {
    const next = rows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
    setRows(next);
  }

  function setIgnore(index, checked) {
    const next = rows.map((row, i) => (i === index ? { ...row, ignore: checked } : row));
    setRows(next);
  }

  function addRow() {
    setRows([...rows, { left: "", right: "", ignore: false }]);
  }

  function removeRow(index) {
    const next = rows.filter((_, i) => i !== index);
    setRows(next.length ? next : [{ left: "", right: "" }]);
  }

  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={{ ...styles.h2, margin: 0 }}>{title}</h2>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          style={styles.editBtn}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      <div style={styles.gridRows}>
        {rows.map((row, i) => (
          <div
            key={`row-${i}`}
            style={
              showIgnore
                ? {
                    ...styles.gridRow,
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) auto auto",
                  }
                : styles.gridRow
            }
          >
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
            {showIgnore && (
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#bdbdbd",
                  whiteSpace: "nowrap",
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(row.ignore)}
                  onChange={(e) => setIgnore(i, e.target.checked)}
                  style={{ accentColor: "var(--accent)" }}
                />
              </label>
            )}
            {editing ? (
              <button type="button" onClick={() => removeRow(i)} style={styles.rowBtn}>
                Remove
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div style={styles.rowActions}>
          <button type="button" onClick={addRow} style={styles.addBtn}>
            {addLabel}
          </button>
        </div>
      )}

      {helpLeft || helpRight ? (
        <p style={styles.help}>
          <span style={styles.helpRow}>
            <span>{helpLeft}</span>
            <span style={{ textAlign: "right" }}>{helpRight}</span>
          </span>
        </p>
      ) : (
        <p style={styles.help}>{help}</p>
      )}
    </section>
  );
}
