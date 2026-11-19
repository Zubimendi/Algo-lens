from __future__ import annotations

from typing import Any

from . import (
    longest_unique_substring,
    max_sum_subarray_k,
    remove_nth_node,
    text_justification,
    valid_anagram,
)

_PACKS = {
    text_justification.PROBLEM["id"]: text_justification,
    valid_anagram.PROBLEM["id"]: valid_anagram,
    remove_nth_node.PROBLEM["id"]: remove_nth_node,
    longest_unique_substring.PROBLEM["id"]: longest_unique_substring,
    max_sum_subarray_k.PROBLEM["id"]: max_sum_subarray_k,
}


def list_problems(pattern: str | None = None) -> list[dict[str, Any]]:
    problems = [mod.PROBLEM for mod in _PACKS.values()]
    if pattern:
        problems = [p for p in problems if pattern in p.get("patterns", [])]
    return problems


def get_problem(problem_id: str) -> dict[str, Any] | None:
    mod = _PACKS.get(problem_id)
    if not mod:
        return None
    return {
        **mod.PROBLEM,
        "starterCode": mod.STARTER_CODE,
        "examples": mod.EXAMPLES,
        "templates": getattr(mod, "TEMPLATES", {}),
    }


def get_templates(problem_id: str | None) -> dict[int, dict[str, str]] | None:
    if not problem_id:
        return None
    mod = _PACKS.get(problem_id)
    if not mod:
        return None
    return getattr(mod, "TEMPLATES", None)
