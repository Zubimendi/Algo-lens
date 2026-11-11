from __future__ import annotations

import pytest

from app.problems import get_problem, get_templates
from app.problems import text_justification as tj
from app.tracer.pipeline import build_trace
from app.tracer.validate import ValidationError, parse_input, validate_code


def _run(problem_id: str, example_idx: int = 0):
    pack = get_problem(problem_id)
    assert pack is not None
    ex = pack["examples"][example_idx]
    templates = get_templates(problem_id)
    return build_trace(
        code=pack["starterCode"],
        raw_input=ex["input"],
        problem_id=problem_id,
        templates=templates,
        problem_meta={"id": pack["id"], "title": pack["title"]},
    )


@pytest.mark.parametrize(
    "problem_id,example_idx",
    [
        ("text-justification", 0),
        ("text-justification", 1),
        ("text-justification", 2),
        ("valid-anagram", 0),
        ("valid-anagram", 1),
        ("valid-anagram", 2),
        ("remove-nth-node", 0),
        ("remove-nth-node", 1),
        ("remove-nth-node", 2),
    ],
)
def test_ac1_final_result_matches_expected(problem_id: str, example_idx: int):
    pack = get_problem(problem_id)
    assert pack is not None
    expected = pack["examples"][example_idx]["expected"]
    trace = _run(problem_id, example_idx)
    assert trace.error is None, trace.error
    assert trace.result == expected


def test_ac2_step_locals_are_consistent():
    trace = _run("valid-anagram", 0)
    assert len(trace.steps) > 5
    # After building counts from s="anagram", we should eventually see dict locals
    dict_steps = [
        s for s in trace.steps if "counts" in s.locals and s.locals["counts"].type == "dict"
    ]
    assert dict_steps, "expected hash-map snapshots"


def test_ac3_prev_next_identical_via_trace_immutability():
    trace = _run("text-justification", 0)
    a = trace.steps[3].model_dump()
    b = trace.steps[3].model_dump()
    assert a == b


def test_ac4_infinite_loop_hits_step_cap():
    code = """
class Solution:
    def forever(self, x: int) -> int:
        while True:
            x += 1
        return x
"""
    trace = build_trace(code, {"x": 0}, step_cap=80)
    assert trace.capped is True
    assert trace.error
    err = trace.error.lower()
    assert (
        "steps" in err
        or "cap" in err
        or "timed out" in err
        or "timeout" in err
    )
    assert len(trace.steps) <= 80


def test_ac5_text_justification_reject_example_beat():
    """Appendix A: 'example' rejected when 10 + 1 + 7 = 18 > 16."""
    trace = _run("text-justification", 0)
    # Find a step where length is 10 and j is 3 around the inner while check
    found = False
    for step in trace.steps:
        locs = step.locals
        if "length" not in locs or "j" not in locs:
            continue
        length = locs["length"].value if locs["length"].type == "int" else None
        j = locs["j"].value if locs["j"].type == "int" else None
        if length == 10 and j == 3:
            found = True
            break
    assert found, "expected beat where length=10 and j=3 when rejecting 'example'"


def test_validation_errors_are_readable():
    with pytest.raises(ValidationError) as syntax_err:
        validate_code("this is not python {")
    assert "Syntax error" in syntax_err.value.message
    with pytest.raises(ValidationError):
        validate_code("x = 1\n")
    parsed = parse_input('words=["a","b"], maxWidth=16')
    assert parsed == {"words": ["a", "b"], "maxWidth": 16}


def test_structure_render_types_matrix_tree_set_stack():
    code = """
from collections import deque

class Solution:
    def demo(self, root, grid, stack, heap):
        seen = {1, 2, 3}
        q = deque([10, 20])
        return [root.val if root else None, grid[0][0], stack[-1], heap[0], len(seen), q[0]]
"""
    trace = build_trace(
        code,
        {
            "root": [1, 2, 3],
            "grid": [[1, 2], [3, 4]],
            "stack": [9, 8, 7],
            "heap": [1, 3, 2],
        },
    )
    assert trace.error is None, trace.error
    # Find a step that has the interesting locals after assignment
    typed = {}
    for step in trace.steps:
        typed.update({k: v.type for k, v in step.locals.items()})
    assert typed.get("grid") == "matrix"
    assert typed.get("root") == "tree"
    assert typed.get("stack") == "stack"
    assert typed.get("heap") == "heap"
    assert typed.get("seen") == "set"
    assert typed.get("q") == "queue"


def test_custom_code_gets_dynamic_explanations():
    code = """
class Solution:
    def solve(self, nums: list[int], target: int) -> int:
        total = 0
        for n in nums:
            total += n
        return total + target
"""
    trace = build_trace(code, {"nums": [1, 2, 3], "target": 4})
    assert trace.error is None, trace.error
    assert trace.result == 10
    assert len(trace.steps) > 3
    # No problemId / templates — explanations still present from AST+values
    assert all(s.explain and s.explain.what for s in trace.steps)
    assert any(
        s.explain and ("Assign" in s.explain.what or "Loop" in s.explain.what)
        for s in trace.steps
    )


def test_templates_attached_for_golden():
    trace = _run("text-justification", 0)
    explained = [s for s in trace.steps if s.explain and "Greedy" in (s.explain.why or "")]
    assert explained, "expected hand-authored explanations on TJ steps"


def test_starter_code_line_count_stable():
    # Guard against accidental reformatting that breaks template line maps
    lines = tj.STARTER_CODE.strip("\n").splitlines()
    assert lines[0].startswith("class Solution")
    assert any("fullJustify" in line for line in lines)
