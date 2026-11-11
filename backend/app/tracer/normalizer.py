from __future__ import annotations

from typing import Any


PRIMITIVE_TYPES = (int, float, bool, str, type(None))

STACK_NAMES = {
    "stack",
    "st",
    "stk",
    "mono",
    "monostack",
}
QUEUE_NAMES = {
    "queue",
    "q",
    "deque",
    "dq",
    "bfs",
}
HEAP_NAMES = {
    "heap",
    "pq",
    "minheap",
    "maxheap",
    "priority",
    "priorityqueue",
}


class Normalizer:
    """Convert Python values to JSON-safe typed payloads with stable object ids."""

    def __init__(self) -> None:
        self._next_id = 1
        self._ids: dict[int, int] = {}

    def reset(self) -> None:
        self._next_id = 1
        self._ids.clear()

    def _oid(self, obj: Any) -> int | None:
        if isinstance(obj, PRIMITIVE_TYPES):
            return None
        py_id = id(obj)
        if py_id not in self._ids:
            self._ids[py_id] = self._next_id
            self._next_id += 1
        return self._ids[py_id]

    def normalize(self, value: Any, depth: int = 0) -> dict[str, Any]:
        if depth > 40:
            return {"type": "truncated", "value": "..."}

        if value is None:
            return {"type": "none", "value": None}
        if isinstance(value, bool):
            return {"type": "bool", "value": value}
        if isinstance(value, int) and not isinstance(value, bool):
            return {"type": "int", "value": value}
        if isinstance(value, float):
            return {"type": "float", "value": value}
        if isinstance(value, str):
            display = value if len(value) <= 200 else value[:200] + "…"
            return {"type": "str", "value": display}

        if isinstance(value, dict) and value.get("__linked_list__"):
            nodes = []
            for item in (value.get("nodes") or [])[:50]:
                nodes.append({"val": self.normalize(item, depth + 1)})
            return {
                "type": "linked_list",
                "value": nodes,
                "terminated": bool(value.get("terminated", True)),
            }
        if isinstance(value, dict) and value.get("__tree__"):
            nodes = []
            for item in (value.get("nodes") or [])[:63]:
                if item is None:
                    nodes.append(None)
                elif isinstance(item, dict) and "val" in item:
                    nodes.append(
                        {
                            "val": self.normalize(item.get("val"), depth + 1),
                            "cycle": bool(item.get("cycle")),
                        }
                    )
                else:
                    nodes.append({"val": self.normalize(item, depth + 1)})
            return {"type": "tree", "value": nodes}
        if isinstance(value, dict) and value.get("__queue__"):
            items = [
                self.normalize(v, depth + 1) for v in (value.get("items") or [])[:50]
            ]
            return {"type": "queue", "value": items}
        if isinstance(value, dict) and value.get("__set__"):
            items = [
                self.normalize(v, depth + 1) for v in (value.get("items") or [])[:50]
            ]
            return {"type": "set", "value": items}
        if isinstance(value, dict) and value.get("__tuple__"):
            items = [
                self.normalize(v, depth + 1) for v in (value.get("items") or [])[:50]
            ]
            return {"type": "tuple", "value": items, "length": len(items)}

        if isinstance(value, set):
            items = [self.normalize(v, depth + 1) for v in list(value)[:50]]
            return {"type": "set", "value": items, "id": self._oid(value)}

        if isinstance(value, dict):
            pairs = []
            for i, (k, v) in enumerate(value.items()):
                if i >= 50:
                    break
                pairs.append(
                    {
                        "key": self.normalize(k, depth + 1),
                        "value": self.normalize(v, depth + 1),
                    }
                )
            return {"type": "dict", "value": pairs, "id": self._oid(value)}

        if isinstance(value, (list, tuple)):
            if _looks_like_matrix(value):
                rows = []
                for row in list(value)[:40]:
                    rows.append(
                        [self.normalize(cell, depth + 1) for cell in list(row)[:40]]
                    )
                return {
                    "type": "matrix",
                    "value": rows,
                    "rows": len(value),
                    "cols": len(value[0]) if value else 0,
                }
            items = [self.normalize(v, depth + 1) for v in list(value)[:50]]
            return {
                "type": "list" if isinstance(value, list) else "tuple",
                "value": items,
                "id": self._oid(value),
                "truncated": len(value) > 50,
                "length": len(value),
            }

        if hasattr(value, "val") and hasattr(value, "left") and hasattr(value, "right"):
            # Live tree (rare in-process path) — flatten to level-order marker
            nodes: list[Any] = []
            queue: list[Any] = [value]
            guard: set[int] = set()
            while queue and len(nodes) < 63:
                node = queue.pop(0)
                if node is None:
                    nodes.append(None)
                    continue
                if id(node) in guard:
                    nodes.append({"val": getattr(node, "val", None), "cycle": True})
                    continue
                guard.add(id(node))
                nodes.append({"val": getattr(node, "val", None)})
                queue.append(getattr(node, "left", None))
                queue.append(getattr(node, "right", None))
            while nodes and nodes[-1] is None:
                nodes.pop()
            return self.normalize({"__tree__": True, "nodes": nodes}, depth)

        if hasattr(value, "val") and hasattr(value, "next"):
            return self._normalize_linked_list(value, depth)

        if hasattr(value, "__dict__"):
            fields = {
                k: self.normalize(v, depth + 1)
                for k, v in list(vars(value).items())[:30]
                if not k.startswith("_")
            }
            return {
                "type": type(value).__name__,
                "value": fields,
                "id": self._oid(value),
            }

        return {"type": type(value).__name__, "value": repr(value)[:200]}

    def _normalize_linked_list(self, head: Any, depth: int) -> dict[str, Any]:
        nodes: list[dict[str, Any]] = []
        seen: set[int] = set()
        cur = head
        while cur is not None and id(cur) not in seen and len(nodes) < 50:
            seen.add(id(cur))
            nodes.append(
                {
                    "id": self._oid(cur),
                    "val": self.normalize(getattr(cur, "val", None), depth + 1),
                }
            )
            cur = getattr(cur, "next", None)
        return {
            "type": "linked_list",
            "value": nodes,
            "id": self._oid(head),
            "terminated": cur is None,
        }

    def normalize_locals(self, raw: dict[str, Any]) -> dict[str, dict[str, Any]]:
        out: dict[str, dict[str, Any]] = {}
        for name, value in raw.items():
            if name.startswith("__"):
                continue
            if name in {"self"}:
                continue
            try:
                typed = self.normalize(value)
                out[name] = _retag_by_name(name, typed)
            except Exception:
                out[name] = {"type": "error", "value": "<unreadable>"}
        return out


def _looks_like_matrix(value: Any) -> bool:
    if not isinstance(value, (list, tuple)) or not value:
        return False
    if not all(isinstance(row, (list, tuple)) for row in value):
        return False
    # Avoid treating list-of-pairs / tiny jagged noise as matrices unless rectangular-ish
    widths = {len(row) for row in value}
    if len(widths) != 1:
        return False
    width = next(iter(widths))
    if width == 0:
        return False
    # Single row of scalars is still an array; require 2+ rows OR wide grid
    if len(value) == 1 and width <= 2:
        return False
    # List of linked-list markers etc.
    return True


def _retag_by_name(name: str, typed: dict[str, Any]) -> dict[str, Any]:
    """Promote plain lists to stack/queue/heap when the variable name is a strong hint."""
    if typed.get("type") not in {"list", "tuple"}:
        return typed
    key = name.lower().replace("_", "")
    if key in STACK_NAMES or key.endswith("stack"):
        return {**typed, "type": "stack"}
    if key in QUEUE_NAMES or key.endswith("queue") or key.endswith("deque"):
        return {**typed, "type": "queue"}
    if key in HEAP_NAMES or key.endswith("heap") or "heap" in key or key.endswith("pq"):
        return {**typed, "type": "heap"}
    return typed


def plain_value(typed: dict[str, Any] | Any) -> Any:
    """Extract a JSON-comparable plain value from a typed payload."""
    if not isinstance(typed, dict) or "type" not in typed:
        return typed
    t = typed["type"]
    v = typed.get("value")
    if t in {"int", "float", "bool", "str", "none"}:
        return v
    if t in {"list", "tuple", "set", "stack", "queue", "heap"}:
        return [plain_value(x) for x in (v or [])]
    if t == "matrix":
        return [[plain_value(c) for c in (row or [])] for row in (v or [])]
    if t == "dict":
        return {
            str(plain_value(p["key"])): plain_value(p["value"]) for p in (v or [])
        }
    if t == "linked_list":
        return [plain_value(n.get("val")) for n in (v or [])]
    if t == "tree":
        out = []
        for n in v or []:
            if n is None:
                out.append(None)
            else:
                out.append(plain_value(n.get("val") if isinstance(n, dict) else n))
        return out
    return v
