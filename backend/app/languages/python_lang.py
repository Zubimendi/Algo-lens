from __future__ import annotations

import re


_FENCE_RE = re.compile(
    r"^\s*```(?:python|py|python3)?\s*\n([\s\S]*?)\n```\s*$",
    re.IGNORECASE,
)
_LEADING_FENCE_RE = re.compile(r"^\s*```(?:python|py|python3)?\s*\n", re.IGNORECASE)
_TRAILING_FENCE_RE = re.compile(r"\n```\s*$")


def sanitize_pasted_code(code: str) -> str:
    """Normalize pasted code: strip markdown fences and odd BOM/whitespace."""
    text = code.replace("\ufeff", "").replace("\r\n", "\n").replace("\r", "\n")
    text = text.strip("\n")

    m = _FENCE_RE.match(text)
    if m:
        return m.group(1).rstrip() + "\n"

    # Partial fence paste (opening and/or closing only)
    if _LEADING_FENCE_RE.match(text):
        text = _LEADING_FENCE_RE.sub("", text, count=1)
    if _TRAILING_FENCE_RE.search(text):
        text = _TRAILING_FENCE_RE.sub("", text)

    return text if text.endswith("\n") or not text else text + "\n"


def is_comment_or_blank_line(line: str) -> bool:
    stripped = line.strip()
    return not stripped or stripped.startswith("#")


def is_docstring_only_line(line: str) -> bool:
    """True when the line is only a string literal (typical docstring body/open)."""
    stripped = line.strip()
    if len(stripped) >= 3 and stripped[:3] in {'"""', "'''"}:
        return True
    if len(stripped) >= 6 and (
        (stripped.startswith('"""') and stripped.endswith('"""'))
        or (stripped.startswith("'''") and stripped.endswith("'''"))
    ):
        return True
    # Single-line string expression used as a docstring
    if (stripped.startswith('"') and stripped.endswith('"')) or (
        stripped.startswith("'") and stripped.endswith("'")
    ):
        return True
    return False
