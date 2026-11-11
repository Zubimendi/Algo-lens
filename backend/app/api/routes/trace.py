from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.problems import get_problem, get_templates, list_problems
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


@router.get("/api/v1/problems", response_model=list[ProblemSummary])
def problems() -> list[ProblemSummary]:
    return [ProblemSummary(**p) for p in list_problems()]


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
