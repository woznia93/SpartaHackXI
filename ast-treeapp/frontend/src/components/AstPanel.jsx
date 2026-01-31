import { styles } from "../styles/astExplorerStyles.js";
import Tree from "./Tree.jsx";
import NodeInspector from "./NodeInspector.jsx";
import TokensList from "./TokensList.jsx";

export default function AstPanel({ ast, selectedNode, setSelectedNode, tokens }) {
  return (
    <section style={styles.cardWide}>
      <h2 style={styles.h2}>AST</h2>
      {!ast ? (
        <div style={styles.placeholder}>
          Click <b>Parse</b> to generate an AST.
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
