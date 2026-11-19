from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field

from app.schemas.trace import ProblemSummary


class SceneFrame(BaseModel):
    array: list[Any] = Field(default_factory=list)
    pointers: dict[str, int] = Field(default_factory=dict)
    window: Optional[list[int]] = None  # [left, right] inclusive
    highlights: list[int] = Field(default_factory=list)
    counters: dict[str, Any] = Field(default_factory=dict)
    note: str = ""
    valid: Optional[bool] = None


class PatternSummary(BaseModel):
    id: str
    title: str
    blurb: str
    tags: list[str] = Field(default_factory=list)
    complexity: str = ""


class PatternDetail(PatternSummary):
    when: list[str] = Field(default_factory=list)
    whenNot: list[str] = Field(default_factory=list)
    telltales: list[str] = Field(default_factory=list)
    lesson: list[SceneFrame] = Field(default_factory=list)
    relatedProblems: list[ProblemSummary] = Field(default_factory=list)
