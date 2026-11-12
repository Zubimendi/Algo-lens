from __future__ import annotations

import ast
import re
from typing import Any


def build_line_catalog(code: str) -> dict[int, dict[str, str]]:
    """Map source line numbers to generic teaching blurbs from the AST."""
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return {}

    lines = code.splitlines()
    catalog: dict[int, dict[str, str]] = {}

    for node in ast.walk(tree):
        lineno = getattr(node, "lineno", None)
        if not isinstance(lineno, int):
            continue
        if lineno in catalog:
            continue
        source = lines[lineno - 1].strip() if 0 < lineno <= len(lines) else ""
        catalog[lineno] = _explain_node(node, source)

    # Fill any remaining executable-looking lines with a source-based fallback
    for i, raw in enumerate(lines, start=1):
        stripped = raw.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith(('"""', "'''")):
            continue
        if i not in catalog:
            catalog[i] = {
                "what": "Run this statement.",
                "why": "It advances the algorithm.",
                "kind": "stmt",
            }

    return catalog


def explain_step(
    *,
    line: int,
    source_line: str,
    catalog: dict[int, dict[str, str]],
    plain: dict[str, Any],
    changes: list[dict[str, Any]],
) -> dict[str, str]:
    meta = catalog.get(line) or {
        "what": "Run this statement.",
        "why": "It advances the algorithm.",
        "kind": "stmt",
    }
    what = meta["what"]
    why = meta["why"]
    with_values = _with_values(source_line, plain, changes, meta.get("kind", "stmt"))
    return {"what": what, "withValues": with_values, "why": why}


def _explain_node(node: ast.AST, source: str) -> dict[str, str]:
    if isinstance(node, ast.Assign):
        targets = ", ".join(_fmt_expr(t) for t in node.targets)
        return {
            "what": f"Assign a value to {targets}.",
            "why": "Remember this value for later steps.",
            "kind": "assign",
        }
    if isinstance(node, ast.AnnAssign) and node.value is not None:
        return {
            "what": f"Assign a value to {_fmt_expr(node.target)}.",
            "why": "Remember this value for later steps.",
            "kind": "assign",
        }
    if isinstance(node, ast.AugAssign):
        return {
            "what": f"Update {_fmt_expr(node.target)} in place.",
            "why": "Accumulate or adjust a running value.",
            "kind": "augassign",
        }
    if isinstance(node, ast.For):
        return {
            "what": f"Loop over {_fmt_expr(node.iter)}, binding {_fmt_expr(node.target)}.",
            "why": "Repeat work for each item in the sequence.",
            "kind": "for",
        }
    if isinstance(node, ast.While):
        return {
            "what": f"Check the loop condition: {source or _fmt_expr(node.test)}.",
            "why": "Decide whether another iteration should run.",
            "kind": "while",
        }
    if isinstance(node, ast.If):
        return {
            "what": f"Branch on a condition: {source or _fmt_expr(node.test)}.",
            "why": "Choose which path the algorithm takes next.",
            "kind": "if",
        }
    if isinstance(node, ast.Return):
        return {
            "what": "Return a value from the function.",
            "why": "Hand the answer (or intermediate result) back to the caller.",
            "kind": "return",
        }
    if isinstance(node, ast.Break):
        return {
            "what": "Break out of the nearest (innermost) loop only.",
            "why": (
                "An outer loop can still keep going. If you expected to stop "
                "the whole search, you may need to return — or reset the inner index."
            ),
            "kind": "break",
        }
    if isinstance(node, ast.Continue):
        return {
            "what": "Skip to the next loop iteration.",
            "why": "Ignore the rest of this iteration's body.",
            "kind": "continue",
        }
    if isinstance(node, ast.Expr):
        call = node.value if isinstance(node.value, ast.Call) else None
        if (
            call
            and isinstance(call.func, ast.Attribute)
            and call.func.attr == "append"
        ):
            return {
                "what": f"Append a value onto {_fmt_expr(call.func.value)}.",
                "why": (
                    "This grows the answer/list. Extra appends across later loop "
                    "iterations are why a result can become longer than expected."
                ),
                "kind": "append",
            }
        return {
            "what": "Evaluate this expression / call.",
            "why": "Perform a side effect or compute a value used by the next steps.",
            "kind": "expr",
        }
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
        return {
            "what": f"Define {node.name}.",
            "why": "Set up the callable the tracer will step through.",
            "kind": "def",
        }
    if isinstance(node, ast.With):
        return {
            "what": "Enter a context manager block.",
            "why": "Acquire a resource for the indented block.",
            "kind": "with",
        }
    if isinstance(node, ast.Try):
        return {
            "what": "Start a try block.",
            "why": "Handle possible errors in the following statements.",
            "kind": "try",
        }
    return {
        "what": "Run this statement.",
        "why": "It advances the algorithm.",
        "kind": "stmt",
    }


def _fmt_expr(node: ast.AST) -> str:
    try:
        return ast.unparse(node)
    except Exception:
        return type(node).__name__


_NAME_RE = re.compile(r"\b([A-Za-z_][A-Za-z0-9_]*)\b")


def _with_values(
    source_line: str,
    plain: dict[str, Any],
    changes: list[dict[str, Any]],
    kind: str,
) -> str:
    source = source_line.strip()
    involved = []
    for match in _NAME_RE.finditer(source):
        name = match.group(1)
        if name in plain and name not in {
            "and",
            "or",
            "not",
            "in",
            "is",
            "if",
            "else",
            "for",
            "while",
            "return",
            "True",
            "False",
            "None",
            "len",
            "range",
            "list",
            "dict",
            "set",
            "sum",
            "min",
            "max",
            "divmod",
        }:
            involved.append(f"{name}={_short(plain[name])}")

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique = []
    for item in involved:
        key = item.split("=", 1)[0]
        if key not in seen:
            seen.add(key)
            unique.append(item)

    change_bits = []
    for c in changes[:6]:
        name = c.get("name")
        if c.get("kind") == "added":
            change_bits.append(f"{name} becomes {_short(c.get('after'))}")
        elif c.get("kind") == "removed":
            change_bits.append(f"{name} is removed")
        else:
            change_bits.append(
                f"{name}: {_short(c.get('before'))} → {_short(c.get('after'))}"
            )

    parts = []
    if source:
        parts.append(f"Line: `{source}`")
    if unique:
        parts.append("Values in play: " + ", ".join(unique[:8]))
    if change_bits:
        parts.append("Effect: " + "; ".join(change_bits))
    elif kind in {"while", "if"} and unique:
        parts.append("The condition uses the values above.")
    if not parts:
        return "No local values are visible at this step yet."
    return " ".join(parts)


def _short(value: Any, limit: int = 80) -> str:
    text = repr(value)
    if len(text) > limit:
        return text[: limit - 1] + "…"
    return text
