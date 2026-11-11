from __future__ import annotations

import ast
import json
import re
from typing import Any

from app.languages.python_lang import sanitize_pasted_code as sanitize_pasted_code


class ValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def validate_code(code: str) -> ast.Module:
    code = sanitize_pasted_code(code)
    if not code or not code.strip():
        raise ValidationError(
            "Code is empty. Paste a Python Solution class or a top-level function, "
            "then provide matching test input and press Run."
        )
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValidationError(_format_syntax_error(code, e)) from e

    has_solution = False
    has_function = False
    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == "Solution":
            methods = [
                item
                for item in node.body
                if isinstance(item, ast.FunctionDef) and item.name != "__init__"
            ]
            if methods:
                has_solution = True
        if isinstance(node, ast.FunctionDef):
            has_function = True

    if not has_solution and not has_function:
        raise ValidationError(
            "Could not find anything to run. Provide either "
            "`class Solution` with a method, or a top-level function."
        )
    return tree


def _format_syntax_error(code: str, err: SyntaxError) -> str:
    lineno = err.lineno or 1
    lines = code.splitlines()
    snippet = lines[lineno - 1] if 0 < lineno <= len(lines) else ""
    pointer = ""
    if err.offset and snippet:
        caret_at = max(err.offset - 1, 0)
        pointer = "\n" + (" " * caret_at) + "^"
    msg = err.msg or "invalid syntax"
    base = f"Syntax error at line {lineno}: {msg}"
    if snippet:
        return f"{base}\n  {snippet}{pointer}"
    return base


def find_entry_method(code: str) -> tuple[str, str]:
    """Return (kind, name) where kind is 'method' or 'function'."""
    code = sanitize_pasted_code(code)
    tree = validate_code(code)
    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == "Solution":
            for item in node.body:
                if isinstance(item, ast.FunctionDef) and item.name != "__init__":
                    return ("method", item.name)
    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            return ("function", node.name)
    raise ValidationError("Could not find an entry method or function to call.")


def parse_input(raw: dict[str, Any] | str) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    text = raw.strip()
    if not text:
        return {}
    # Try JSON object first
    if text.startswith("{"):
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError as e:
            raise ValidationError(f"Invalid JSON input: {e.msg}") from e

    # Support kwargs style: words=["a","b"], maxWidth=16
    return _parse_kwargs_literal(text)


def _parse_kwargs_literal(text: str) -> dict[str, Any]:
    # Wrap as a dict literal for ast.literal_eval after normalizing barewords carefully.
    # Convert `key=value, key2=value2` into `{"key": value, "key2": value2}`
    parts: list[str] = []
    depth = 0
    current = []
    for ch in text:
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    if current:
        parts.append("".join(current).strip())

    result: dict[str, Any] = {}
    for part in parts:
        if not part:
            continue
        if "=" not in part:
            raise ValidationError(
                f"Input must be JSON or key=value pairs. Could not parse: {part!r}"
            )
        key, _, value = part.partition("=")
        key = key.strip()
        value = value.strip()
        if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", key):
            raise ValidationError(f"Invalid argument name: {key!r}")
        try:
            result[key] = ast.literal_eval(value)
        except (ValueError, SyntaxError) as e:
            raise ValidationError(
                f"Could not parse value for {key}: {value}"
            ) from e
    return result
