import { useMemo, useState } from "react";
import { styles } from "../styles/astExplorerStyles.js";
import HeaderBar from "../components/HeaderBar.jsx";
import RulesGridCard from "../components/RulesGridCard.jsx";
import SourceEditorCard from "../components/SourceEditorCard.jsx";
import AstPanel from "../components/AstPanel.jsx";
import FooterNote from "../components/FooterNote.jsx";
import { mockParseArithmetic } from "../utils/mockParseArithmetic.js";

const DEFAULT_TOKEN_ROWS = [
  { left: "NUMBER", right: "\\d+(\\.\\d+)?", ignore: false },
  { left: "PLUS", right: "\\+", ignore: false},
  { left: "STAR", right: "\\*", ignore: false },
  { left: "LPAREN", right: "\\(",ignore: false },
  { left: "RPAREN", right: "\\)", ignore: false },
  { left: "WS", right: "\\s+" , ignore: true},
];

const DEFAULT_GRAMMAR_ROWS = [
  { left: "start", right: "expr" },
  { left: "expr", right: "term (PLUS term)*" },
  { left: "term", right: "factor (STAR factor)*" },
  { left: "factor", right: "NUMBER | LPAREN expr RPAREN" },
];

const DEFAULT_SOURCE = `1 + 2 * (3 + 4)`;

const THEME_VARS = {
  dark: {
    "--bg": "#0b0b0b",
    "--text": "#f5f5f5",
    "--muted": "#bdbdbd",
    "--muted-strong": "#d4d4d4",
    "--border": "#2a2a2a",
    "--card": "#111111",
    "--panel": "#0f0f0f",
    "--panel-strong": "#0b0b0b",
    "--chip": "#161616",
    "--badge-bg": "rgba(255,255,255,0.06)",
    "--primary-bg": "#ffffff",
    "--primary-border": "#e5e5e5",
    "--primary-text": "#0b0b0b",
    "--row-selected": "rgba(255,255,255,0.08)",
    "--row-selected-border": "rgba(255,255,255,0.2)",
    "--shadow": "0 8px 20px rgba(0,0,0,0.45)",
    "--accent": "#3b82f6",
  },
  light: {
    "--bg": "#f6f5f1",
    "--text": "#161616",
    "--muted": "#5f5f5f",
    "--muted-strong": "#2f2f2f",
    "--border": "#d6d3cd",
    "--card": "#ffffff",
    "--panel": "#f4f1eb",
    "--panel-strong": "#eee9e0",
    "--chip": "#f0ece5",
    "--badge-bg": "rgba(0,0,0,0.05)",
    "--primary-bg": "#111111",
    "--primary-border": "#111111",
    "--primary-text": "rgb(249, 249, 249)",
    "--row-selected": "rgba(41, 0, 0, 0.28)",
    "--row-selected-border": "rgba(17,17,17,0.12)",
    "--shadow": "0 10px 22px rgba(20,20,20,0.08)",
    "--accent": "#2563eb",
  },
};

export default function Explorer() {
  const [tokenRows, setTokenRows] = useState(DEFAULT_TOKEN_ROWS);
  const [grammarRows, setGrammarRows] = useState(DEFAULT_GRAMMAR_ROWS);
  const [sourceText, setSourceText] = useState(DEFAULT_SOURCE);
  const [theme, setTheme] = useState("dark");

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
        console.log(data)
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
    <div style={{ ...styles.page, ...THEME_VARS[theme] }}>
      <HeaderBar
        status={status}
        useMock={useMock}
        setUseMock={setUseMock}
        theme={theme}
        setTheme={setTheme}
        onParse={handleParse}
        isParsing={isParsing}
      />

      <main style={styles.mainGrid}>
        <RulesGridCard
          title="Token Regex Rules"
          tokens = {true}
          rows={tokenRows}
          setRows={setTokenRows}
          leftPlaceholder="TOKEN_NAME"
          rightPlaceholder="regex"
          showIgnore
          helpLeft={<span>Format: <code>TOKEN_NAME regex</code>.</span>}
          helpRight={<span style={{ textAlign: "right" }}>Use checkboxes to skip tokens.</span>}
        />

        <RulesGridCard
          title="Grammar Rules"
          rows={grammarRows}
          tokens = {false}
          setRows={setGrammarRows}
          leftPlaceholder="Non Terminal"
          rightPlaceholder="Rule expression"
          lockLeftIndices={[0]}
          disableRemoveIndices={[0]}
          help={
            <>
              EBNF style expressions. To hide a rule from the final tree, prefix it with an underscrore e.g _expr.
            </>
          }
        />

        <SourceEditorCard
          value={sourceText}
          onChange={setSourceText}
          onUpload={handleUpload}
        />

        <AstPanel
          ast={ast}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          tokens={tokens}
          errors={errors}
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
        .replace(/\s+/g, "_");

      const value = r.right?.trim() ?? "";

      return { key, value, ignore: Boolean(r.ignore) };
    })
    .filter((r) => r.key || r.value);
}


function rowsToGrammarRules(rows) {
  return rows
    .map((r) => {
      const left = (r.left ?? "")
        .trim()
        .replace(/\s+/g, "_");
      const right = r.right?.trim() ?? "";

      return { left, right };
    })
    .filter((r) => r.left || r.right);
}

