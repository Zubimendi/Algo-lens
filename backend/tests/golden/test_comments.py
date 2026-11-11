from app.languages.python_lang import sanitize_pasted_code
from app.tracer.pipeline import build_trace
from app.tracer.validate import validate_code


def test_inline_and_full_line_comments_trace():
    code = '''class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # build a hashmap of value -> index
        seen = {}
        for i, n in enumerate(nums):  # scan once
            need = target - n
            if need in seen:
                return [seen[need], i]
            seen[n] = i  # remember this number
        return []
'''
    trace = build_trace(code, {"nums": [2, 7, 11, 15], "target": 9})
    assert trace.error is None, trace.error
    assert trace.result == [0, 1]
    assert len(trace.steps) > 5


def test_docstring_does_not_break_trace():
    code = '''class Solution:
    def add(self, a: int, b: int) -> int:
        """Add two numbers."""
        # comment before work
        total = a + b
        return total
'''
    trace = build_trace(code, {"a": 2, "b": 3})
    assert trace.error is None, trace.error
    assert trace.result == 5


def test_markdown_fence_is_stripped():
    fenced = """```python
class Solution:
    def add(self, a: int, b: int) -> int:
        return a + b
```"""
    cleaned = sanitize_pasted_code(fenced)
    validate_code(cleaned)
    trace = build_trace(cleaned, {"a": 1, "b": 2})
    assert trace.result == 3


def test_hash_inside_string_is_not_a_comment():
    code = '''class Solution:
    def tag(self, s: str) -> str:
        return s + " # not a comment"
'''
    trace = build_trace(code, {"s": "x"})
    assert trace.error is None, trace.error
    assert trace.result == "x # not a comment"
