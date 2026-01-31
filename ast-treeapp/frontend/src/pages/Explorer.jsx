import { useMemo, useState } from "react";
import { styles } from "../styles/astExplorerStyles.js";
import HeaderBar from "../components/HeaderBar.jsx";
import TextEditorCard from "../components/TextEditorCard.jsx";
import SourceEditorCard from "../components/SourceEditorCard.jsx";
import AstPanel from "../components/AstPanel.jsx";
import FooterNote from "../components/FooterNote.jsx";
import { mockParseArithmetic } from "../utils/mockParseArithmetic.js";

const DEFAULT_TOKENS = `# Token rules: TOKEN <NAME> /regex/ [skip]
TOKEN NUMBER /\\d+(\\.\\d+)?/
TOKEN PLUS   /\\+/
TOKEN STAR   /\\*/
TOKEN LPAREN /\\(/
TOKEN RPAREN /\\)/
TOKEN WS     /\\s+/ skip
`;

const DEFAULT_GRAMMAR = `# Grammar rules (BNF-ish)
Expr   -> Term (PLUS Term)*
Term   -> Factor (STAR Factor)*
Factor -> NUMBER | LPAREN Expr RPAREN
`;

const DEFAULT_SOURCE = `1 + 2 * (3 + 4)`;

export default function Explorer() {
  const [tokenRules, setTokenRules] = useState(DEFAULT_TOKENS);
  const [grammarRules, setGrammarRules] = useState(DEFAULT_GRAMMAR);
  const [sourceText, setSourceText] = useState(DEFAULT_SOURCE);

  const [isParsing, setIsParsing] = useState(false);
  const [ast, setAst] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [errors, setErrors] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const [useMock, setUseMock] = useState(true);

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
        <TextEditorCard
          title="Token Regex Rules"
          value={tokenRules}
          onChange={setTokenRules}
          help={
            <>
              Format: <code>TOKEN NAME /regex/</code> and optionally{" "}
              <code>skip</code>.
            </>
          }
        />

        <TextEditorCard
          title="Grammar Rules"
          value={grammarRules}
          onChange={setGrammarRules}
          help={
            <>
              PEG style expressions.
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
