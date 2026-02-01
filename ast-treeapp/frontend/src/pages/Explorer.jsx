import { useMemo, useState } from "react";
import { styles } from "../styles/astExplorerStyles.js";
import HeaderBar from "../components/HeaderBar.jsx";
import RulesGridCard from "../components/RulesGridCard.jsx";
import SourceEditorCard from "../components/SourceEditorCard.jsx";
import AstPanel from "../components/AstPanel.jsx";
import FooterNote from "../components/FooterNote.jsx";
import { mockParseArithmetic } from "../utils/mockParseArithmetic.js";

const DEFAULT_TOKEN_ROWS = [
  { left: "NUMBER", right: "\\d+(\\.\\d+)?" },
  { left: "PLUS", right: "\\+" },
  { left: "STAR", right: "\\*" },
  { left: "LPAREN", right: "\\(" },
  { left: "RPAREN", right: "\\)" },
  { left: "WS", right: "\\s+" },
];

const DEFAULT_GRAMMAR_ROWS = [
  { left: "Expr", right: "Term (PLUS Term)*" },
  { left: "Term", right: "Factor (STAR Factor)*" },
  { left: "Factor", right: "NUMBER | LPAREN Expr RPAREN" },
];

const DEFAULT_SOURCE = `1 + 2 * (3 + 4)`;

export default function Explorer() {
  const [tokenRows, setTokenRows] = useState(DEFAULT_TOKEN_ROWS);
  const [grammarRows, setGrammarRows] = useState(DEFAULT_GRAMMAR_ROWS);
  const [sourceText, setSourceText] = useState(DEFAULT_SOURCE);

  const [isParsing, setIsParsing] = useState(false);
  const [ast, setAst] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [errors, setErrors] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const [useMock, setUseMock] = useState(true);

  const tokenRules = useMemo(() => rowsToTokenRules(tokenRows), [tokenRows]);
  const grammarRules = useMemo(() => rowsToGrammarRules(grammarRows), [grammarRows]);

  const status = useMemo(() => {
    if (isParsing) return { label: "Parsing…", color: "#6b7280" };
    if (errors?.length) return { label: "Parse failed", color: "#b91c1c" };
    if (ast) return { label: "Parsed OK", color: "#15803d" };
    return { label: "Idle", color: "#6b7280" };
  }, [isParsing, errors, ast]);

  async function handleParse() {
    setIsParsing(true);
    setErrors([]);
    setAst(null);
    setTokens([]);
    setSelectedNode(null);

    try {
      if (!useMock) {
        const res = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenRules,
            grammarRules,
            source: sourceText,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          setErrors(
            data?.errors?.length
              ? data.errors
              : [{ message: "Backend parse failed", details: data }]
          );
        } else {
          setAst(data.ast ?? null);
          setTokens(data.tokens ?? []);
          setErrors(data.errors ?? []);
        }
      } else {
        const data = mockParseArithmetic(sourceText);
        if (!data.ok) setErrors(data.errors);
        else {
          setAst(data.ast);
          setTokens(data.tokens);
        }
      }
    } catch (e) {
      setErrors([{ message: "Parse error", details: String(e) }]);
    } finally {
      setIsParsing(false);
    }
  }

  function handleUpload(file) {
    const reader = new FileReader();
    reader.onload = () => setSourceText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <div style={styles.page}>
      <HeaderBar
        status={status}
        useMock={useMock}
        setUseMock={setUseMock}
        onParse={handleParse}
        isParsing={isParsing}
      />

      <main style={styles.mainGrid}>
        <RulesGridCard
          title="Token Regex Rules"
          rows={tokenRows}
          setRows={setTokenRows}
          leftPlaceholder="TOKEN_NAME"
          rightPlaceholder="regex"
          help={
            <>
              Format: <code>TOKEN NAME /regex/</code> and optionally{" "}
              <code>skip</code>.
            </>
          }
        />

        <RulesGridCard
          title="Grammar Rules"
          rows={grammarRows}
          setRows={setGrammarRows}
          leftPlaceholder="NonTerminal"
          rightPlaceholder="Rule expression"
          help={
            <>
              EBNF style expressions.
            </>
          }
        />

        <SourceEditorCard
          value={sourceText}
          onChange={setSourceText}
          onUpload={handleUpload}
          errors={errors}
        />

        <AstPanel
          ast={ast}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          tokens={tokens}
        />
      </main>

      <FooterNote />
    </div>
  );
}

function rowsToTokenRules(rows) {
  return rows
    .map((r) => {
      const key = (r.left ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");

      const value = r.right?.trim() ?? "";

      return { key, value };
    })
    .filter((r) => r.key || r.value);
}


function rowsToGrammarRules(rows) {
  return rows
    .map((r) => {
      const left = (r.left ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
      const right = r.right?.trim() ?? "";

      return { left, right };
    })
    .filter((r) => r.left || r.right);
}

