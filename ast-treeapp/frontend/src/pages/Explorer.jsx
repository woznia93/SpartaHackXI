import { useMemo, useState } from "react";
import Tab from "../components/Tab.jsx";
import Editor from "../components/Editor.jsx";
import Tree from "../components/Tree.jsx";
import EmptyState from "../components/EmptyState.jsx";
import KV from "../components/KV.jsx";
import IdeaCard from "../components/IdeaCard.jsx";
import { mockParse } from "../mock/mockParse.js";

const DEFAULT_TOKENS = `TOKEN NUMBER /\\d+/
TOKEN IDENT /[a-zA-Z_][a-zA-Z0-9_]*/`;

const DEFAULT_GRAMMAR = `Expr -> Expr + Term | Term
Term -> NUMBER | IDENT`;

const DEFAULT_SOURCE = `x = 1 + 2`;

export default function Explorer() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [ast, setAst] = useState(null);
  const [selected, setSelected] = useState(null);

  function parse() {
    const result = mockParse(source);
    setAst(result.ast);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <h1 className="text-xl font-bold mb-4">AST Explorer (Demo)</h1>

      <Editor
        title="Source"
        subtitle="Edit source and parse"
        value={source}
        onChange={setSource}
      />

      <button
        onClick={parse}
        className="mt-4 px-4 py-2 bg-blue-600 rounded"
      >
        Parse
      </button>

      <div className="mt-6">
        {!ast ? (
          <EmptyState />
        ) : (
          <Tree node={ast} selectedId={selected?.id} onSelect={setSelected} />
        )}
      </div>

      {selected && (
        <div className="mt-4">
          <KV k="type" v={selected.type} />
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4">
        <IdeaCard title="Grammar-driven" desc="Define grammars dynamically" />
        <IdeaCard title="Visual AST" desc="Click nodes to inspect" />
      </div>
    </div>
  );
}
