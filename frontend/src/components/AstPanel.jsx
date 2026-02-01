import { useMemo, useState } from "react";
import { styles } from "../styles/astExplorerStyles.js";
import Tree from "./Tree.jsx";
import NodeInspector from "./NodeInspector.jsx";
import TokensList from "./TokensList.jsx";
import BubbleGraph from "./BubbleGraph.jsx";
import ErrorPanel from "./ErrorPanel.jsx";

export default function AstPanel({ ast, selectedNode, setSelectedNode, tokens, errors }) {
  const [viewMode, setViewMode] = useState("tree");
  const canRender = Boolean(ast);
  const [locked, setLocked] = useState(false);
  const [resetCount, setResetCount] = useState(0);

  const headerRight = useMemo(() => {
    if (!canRender) return null;
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <ToggleButton
          active={viewMode === "tree"}
          onClick={() => setViewMode("tree")}
        >
          Node Heirarchy
        </ToggleButton>
        <ToggleButton
          active={viewMode === "bubble"}
          onClick={() => setViewMode("bubble")}
        >
          Tree Visualization
        </ToggleButton>
        {viewMode === "bubble" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 6 }}>
            <button
              onClick={() => setLocked((l) => !l)}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: locked ? "1px solid var(--row-selected-border)" : "1px solid var(--border)",
                background: locked ? "var(--row-selected)" : "var(--panel)",
                color: "var(--text)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {locked ? "Unlock" : "Lock"}
            </button>

            <button
              onClick={() => setResetCount((c) => c + 1)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--panel)",
                color: "var(--muted-strong)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>
    );
  }, [canRender, viewMode, locked]);

  return (
    <section style={styles.cardWide}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h2 style={{ ...styles.h2, margin: 0 }}>AST</h2>
        {headerRight}
      </div>
      {errors?.length ? (
        <div style={styles.placeholder}>
          <ErrorPanel errors={errors} />
        </div>
      ) : !ast ? (
        <div style={styles.placeholder}>
          Click <b>Parse</b> to generate an AST.
        </div>
      ) : viewMode === "bubble" ? (
        <div style={styles.outputGrid}>
          <div style={styles.treePane}>
            <BubbleGraph
              ast={ast}
              selectedId={selectedNode?.id}
              onSelect={setSelectedNode}
              locked={locked}
              resetSignal={resetCount}
            />
          </div>

          <div style={styles.inspectorPane}>
            <NodeInspector node={selectedNode} />
            <TokensList tokens={tokens} />
          </div>
        </div>
      ) : (
        <div style={styles.outputGrid}>
          <div style={styles.treePane}>
            <Tree
              node={ast}
              onSelect={(n) => setSelectedNode(n)}
              selectedId={selectedNode?.id}
            />
          </div>

          <div style={styles.inspectorPane}>
            <NodeInspector node={selectedNode} />
            <TokensList tokens={tokens} />
          </div>
        </div>
      )}
    </section>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: active ? "1px solid var(--row-selected-border)" : "1px solid var(--border)",
        background: active ? "var(--row-selected)" : "var(--chip)",
        color: active ? "var(--text)" : "var(--muted-strong)",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}