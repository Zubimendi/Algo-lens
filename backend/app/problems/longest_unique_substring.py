PROBLEM = {
    "id": "longest-unique-substring",
    "title": "Longest Substring Without Repeating Characters",
    "description": (
        "Find the length of the longest substring without repeating characters "
        "using a sliding window and a last-seen index map."
    ),
    "rendererFocus": ["list", "dict"],
    "patterns": ["sliding_window"],
}

STARTER_CODE = '''class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last = {}
        left = 0
        best = 0
        for right, ch in enumerate(s):
            if ch in last and last[ch] >= left:
                left = last[ch] + 1
            last[ch] = right
            best = max(best, right - left + 1)
        return best
'''

EXAMPLES = [
    {
        "label": "Example 1",
        "input": {"s": "abcabcbb"},
        "expected": 3,
    },
    {
        "label": "Example 2",
        "input": {"s": "bbbbb"},
        "expected": 1,
    },
    {
        "label": "Example 3",
        "input": {"s": "pwwkew"},
        "expected": 3,
    },
    {
        "label": "Lesson string",
        "input": {"s": "abcab"},
        "expected": 3,
    },
]

TEMPLATES = {
    3: {
        "what": "Remember the last index of each character.",
        "withValuesTemplate": "last starts empty.",
        "why": "When a duplicate appears, jump left past its previous index.",
    },
    4: {
        "what": "Left edge of the current window.",
        "withValuesTemplate": "left={left}.",
        "why": "Everything from left to right must stay unique.",
    },
    5: {
        "what": "Track the best window length so far.",
        "withValuesTemplate": "best={best}.",
        "why": "The answer is the maximum valid window we ever saw.",
    },
    6: {
        "what": "Expand the right edge across the string.",
        "withValuesTemplate": "right={right}, ch={ch}.",
        "why": "Grow the window one character at a time.",
    },
    7: {
        "what": "If ch already sits inside the window, shrink from the left.",
        "withValuesTemplate": "ch={ch}, last.get(ch), left={left}.",
        "why": "Restoring uniqueness keeps the sliding-window invariant.",
    },
    8: {
        "what": "Move left past the previous occurrence of ch.",
        "withValuesTemplate": "left becomes {left}.",
        "why": "Drop every character before (and including) the old ch.",
    },
    9: {
        "what": "Record where we last saw this character.",
        "withValuesTemplate": "last[{ch}]={right}.",
        "why": "Future duplicates need this index to shrink correctly.",
    },
    10: {
        "what": "Update the best length for the current window.",
        "withValuesTemplate": "window length={right - left + 1}, best={best}.",
        "why": "Only valid windows contribute to the answer.",
    },
    11: {
        "what": "Return the longest unique window length.",
        "withValuesTemplate": "return {best}.",
        "why": "That is the length of the longest substring without repeats.",
    },
}
