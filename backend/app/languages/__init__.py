from __future__ import annotations

from typing import Literal

from .python_lang import (
    is_comment_or_blank_line,
    is_docstring_only_line,
    sanitize_pasted_code,
)

LanguageId = Literal["python", "javascript", "typescript", "java", "cpp", "go"]

SUPPORTED_LANGUAGES: dict[str, dict[str, str]] = {
    "python": {
        "id": "python",
        "label": "Python",
        "status": "supported",
        "monaco": "python",
    },
    "javascript": {
        "id": "javascript",
        "label": "JavaScript",
        "status": "coming_soon",
        "monaco": "javascript",
    },
    "typescript": {
        "id": "typescript",
        "label": "TypeScript",
        "status": "coming_soon",
        "monaco": "typescript",
    },
    "java": {
        "id": "java",
        "label": "Java",
        "status": "coming_soon",
        "monaco": "java",
    },
    "cpp": {
        "id": "cpp",
        "label": "C++",
        "status": "coming_soon",
        "monaco": "cpp",
    },
    "go": {
        "id": "go",
        "label": "Go",
        "status": "coming_soon",
        "monaco": "go",
    },
}


def normalize_language(language: str | None) -> LanguageId:
    lang = (language or "python").strip().lower()
    if lang in {"py", "python3"}:
        return "python"
    if lang in SUPPORTED_LANGUAGES:
        return lang  # type: ignore[return-value]
    return "python"


__all__ = [
    "LanguageId",
    "SUPPORTED_LANGUAGES",
    "normalize_language",
    "sanitize_pasted_code",
    "is_comment_or_blank_line",
    "is_docstring_only_line",
]
