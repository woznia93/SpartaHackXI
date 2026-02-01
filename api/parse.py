import json
from http.server import BaseHTTPRequestHandler
from pydantic import BaseModel
from lark import Lark, Token, Tree
from typing import List, Optional
import re

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

def ast_to_json(node, counter):
    if isinstance(node, Token):
        counter[0] += 1
        return {
            "id": counter[0],
            "type": node.type,
            "value": node.value,
            "line": node.line,
            "column": node.column,
            "range": {
                "start": node.start_pos,
                "end": node.end_pos
            },
        }
    elif isinstance(node, Tree):
        counter[0] += 1
        return {
            "id": counter[0],
            "type": node.data,
            "line": getattr(node.meta, "line", None),
            "range": {
                "start": getattr(node.meta, "start_pos", None),
                "end": getattr(node.meta, "end_pos", None),
            },
            "column": getattr(node.meta, "column", None),
            "children": [ast_to_json(c, counter) for c in node.children],
        }
    else:
        return None

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            RULE_NAME_PATTERN = r"^[_a-z][_a-z0-9]*$"
            TOKEN_NAME_PATTERN = r"^[_A-Z][_A-Z0-9]*$"
            grammar = ""

            for rule in data.get('grammarRules', []):
                if not rule["left"]:
                    raise ValueError("Grammar rule left-hand side is empty")
                
                if re.fullmatch(RULE_NAME_PATTERN, rule['left']) is None:
                    raise ValueError(f"Invalid grammar rule name: {rule['left']}\n\nGrammar rules must start with a lowercase or an underscore, followed by a lowercase, underscore, or number.")
                
                grammar += f"{rule['left']} : {rule['right']}\n"

            for rule in data.get('tokenRules', []):

                if not rule["key"]:
                    raise ValueError("Token name is empty")
                
                if re.fullmatch(TOKEN_NAME_PATTERN, rule['key']) is None:
                    raise ValueError(f"Invalid token name: {rule['key']}\n\nToken names must start with an uppercase or an underscore, followed by an uppercase, underscore, or number.")

                grammar += f"{rule['key']} : /{rule['value']}/\n"
                if rule.get('ignore'):
                    grammar += f"%ignore {rule['key']}\n"

            parser = Lark(grammar, propagate_positions=True)
            tree = parser.parse(data['source'])

            counter = [0]
            ast = ast_to_json(tree, counter)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True, "ast": ast, "tokens": []}).encode())
        except Exception as e:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "errors": [{"message": str(e)}]}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    from http.server import HTTPServer

    host = "0.0.0.0"  # listen on all interfaces
    port = 8000       # choose your port

    print(f"Server running at http://{host}:{port}/")
    server = HTTPServer((host, port), handler)
    server.serve_forever()