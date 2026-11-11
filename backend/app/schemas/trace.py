from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class TypedValue(BaseModel):
    type: str
    value: Any
    id: Optional[int] = None


class Change(BaseModel):
    name: str
    before: Any = None
    after: Any = None
    kind: Literal["changed", "added", "removed"] = "changed"


class ConditionPart(BaseModel):
    text: str
    result: bool
    evaluated: Optional[str] = None


class Condition(BaseModel):
    expr: str
    parts: list[ConditionPart] = Field(default_factory=list)
    result: bool


class Explain(BaseModel):
    what: str
    withValues: str
    why: str


class Step(BaseModel):
    index: int
    line: int
    event: str = "line"
    frame: str = ""
    locals: dict[str, TypedValue] = Field(default_factory=dict)
    changes: list[Change] = Field(default_factory=list)
    condition: Optional[Condition] = None
    explain: Optional[Explain] = None
    stdout: str = ""


class TraceRequest(BaseModel):
    code: str
    input: dict[str, Any] | str = Field(default_factory=dict)
    problemId: Optional[str] = None
    language: str = "python"


class TraceResponse(BaseModel):
    schemaVersion: int = 1
    problem: Optional[dict[str, str]] = None
    language: str = "python"
    code: str
    input: dict[str, Any]
    steps: list[Step]
    result: Any = None
    error: Optional[str] = None
    capped: bool = False


class TraceError(BaseModel):
    detail: str
    code: str = "trace_error"


class ProblemExample(BaseModel):
    label: str
    input: dict[str, Any]
    expected: Any = None


class ProblemSummary(BaseModel):
    id: str
    title: str
    description: str
    rendererFocus: list[str] = Field(default_factory=list)


class ProblemDetail(ProblemSummary):
    starterCode: str
    examples: list[ProblemExample] = Field(default_factory=list)
