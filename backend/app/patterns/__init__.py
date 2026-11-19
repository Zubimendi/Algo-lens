from __future__ import annotations

from typing import Any

from app.problems import list_problems

from . import sliding_window

_PACKS = {
    sliding_window.META["id"]: sliding_window,
}


def list_patterns() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for mod in _PACKS.values():
        meta = mod.META
        out.append(
            {
                "id": meta["id"],
                "title": meta["title"],
                "blurb": meta["blurb"],
                "tags": meta.get("tags", []),
                "complexity": meta.get("complexity", ""),
            }
        )
    return out


def get_pattern(pattern_id: str) -> dict[str, Any] | None:
    mod = _PACKS.get(pattern_id)
    if not mod:
        return None
    meta = mod.META
    related = [
        p for p in list_problems() if pattern_id in p.get("patterns", [])
    ]
    return {
        "id": meta["id"],
        "title": meta["title"],
        "blurb": meta["blurb"],
        "tags": meta.get("tags", []),
        "complexity": meta.get("complexity", ""),
        "when": meta.get("when", []),
        "whenNot": meta.get("whenNot", []),
        "telltales": meta.get("telltales", []),
        "lesson": list(mod.LESSON),
        "relatedProblems": related,
    }
