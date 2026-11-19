from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.languages import SUPPORTED_LANGUAGES
from app.patterns import get_pattern, list_patterns
from app.problems import get_problem, get_templates, list_problems
from app.schemas.patterns import PatternDetail, PatternSummary, SceneFrame
from app.schemas.trace import (
    ProblemDetail,
    ProblemExample,
    ProblemSummary,
    TraceError,
    TraceRequest,
    TraceResponse,
)
from app.tracer.pipeline import build_trace
from app.tracer.validate import ValidationError

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/api/v1/languages")
def languages() -> list[dict[str, str]]:
    return list(SUPPORTED_LANGUAGES.values())


@router.get("/api/v1/patterns", response_model=list[PatternSummary])
def patterns() -> list[PatternSummary]:
    return [PatternSummary(**p) for p in list_patterns()]


@router.get("/api/v1/patterns/{pattern_id}", response_model=PatternDetail)
def pattern_detail(pattern_id: str) -> PatternDetail:
    pack = get_pattern(pattern_id)
    if not pack:
        raise HTTPException(status_code=404, detail=f"Unknown pattern: {pattern_id}")
    return PatternDetail(
        id=pack["id"],
        title=pack["title"],
        blurb=pack["blurb"],
        tags=pack.get("tags", []),
        complexity=pack.get("complexity", ""),
        when=pack.get("when", []),
        whenNot=pack.get("whenNot", []),
        telltales=pack.get("telltales", []),
        lesson=[SceneFrame(**frame) for frame in pack.get("lesson", [])],
        relatedProblems=[
            ProblemSummary(**p) for p in pack.get("relatedProblems", [])
        ],
    )


@router.get("/api/v1/problems", response_model=list[ProblemSummary])
def problems(
    pattern: str | None = Query(default=None, description="Filter by pattern id"),
) -> list[ProblemSummary]:
    return [ProblemSummary(**p) for p in list_problems(pattern=pattern)]


@router.get("/api/v1/problems/{problem_id}", response_model=ProblemDetail)
def problem_detail(problem_id: str) -> ProblemDetail:
    pack = get_problem(problem_id)
    if not pack:
        raise HTTPException(status_code=404, detail=f"Unknown problem: {problem_id}")
    return ProblemDetail(
        id=pack["id"],
        title=pack["title"],
        description=pack["description"],
        rendererFocus=pack.get("rendererFocus", []),
        patterns=pack.get("patterns", []),
        starterCode=pack["starterCode"],
        examples=[ProblemExample(**ex) for ex in pack["examples"]],
    )


@router.post("/api/v1/trace", response_model=TraceResponse)
def trace(req: TraceRequest) -> TraceResponse:
    try:
        templates = get_templates(req.problemId)
        meta = None
        if req.problemId:
            pack = get_problem(req.problemId)
            if pack:
                meta = {"id": pack["id"], "title": pack["title"]}
        return build_trace(
            code=req.code,
            raw_input=req.input,
            problem_id=req.problemId,
            templates=templates,
            problem_meta=meta,
            language=req.language,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=TraceError(detail=e.message, code="validation_error").model_dump(),
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=TraceError(detail=str(e), code="trace_error").model_dump(),
        ) from e


@router.post("/api/v1/explain-templates")
def explain_templates_stub() -> None:
    """Reserved for future LLM template generation (not implemented in MVP)."""
    raise HTTPException(
        status_code=501,
        detail="LLM template generation is disabled in the MVP.",
    )
