import { styles } from "../styles/astExplorerStyles.js";

export default function HeaderBar({
  status,
  useMock,
  setUseMock,
  theme,
  setTheme,
  onParse,
  isParsing,
}) {
  return (
    <header style={styles.header}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={styles.h1}>Language Explorer</h1>
        <span style={{ ...styles.badge, borderColor: status.color, color: status.color }}>
          {status.label}
        </span>
      </div>

      <div style={styles.headerActions}>
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={styles.editBtn}
        >
          {theme === "dark" ? "Light theme" : "Dark theme"}
        </button>

        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={useMock}
            onChange={(e) => setUseMock(e.target.checked)}
          />
          <span style={{ marginLeft: 8 }}>
            Demo mode (mock parser)
          </span>
        </label>

        <button
          onClick={onParse}
          disabled={isParsing}
          style={{
            ...styles.primaryBtn,
            opacity: isParsing ? 0.6 : 1,
            cursor: isParsing ? "not-allowed" : "pointer",
          }}
        >
          Parse
        </button>
      </div>
    </header>
  );
}
