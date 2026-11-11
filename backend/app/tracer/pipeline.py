from __future__ import annotations

from typing import Any

from app.schemas.trace import (
    Change,
    Explain,
    Step,
    TraceResponse,
    TypedValue,
)
from app.tracer.annotator import annotate_steps
from app.tracer.differ import diff_locals
from app.tracer.normalizer import Normalizer
from app.tracer.sandbox import run_in_sandbox
from app.tracer.validate import find_entry_method, parse_input, validate_code


def build_trace(
    code: str,
    raw_input: dict[str, Any] | str,
    problem_id: str | None = None,
    templates: dict[int, dict[str, str]] | None = None,
    problem_meta: dict[str, str] | None = None,
    step_cap: int | None = None,
) -> TraceResponse:
    validate_code(code)
    kwargs = parse_input(raw_input)
    entry = find_entry_method(code)

    sandbox_kwargs: dict[str, Any] = {}
    if step_cap is not None:
        sandbox_kwargs["step_cap"] = step_cap
    raw = run_in_sandbox(code, kwargs, entry, **sandbox_kwargs)
    normalizer = Normalizer()

    steps_out: list[dict[str, Any]] = []
    prev_locals: dict[str, dict[str, Any]] = {}

    for i, raw_step in enumerate(raw.get("steps") or []):
        # Only keep line events for the stepper UX (still capture returns lightly)
        event = raw_step.get("event", "line")
        if event not in {"line", "return"}:
            continue

        normalizer.reset()  # fresh ids per step for clarity in MVP
        # Re-hydrate linked list markers into normalizer-friendly shapes
        locals_raw = _prepare_locals(raw_step.get("locals") or {})
        typed_locals = normalizer.normalize_locals(locals_raw)
        changes = diff_locals(prev_locals, typed_locals) if i > 0 or prev_locals else []
        # First step: treat all as added
        if not prev_locals and typed_locals:
            changes = [
                {
                    "name": name,
                    "before": None,
                    "after": typed_locals[name].get("value")
                    if typed_locals[name]["type"]
                    in {"int", "float", "bool", "str", "none"}
                    else typed_locals[name],
                    "kind": "added",
                }
                for name in sorted(typed_locals.keys())
            ]

        step_dict = {
            "index": len(steps_out),
            "line": raw_step.get("line", 0),
            "event": event,
            "frame": raw_step.get("frame", ""),
            "locals": typed_locals,
            "changes": changes,
            "stdout": raw_step.get("stdout") or "",
        }
        steps_out.append(step_dict)
        prev_locals = typed_locals

    annotate_steps(steps_out, templates, code=code)

    # Convert to pydantic models
    model_steps: list[Step] = []
    for s in steps_out:
        locals_models = {
            k: TypedValue(**v) if isinstance(v, dict) else TypedValue(type="unknown", value=v)
            for k, v in s["locals"].items()
        }
        changes_models = [Change(**c) for c in s["changes"]]
        explain = Explain(**s["explain"]) if s.get("explain") else None
        model_steps.append(
            Step(
                index=s["index"],
                line=s["line"],
                event=s["event"],
                frame=s["frame"],
                locals=locals_models,
                changes=changes_models,
                explain=explain,
                stdout=s.get("stdout", ""),
            )
        )

    return TraceResponse(
        schemaVersion=1,
        problem=problem_meta,
        code=code,
        input=kwargs,
        steps=model_steps,
        result=raw.get("result"),
        error=raw.get("error"),
        capped=bool(raw.get("capped")),
    )


def _prepare_locals(raw: dict[str, Any]) -> dict[str, Any]:
    prepared: dict[str, Any] = {}
    for k, v in raw.items():
        prepared[k] = _prepare_value(v)
    return prepared


def _prepare_value(v: Any) -> Any:
    if isinstance(v, dict) and v.get("__linked_list__"):
        return {
            "__linked_list__": True,
            "nodes": [n.get("val") for n in v.get("nodes", [])],
            "terminated": v.get("terminated", True),
        }
    if isinstance(v, dict) and v.get("__tree__"):
        nodes = []
        for n in v.get("nodes", []):
            if n is None:
                nodes.append(None)
            elif isinstance(n, dict) and "val" in n:
                nodes.append(
                    {"val": _prepare_value(n.get("val")), "cycle": n.get("cycle", False)}
                )
            else:
                nodes.append(_prepare_value(n))
        return {"__tree__": True, "nodes": nodes}
    if isinstance(v, dict) and v.get("__queue__"):
        return {
            "__queue__": True,
            "items": [_prepare_value(x) for x in v.get("items", [])],
        }
    if isinstance(v, dict) and v.get("__set__"):
        return {
            "__set__": True,
            "items": [_prepare_value(x) for x in v.get("items", [])],
        }
    if isinstance(v, dict) and v.get("__tuple__"):
        return {
            "__tuple__": True,
            "items": [_prepare_value(x) for x in v.get("items", [])],
        }
    if isinstance(v, dict) and v.get("__object__"):
        return v.get("fields", {})
    if isinstance(v, dict) and not any(key.startswith("__") for key in v.keys()):
        return {kk: _prepare_value(vv) for kk, vv in v.items()}
    if isinstance(v, list):
        return [_prepare_value(x) for x in v]
    return v
