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
  const [preserve, setPreserve] = useState(true);
  const [strict, setStrict] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [fitCount, setFitCount] = useState(0);

  const headerRight = useMemo(() => {
    if (!canRender) return null;
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <ToggleButton
          active={viewMode === "tree"}
          onClick={() => setViewMode("tree")}
        >
          Tree
        </ToggleButton>
        <ToggleButton
          active={viewMode === "bubble"}
          onClick={() => setViewMode("bubble")}
        >
          Bubble Graph
        </ToggleButton>
        {viewMode === "bubble" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 6 }}>
            <button
              onClick={() => setPreserve((p) => !p)}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: preserve ? "1px solid #3b82f6" : "1px solid #223055",
                background: preserve ? "rgba(59,130,246,0.15)" : "#0b1020",
                color: preserve ? "#bfdbfe" : "#cbd5e1",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Preserve
            </button>

            <button
              onClick={() => setStrict((s) => !s)}
              disabled={!preserve}
              title={!preserve ? "Enable Preserve to use Strict mode" : "Toggle Strict mode"}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: strict ? "1px solid #ef4444" : "1px solid #223055",
                background: strict ? "rgba(239,68,68,0.12)" : "#0b1020",
                color: strict ? "#fecaca" : "#cbd5e1",
                fontSize: 12,
                cursor: !preserve ? "not-allowed" : "pointer",
              }}
            >
              Strict
            </button>

            <button
              onClick={() => setResetCount((c) => c + 1)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #223055",
                background: "#0b1020",
                color: "#cbd5e1",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Reset
            </button>

            <button
              onClick={() => setFitCount((c) => c + 1)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #223055",
                background: "#0b1020",
                color: "#cbd5e1",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Fit
            </button>
          </div>
        )}
      </div>
    );
  }, [canRender, viewMode, preserve, strict]);

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
              preserveStructure={preserve}
              strictMode={strict}
              resetSignal={resetCount}
              fitSignal={fitCount}
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
        border: active ? "1px solid #ffffff" : "1px solid #2a2a2a",
        background: active ? "rgba(255,255,255,0.12)" : "#161616",
        color: active ? "#ffffff" : "#d4d4d4",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
