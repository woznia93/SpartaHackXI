from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from lark import Lark, Token, Tree
from typing import List, Optional
from mangum import Mangum

app = FastAPI(
    title="AST Explorer API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for hackathon
    allow_methods=["*"],
    allow_headers=["*"],
)

class TokenRule(BaseModel):
    key: str
    value: str
    ignore: bool

class GrammarRule(BaseModel):
    left: str
    right: str

class CodeRequest(BaseModel):
    source: str
    tokenRules: Optional[List[TokenRule]] = []
    grammarRules: Optional[List[GrammarRule]] = []

@app.get("/")
def root():
    return {"status": "AST Explorer API running"}

def ast_to_json(node, counter):
    if isinstance(node, Token):
        counter[0] += 1
        return {
            "id": counter[0],
            "type": node.type,
            "value": node.value,
            "line": node.line,
            "column": node.column,
        }
    elif isinstance(node, Tree):
        counter[0] += 1
        return {
            "id": counter[0],
            "type": node.data,
            "children": [ast_to_json(c, counter) for c in node.children],
        }
    else:
        raise TypeError(f"Unknown node type: {type(node)}")

@app.post("/parse")
def parse_code(request: CodeRequest):
    try:
        grammar = ""
        for rule in request.grammarRules:
            grammar += f"{rule.left} : {rule.right}\n"

        for rule in request.tokenRules:
            grammar += f"{rule.key} : /{rule.value}/\n"
            if rule.ignore:
                grammar += f"%ignore {rule.key}\n"

        parser = Lark(grammar, propagate_positions=True)
        tree = parser.parse(request.source)

        counter = [0]
        ast = ast_to_json(tree, counter)

        return {"ok": True, "ast": ast, "tokens": []}
    except Exception as e:
        return {"ok": False, "errors": [{"message": str(e)}]}

#REQUIRED BY VERCEL
handler = Mangum(app)
