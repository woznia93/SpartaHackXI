import json
from http.server import BaseHTTPRequestHandler
from pydantic import BaseModel
from lark import Lark, Token, Tree
from typing import List, Optional

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
        }
    elif isinstance(node, Tree):
        counter[0] += 1
        return {
            "id": counter[0],
            "type": node.data,
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
            
            grammar = ""
            for rule in data.get('grammarRules', []):
                grammar += f"{rule['left']} : {rule['right']}\n"

            for rule in data.get('tokenRules', []):
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


