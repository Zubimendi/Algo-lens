from __future__ import annotations

import io
import sys
import traceback
from collections import deque
from contextlib import redirect_stdout
from typing import Any, Callable


DEFAULT_STEP_CAP = 5000


class StepCapExceeded(Exception):
    pass


class TraceRunner:
    """Execute user code with sys.settrace and capture per-line snapshots."""

    def __init__(
        self,
        code: str,
        kwargs: dict[str, Any],
        entry: tuple[str, str],
        step_cap: int = DEFAULT_STEP_CAP,
    ) -> None:
        self.code = code
        self.kwargs = kwargs
        self.entry = entry
        self.step_cap = step_cap
        self.raw_steps: list[dict[str, Any]] = []
        self.result: Any = None
        self.error: str | None = None
        self.capped = False
        self._stdout_buf = io.StringIO()
        self._user_code_lines: set[int] = set()
        self._tracing = False

    def run(self) -> dict[str, Any]:
        namespace: dict[str, Any] = {"__name__": "__traced__"}
        # Helpers for common LeetCode node types (user code may also define its own)
        namespace["ListNode"] = _ListNode
        namespace["TreeNode"] = _TreeNode
        namespace["deque"] = deque

        try:
            compiled = compile(self.code, "<user>", "exec")
        except SyntaxError as e:
            return {
                "steps": [],
                "result": None,
                "error": f"Syntax error at line {e.lineno}: {e.msg}",
                "capped": False,
            }

        # Map which lines belong to user code
        for i, _ in enumerate(self.code.splitlines(), start=1):
            self._user_code_lines.add(i)

        try:
            exec(compiled, namespace, namespace)
        except Exception as e:
            return {
                "steps": [],
                "result": None,
                "error": f"Error loading code: {e}",
                "capped": False,
            }

        target = self._resolve_callable(namespace)
        if target is None:
            return {
                "steps": [],
                "result": None,
                "error": "Could not resolve entry function to call.",
                "capped": False,
            }

        def tracer(frame, event, arg):  # noqa: ANN001
            if not self._tracing:
                return tracer
            if frame.f_code.co_filename != "<user>":
                return tracer
            if event not in {"line", "return", "call", "exception"}:
                return tracer

            if len(self.raw_steps) >= self.step_cap:
                self.capped = True
                raise StepCapExceeded(
                    f"Stopped after {self.step_cap} steps (safety cap)."
                )

            locals_copy = {
                k: v
                for k, v in frame.f_locals.items()
                if not k.startswith("__") and k != "self"
            }
            # Deep-ish snapshot via later normalizer; store shallow refs carefully
            # by copying containers at capture time using a safe repr strategy.
            snapshot_locals = _safe_snapshot(locals_copy)

            step = {
                "line": frame.f_lineno,
                "event": event,
                "frame": frame.f_code.co_name,
                "locals": snapshot_locals,
                "stdout": self._stdout_buf.getvalue(),
            }
            if event == "return":
                step["return_value"] = _safe_snapshot({"__return__": arg}).get(
                    "__return__"
                )
            self.raw_steps.append(step)
            return tracer

        self._tracing = True
        sys.settrace(tracer)
        try:
            with redirect_stdout(self._stdout_buf):
                self.result = target(**self.kwargs)
        except StepCapExceeded as e:
            self.error = str(e)
            self.capped = True
        except Exception:
            self.error = traceback.format_exc(limit=5)
        finally:
            sys.settrace(None)
            self._tracing = False

        return {
            "steps": self.raw_steps,
            "result": _safe_snapshot({"r": self.result}).get("r"),
            "error": self.error,
            "capped": self.capped,
        }

    def _resolve_callable(self, namespace: dict[str, Any]) -> Callable[..., Any] | None:
        kind, name = self.entry
        if kind == "method":
            cls = namespace.get("Solution")
            if cls is None:
                return None
            instance = cls()
            method = getattr(instance, name, None)
            return method
        fn = namespace.get(name)
        return fn if callable(fn) else None


class _ListNode:
    def __init__(self, val: Any = 0, next: "_ListNode | None" = None) -> None:
        self.val = val
        self.next = next

    def __repr__(self) -> str:
        return f"ListNode({self.val})"


class _TreeNode:
    def __init__(
        self,
        val: Any = 0,
        left: "_TreeNode | None" = None,
        right: "_TreeNode | None" = None,
    ) -> None:
        self.val = val
        self.left = left
        self.right = right

    def __repr__(self) -> str:
        return f"TreeNode({self.val})"


def _snapshot_tree(root: Any, depth: int, seen: set[int]) -> dict[str, Any]:
    """Serialize a binary tree as level-order nodes (None holes included until trailing)."""
    if root is None:
        return {"__tree__": True, "nodes": []}
    levels: list[Any] = []
    queue: list[Any] = [root]
    guard: set[int] = set()
    while queue and len(levels) < 63:
        node = queue.pop(0)
        if node is None:
            levels.append(None)
            continue
        nid = id(node)
        if nid in guard:
            levels.append({"val": getattr(node, "val", None), "cycle": True})
            continue
        guard.add(nid)
        levels.append(
            {"val": _safe_snapshot(getattr(node, "val", None), depth + 1, seen)}
        )
        queue.append(getattr(node, "left", None))
        queue.append(getattr(node, "right", None))
    while levels and levels[-1] is None:
        levels.pop()
    return {"__tree__": True, "nodes": levels}


def _safe_snapshot(obj: Any, depth: int = 0, seen: set[int] | None = None) -> Any:
    """Copy values into JSON-ish Python structures for later normalization."""
    if seen is None:
        seen = set()
    if depth > 30:
        return "..."
    if obj is None or isinstance(obj, (bool, int, float, str)):
        return obj
    oid = id(obj)
    if oid in seen:
        return "<cycle>"
    if isinstance(obj, dict):
        seen.add(oid)
        return {
            str(k): _safe_snapshot(v, depth + 1, seen)
            for k, v in list(obj.items())[:100]
        }
    if isinstance(obj, deque):
        seen.add(oid)
        return {
            "__queue__": True,
            "items": [_safe_snapshot(v, depth + 1, seen) for v in list(obj)[:100]],
        }
    if isinstance(obj, set):
        seen.add(oid)
        return {
            "__set__": True,
            "items": [_safe_snapshot(v, depth + 1, seen) for v in list(obj)[:100]],
        }
    if isinstance(obj, (list, tuple)):
        seen.add(oid)
        seq = [_safe_snapshot(v, depth + 1, seen) for v in list(obj)[:100]
        ]
        return {"__tuple__": True, "items": seq} if isinstance(obj, tuple) else seq
    # Tree before list-node: TreeNode has left/right; ListNode has next
    if isinstance(obj, _TreeNode) or (
        hasattr(obj, "val")
        and hasattr(obj, "left")
        and hasattr(obj, "right")
        and not hasattr(obj, "next")
    ):
        seen.add(oid)
        return _snapshot_tree(obj, depth, seen)
    if isinstance(obj, _ListNode) or (
        hasattr(obj, "val") and hasattr(obj, "next") and not hasattr(obj, "left")
    ):
        seen.add(oid)
        nodes = []
        cur = obj
        guard: set[int] = set()
        while cur is not None and id(cur) not in guard and len(nodes) < 50:
            guard.add(id(cur))
            nodes.append({"val": getattr(cur, "val", None), "__list_node__": True})
            cur = getattr(cur, "next", None)
        return {"__linked_list__": True, "nodes": nodes, "terminated": cur is None}
    if hasattr(obj, "__dict__"):
        seen.add(oid)
        return {
            "__object__": type(obj).__name__,
            "fields": {
                k: _safe_snapshot(v, depth + 1, seen)
                for k, v in list(vars(obj).items())[:50]
                if not k.startswith("_")
            },
        }
    try:
        return repr(obj)[:200]
    except Exception:
        return "<unreadable>"


def build_list_nodes(values: list[Any]) -> _ListNode | None:
    dummy = _ListNode(0)
    cur = dummy
    for v in values:
        cur.next = _ListNode(v)
        cur = cur.next
    return dummy.next


def list_nodes_to_array(head: Any) -> list[Any]:
    out = []
    cur = head
    seen: set[int] = set()
    while cur is not None and id(cur) not in seen and len(out) < 100:
        seen.add(id(cur))
        out.append(getattr(cur, "val", None))
        cur = getattr(cur, "next", None)
    return out


def build_tree_nodes(values: list[Any]) -> _TreeNode | None:
    """Build a binary tree from a level-order list (LeetCode style, nulls as None)."""
    if not values:
        return None
    root = _TreeNode(values[0])
    queue: list[_TreeNode] = [root]
    i = 1
    while queue and i < len(values):
        node = queue.pop(0)
        if i < len(values) and values[i] is not None:
            node.left = _TreeNode(values[i])
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = _TreeNode(values[i])
            queue.append(node.right)
        i += 1
    return root


def tree_to_level_array(root: Any) -> list[Any]:
    if root is None:
        return []
    out: list[Any] = []
    queue: list[Any] = [root]
    while queue:
        node = queue.pop(0)
        if node is None:
            out.append(None)
            continue
        out.append(getattr(node, "val", None))
        queue.append(getattr(node, "left", None))
        queue.append(getattr(node, "right", None))
    while out and out[-1] is None:
        out.pop()
    return out
