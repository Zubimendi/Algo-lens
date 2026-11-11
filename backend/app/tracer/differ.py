from __future__ import annotations

from typing import Any

from .normalizer import plain_value


def diff_locals(
    before: dict[str, dict[str, Any]],
    after: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    changes: list[dict[str, Any]] = []
    before_keys = set(before.keys())
    after_keys = set(after.keys())

    for name in sorted(after_keys - before_keys):
        changes.append(
            {
                "name": name,
                "before": None,
                "after": plain_value(after[name]),
                "kind": "added",
            }
        )

    for name in sorted(before_keys - after_keys):
        changes.append(
            {
                "name": name,
                "before": plain_value(before[name]),
                "after": None,
                "kind": "removed",
            }
        )

    for name in sorted(before_keys & after_keys):
        b = plain_value(before[name])
        a = plain_value(after[name])
        if b != a:
            changes.append(
                {
                    "name": name,
                    "before": b,
                    "after": a,
                    "kind": "changed",
                }
            )

    return changes
