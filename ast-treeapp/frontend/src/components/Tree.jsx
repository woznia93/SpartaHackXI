import { useState } from "react";
import { styles } from "../styles/astExplorerStyles.js";

export default function Tree({ node, onSelect, selectedId }) {
  return (
    <TreeNode
      node={node}
      depth={0}
      onSelect={onSelect}
      selectedId={selectedId}
      getChildren={getChildren}
      key={node?.id ?? "root"}
    />
  );
}

function getChildren(n) {
  if (!n || typeof n !== "object") return [];
  if (Array.isArray(n.children)) return n.children;
  if (Array.isArray(n.body)) return n.body;
  if (n.left && n.right) return [n.left, n.right].filter(Boolean);
  return [];
}

function TreeNode({ node, depth, onSelect, selectedId, getChildren }) {
  const [open, setOpen] = useState(true);
  const children = getChildren(node);
  const isSelected = node?.id && node.id === selectedId;

  const label = `${node.type ?? "Node"}${node.value != null ? `: '${node.value}'` : ""}`;

  return (
    <div style={{ marginLeft: depth * 14 }}>
      <div
        style={{
          ...styles.treeRow,
          ...(isSelected ? styles.treeRowSelected : null),
        }}
        onClick={() => onSelect(node)}
      >
        {children.length > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            style={styles.disclosure}
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span style={styles.disclosureSpacer} />
        )}
        <span style={styles.treeLabel}>{label}</span>
        {node.range && (
          <span style={styles.treeRange}>
            {node.range.start}..{node.range.end}
          </span>
        )}
      </div>

      {open &&
        children.map((c, idx) => (
          <TreeNode
            key={c?.id ?? `${label}-${idx}`}
            node={c}
            depth={depth + 1}
            onSelect={onSelect}
            selectedId={selectedId}
            getChildren={getChildren}
          />
        ))}
    </div>
  );
}
