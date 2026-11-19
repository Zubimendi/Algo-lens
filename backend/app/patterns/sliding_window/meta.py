META = {
    "id": "sliding_window",
    "title": "Sliding Window",
    "blurb": "Grow and shrink a contiguous range while tracking an invariant — often O(n) instead of nested loops.",
    "tags": ["arrays", "strings", "two-pointers"],
    "complexity": "Usually O(n) time, O(k) extra space",
    "when": [
        "You need the longest/shortest contiguous subarray or substring that satisfies a condition.",
        "The answer is always a contiguous segment of the input.",
        "Expanding the right side adds information and shrinking the left can restore a valid state.",
    ],
    "whenNot": [
        "The answer is not contiguous (subsequences, permutations of non-adjacent picks).",
        "You need every combination of indices, not a moving range.",
        "Binary search on sorted values is a better fit than scanning a window.",
    ],
    "telltales": [
        "Prompt says subarray / substring / contiguous.",
        "Constraints hint at O(n) and a naive O(n²) double loop feels natural.",
        "You maintain a running sum, set, or frequency map of the current range.",
    ],
}
