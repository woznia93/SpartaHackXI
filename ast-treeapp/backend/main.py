from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from lark import Lark
from typing import List, Optional, Dict


app = FastAPI(
    title="AST Explorer API",
    description="API for parsing and analyzing code",
    version="1.0.0"
)

# CORS - Allow React frontend to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Create React App (if using)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TokenRule(BaseModel):
    key: str
    value: str
    ignore: Optional[bool] = False

class GrammarRule(BaseModel):
    left: str
    right: str

class CodeRequest(BaseModel):
    source: str
    tokenRules: Optional[List[TokenRule]] = []
    grammarRules: Optional[List[GrammarRule]] = []

# Routes
@app.get("/")
def read_root():
    return {
        "message": "AST Explorer API",
        "docs": "/docs",  # FastAPI auto-generates docs!
        "version": "1.0.0"
    }

@app.post("/api/parse")
def parse_code(request: CodeRequest):
    """
    Parse code and return AST
    """

    grammar = ""
    for rule in request.grammarRules: 
        grammar += f"{rule.left} : {rule.right}\n"
        
    for rule in request.tokenRules:
        grammar += f"{rule.key} : /{rule.value}/\n"

    grammar += "start : expr\n"
    grammar += "%ignore WS\n"
    for rule in request.tokenRules:
        if rule.ignore and rule.key:
            grammar += f"%ignore {rule.key}\n"

    print(grammar)
    parser = Lark(grammar)

    tree = parser.parse(request.source)
    print(tree)
    return 1;

    # try:
    #     if request.language == "python":
    #         tree = ast.parse(request.code)
    #         ast_dict = ast_to_dict(tree)
    #         return {
    #             "success": True,
    #             "ast": ast_dict,
    #             "language": request.language
    #         }
    #     else:
    #         return {
    #             "success": False,
    #             "error": f"Language '{request.language}' not supported yet"
    #         }
    # except SyntaxError as e:
    #     raise HTTPException(status_code=400, detail={
    #         "success": False,
    #         "error": str(e),
    #         "line": e.lineno,
    #         "offset": e.offset
    #     })
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail={
    #         "success": False,
    #         "error": str(e)
    #     })

# @app.post("/api/analyze")
# def analyze_code(request: CodeRequest):
#     """
#     Analyze code and return statistics
#     """
#     try:
#         tree = ast.parse(request.code)
        
#         # Count different node types
#         stats = {
#             "functions": 0,
#             "classes": 0,
#             "imports": 0,
#             "lines": len(request.code.split('\n')),
#             "characters": len(request.code)
#         }
        
#         for node in ast.walk(tree):
#             if isinstance(node, ast.FunctionDef):
#                 stats["functions"] += 1
#             elif isinstance(node, ast.ClassDef):
#                 stats["classes"] += 1
#             elif isinstance(node, (ast.Import, ast.ImportFrom)):
#                 stats["imports"] += 1
        
#         return {
#             "success": True,
#             "stats": stats
#         }
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))

# @app.post("/api/transform")
# def transform_code(request: TransformRequest):
#     """
#     Apply transformations to code
#     """
#     # Example: convert function names to uppercase
#     try:
#         tree = ast.parse(request.code)
        
#         class FunctionNameTransformer(ast.NodeTransformer):
#             def visit_FunctionDef(self, node):
#                 if request.transformation == "uppercase_functions":
#                     node.name = node.name.upper()
#                 return node
        
#         transformer = FunctionNameTransformer()
#         new_tree = transformer.visit(tree)
#         new_code = ast.unparse(new_tree)  # Python 3.9+
        
#         return {
#             "success": True,
#             "original": request.code,
#             "transformed": new_code
#         }
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))

# # Helper function to convert AST to dict
# def ast_to_dict(node):
#     """Convert AST node to dictionary for JSON serialization"""
#     if isinstance(node, ast.AST):
#         result = {"_type": node.__class__.__name__}
#         for field, value in ast.iter_fields(node):
#             if isinstance(value, list):
#                 result[field] = [ast_to_dict(item) for item in value]
#             else:
#                 result[field] = ast_to_dict(value)
#         return result
#     else:
#         return node

# For running directly (optional)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
