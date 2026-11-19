PROBLEM = {
    "id": "max-sum-subarray-k",
    "title": "Maximum Sum of Subarray of Size K",
    "description": (
        "Find the maximum sum of any contiguous subarray of length k "
        "using a fixed-size sliding window."
    ),
    "rendererFocus": ["list"],
    "patterns": ["sliding_window"],
}

STARTER_CODE = '''class Solution:
    def maxSum(self, nums: list[int], k: int) -> int:
        if k <= 0 or k > len(nums):
            return 0
        window = sum(nums[:k])
        best = window
        for i in range(k, len(nums)):
            window += nums[i] - nums[i - k]
            best = max(best, window)
        return best
'''

EXAMPLES = [
    {
        "label": "Example 1",
        "input": {"nums": [2, 1, 5, 1, 3, 2], "k": 3},
        "expected": 9,
    },
    {
        "label": "Example 2",
        "input": {"nums": [2, 3, 4, 1, 5], "k": 2},
        "expected": 7,
    },
    {
        "label": "Example 3",
        "input": {"nums": [1, 2, 3], "k": 3},
        "expected": 6,
    },
]

TEMPLATES = {
    3: {
        "what": "Reject impossible window sizes.",
        "withValuesTemplate": "k={k}, len(nums)={len(nums)}.",
        "why": "A fixed window cannot be larger than the array.",
    },
    5: {
        "what": "Seed the window with the first k elements.",
        "withValuesTemplate": "window={window}.",
        "why": "Fixed windows start full; later steps only slide.",
    },
    6: {
        "what": "Remember the best sum so far.",
        "withValuesTemplate": "best={best}.",
        "why": "We will compare every window sum against this.",
    },
    7: {
        "what": "Slide the right edge forward.",
        "withValuesTemplate": "i={i}, nums[i]={nums[i]}.",
        "why": "Each step adds one new element on the right.",
    },
    8: {
        "what": "Add the new right value and drop the leaving left value.",
        "withValuesTemplate": "window becomes {window}.",
        "why": "O(1) update keeps the whole scan O(n).",
    },
    9: {
        "what": "Keep the maximum window sum.",
        "withValuesTemplate": "best={best}.",
        "why": "The answer is the largest sum among all size-k windows.",
    },
    10: {
        "what": "Return the maximum sum.",
        "withValuesTemplate": "return {best}.",
        "why": "That is the best fixed window of length k.",
    },
}
