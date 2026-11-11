from __future__ import annotations

import json
import multiprocessing as mp
import traceback
from typing import Any


DEFAULT_TIMEOUT_SEC = 5.0
DEFAULT_STEP_CAP = 5000


def _worker(
    code: str,
    kwargs: dict[str, Any],
    entry: tuple[str, str],
    step_cap: int,
    queue: mp.Queue,
) -> None:
    try:
        from app.tracer.runner import (
            TraceRunner,
            build_list_nodes,
            build_tree_nodes,
            list_nodes_to_array,
            tree_to_level_array,
        )

        call_kwargs = dict(kwargs)
        list_head_keys = set()
        tree_root_keys = set()
        for key, value in list(call_kwargs.items()):
            if key in {"head", "list1", "list2", "l1", "l2"} and isinstance(
                value, list
            ):
                list_head_keys.add(key)
                call_kwargs[key] = build_list_nodes(value)
            elif key in {"root", "tree"} and isinstance(value, list):
                tree_root_keys.add(key)
                call_kwargs[key] = build_tree_nodes(value)

        runner = TraceRunner(code, call_kwargs, entry, step_cap=step_cap)
        payload = runner.run()

        result = payload.get("result")
        if (
            hasattr(result, "val")
            and hasattr(result, "left")
            and hasattr(result, "right")
        ):
            payload["result"] = tree_to_level_array(result)
        elif hasattr(result, "val") and hasattr(result, "next"):
            payload["result"] = list_nodes_to_array(result)
        elif isinstance(result, dict) and result.get("__linked_list__"):
            payload["result"] = [n.get("val") for n in result.get("nodes", [])]
        elif isinstance(result, dict) and result.get("__tree__"):
            payload["result"] = [
                None if n is None else (n.get("val") if isinstance(n, dict) else n)
                for n in result.get("nodes", [])
            ]
        elif result is None and list_head_keys:
            payload["result"] = []
        elif result is None and tree_root_keys:
            payload["result"] = []

        queue.put({"ok": True, "payload": payload})
    except Exception:
        queue.put(
            {
                "ok": False,
                "payload": {
                    "steps": [],
                    "result": None,
                    "error": traceback.format_exc(limit=8),
                    "capped": False,
                },
            }
        )


def run_in_sandbox(
    code: str,
    kwargs: dict[str, Any],
    entry: tuple[str, str],
    step_cap: int = DEFAULT_STEP_CAP,
    timeout_sec: float = DEFAULT_TIMEOUT_SEC,
) -> dict[str, Any]:
    """Run the tracer in a child process with a wall-clock timeout."""
    ctx = mp.get_context("spawn")
    queue: mp.Queue = ctx.Queue()
    proc = ctx.Process(
        target=_worker,
        args=(code, kwargs, entry, step_cap, queue),
    )
    proc.start()
    proc.join(timeout=timeout_sec)

    if proc.is_alive():
        proc.terminate()
        proc.join(1)
        return {
            "steps": [],
            "result": None,
            "error": (
                f"Execution timed out after {timeout_sec:.0f}s. "
                "Simplify the input or check for infinite loops."
            ),
            "capped": True,
        }

    if queue.empty():
        return {
            "steps": [],
            "result": None,
            "error": "Tracer process exited without a result.",
            "capped": False,
        }

    message = queue.get()
    payload = message["payload"]

    # Ensure JSON-serializable (defensive)
    try:
        json.dumps(payload, default=str)
    except TypeError:
        payload["steps"] = []
        payload["error"] = "Trace contained non-serializable values."
    return payload
