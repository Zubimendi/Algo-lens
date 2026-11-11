from __future__ import annotations

import re
from typing import Any

from app.tracer.line_explainer import build_line_catalog, explain_step


PLACEHOLDER_RE = re.compile(r"\{([^{}]+)\}")


def fill_template(template: str, locals_plain: dict[str, Any]) -> str:
    def repl(match: re.Match[str]) -> str:
        expr = match.group(1).strip()
        try:
            value = eval(  # noqa: S307
                expr,
                {"__builtins__": {"len": len, "str": str, "int": int}},
                locals_plain,
            )
            return str(value)
        except Exception:
            if expr in locals_plain:
                return str(locals_plain[expr])
            return "?"

    return PLACEHOLDER_RE.sub(repl, template)


def annotate_steps(
    steps: list[dict[str, Any]],
    templates: dict[int, dict[str, str]] | None,
    code: str = "",
) -> None:
    """Attach explain blocks using hand templates when present, else AST+values."""
    lines = code.replace("\r\n", "\n").split("\n")
    catalog = build_line_catalog(code) if code else {}

    plains: list[dict[str, Any]] = []
    for step in steps:
        locals_typed = step.get("locals") or {}
        plains.append({k: _plain(v) for k, v in locals_typed.items()})

    for i, step in enumerate(steps):
        line = step.get("line")
        plain = dict(plains[i])
        # Prefer next-step locals so assignments on this line resolve
        if i + 1 < len(plains):
            for k, v in plains[i + 1].items():
                plain[k] = v

        source_line = ""
        if isinstance(line, int) and 0 < line <= len(lines):
            source_line = lines[line - 1]

        if templates and line in templates:
            tmpl = templates[line]
            what = tmpl.get("what", "Execute this line.")
            with_tmpl = tmpl.get("withValuesTemplate") or tmpl.get("withValues", "")
            why = tmpl.get("why", "")
            with_values = fill_template(with_tmpl, plain) if with_tmpl else what
            step["explain"] = {
                "what": what,
                "withValues": with_values,
                "why": why,
            }
        else:
            step["explain"] = explain_step(
                line=int(line or 0),
                source_line=source_line,
                catalog=catalog,
                plain=plain,
                changes=step.get("changes") or [],
            )


def _plain(typed: Any) -> Any:
    if not isinstance(typed, dict) or "type" not in typed:
        return typed
    t = typed["type"]
    v = typed.get("value")
    if t in {"int", "float", "bool", "str", "none"}:
        return v
    if t in {"list", "tuple", "set", "stack", "queue", "heap"}:
        return [_plain(x) for x in (v or [])]
    if t == "matrix":
        return [[_plain(c) for c in (row or [])] for row in (v or [])]
    if t == "dict":
        out = {}
        for p in v or []:
            out[str(_plain(p["key"]))] = _plain(p["value"])
        return out
    if t == "linked_list":
        return [_plain(n.get("val")) for n in (v or [])]
    if t == "tree":
        out = []
        for n in v or []:
            if n is None:
                out.append(None)
            elif isinstance(n, dict):
                out.append(_plain(n.get("val")))
            else:
                out.append(_plain(n))
        return out
    return v
