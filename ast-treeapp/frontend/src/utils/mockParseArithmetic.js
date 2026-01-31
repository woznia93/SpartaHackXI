function tokenizeSimple(input) {
  const toks = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/\d/.test(ch)) {
      const start = i;
      while (i < input.length && /[\d.]/.test(input[i])) i++;
      toks.push({ type: "NUMBER", value: input.slice(start, i), start, end: i });
      continue;
    }
    if (ch === "+") toks.push({ type: "PLUS", value: "+", start: i, end: i + 1 });
    else if (ch === "*") toks.push({ type: "STAR", value: "*", start: i, end: i + 1 });
    else if (ch === "(") toks.push({ type: "LPAREN", value: "(", start: i, end: i + 1 });
    else if (ch === ")") toks.push({ type: "RPAREN", value: ")", start: i, end: i + 1 });
    else {
      throw new Error(`Bad character: ${ch}`);
    }
    i++;
  }
  toks.push({ type: "EOF", value: "", start: input.length, end: input.length });
  return toks;
}

class SimpleExprParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this._id = 1;
  }
  nextId() {
    return String(this._id++);
  }
  peek() {
    return this.tokens[this.pos] ?? { type: "EOF", value: "" };
  }
  eat(type) {
    const t = this.peek();
    if (t.type !== type) throw new Error(`Expected ${type}, got ${t.type}`);
    this.pos++;
    return t;
  }
  parseExpr() {
    let node = this.parseTerm();
    while (this.peek().type === "PLUS") {
      const op = this.eat("PLUS");
      const right = this.parseTerm();
      node = {
        id: this.nextId(),
        type: "BinaryExpr",
        value: op.value,
        left: node,
        right,
        range: { start: node.range.start, end: right.range.end },
      };
    }
    return node;
  }
  parseTerm() {
    let node = this.parseFactor();
    while (this.peek().type === "STAR") {
      const op = this.eat("STAR");
      const right = this.parseFactor();
      node = {
        id: this.nextId(),
        type: "BinaryExpr",
        value: op.value,
        left: node,
        right,
        range: { start: node.range.start, end: right.range.end },
      };
    }
    return node;
  }
  parseFactor() {
    const t = this.peek();
    if (t.type === "NUMBER") {
      const num = this.eat("NUMBER");
      return {
        id: this.nextId(),
        type: "NumberLiteral",
        value: Number(num.value),
        range: { start: num.start, end: num.end },
        children: [],
      };
    }
    if (t.type === "LPAREN") {
      const l = this.eat("LPAREN");
      const expr = this.parseExpr();
      this.eat("RPAREN");
      return {
        id: this.nextId(),
        type: "Group",
        range: { start: l.start, end: expr.range.end + 1 },
        children: [expr],
      };
    }
    throw new Error(`Unexpected token ${t.type}`);
  }
}

function offsetToLineCol(text, offset) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset; i++) {
    if (text[i] === "\n") {
      line++;
      col = 1;
    } else col++;
  }
  return { line, col };
}

export function mockParseArithmetic(input) {
  try {
    const toks = tokenizeSimple(input);
    const parser = new SimpleExprParser(toks);
    const ast = parser.parseExpr();
    if (parser.peek().type !== "EOF") {
      return {
        ok: false,
        errors: [
          {
            message: `Unexpected token ${parser.peek().type}`,
            at: offsetToLineCol(input, parser.peek().start),
          },
        ],
      };
    }
    return { ok: true, ast, tokens: toks.filter((t) => t.type !== "EOF") };
  } catch (e) {
    return {
      ok: false,
      errors: [{ message: "Mock parse failed", details: String(e) }],
    };
  }
}
