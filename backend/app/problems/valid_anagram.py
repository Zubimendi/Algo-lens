PROBLEM = {
    "id": "valid-anagram",
    "title": "Valid Anagram",
    "description": "Check whether two strings are anagrams using a frequency hash map.",
    "rendererFocus": ["dict"],
}

STARTER_CODE = '''class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        counts = {}
        for ch in s:
            counts[ch] = counts.get(ch, 0) + 1
        for ch in t:
            if ch not in counts:
                return False
            counts[ch] -= 1
            if counts[ch] == 0:
                del counts[ch]
        return len(counts) == 0
'''

EXAMPLES = [
    {
        "label": "Example 1",
        "input": {"s": "anagram", "t": "nagaram"},
        "expected": True,
    },
    {
        "label": "Example 2",
        "input": {"s": "rat", "t": "car"},
        "expected": False,
    },
    {
        "label": "Example 3",
        "input": {"s": "a", "t": "ab"},
        "expected": False,
    },
]

TEMPLATES = {
    3: {
        "what": "Quick reject when lengths differ.",
        "withValuesTemplate": "len(s)={len(s)}, len(t)={len(t)}.",
        "why": "Anagrams must contain the same number of characters.",
    },
    5: {
        "what": "Create an empty frequency map.",
        "withValuesTemplate": "counts starts as {counts}.",
        "why": "We will count how often each character appears in s.",
    },
    6: {
        "what": "Walk every character of s.",
        "withValuesTemplate": "Looking at ch={ch}.",
        "why": "Build the frequency table for the first string.",
    },
    7: {
        "what": "Increment the count for this character.",
        "withValuesTemplate": "counts[{ch}] becomes {counts.get(ch, 0)}.",
        "why": "Record one more occurrence of ch.",
    },
    8: {
        "what": "Walk every character of t.",
        "withValuesTemplate": "Looking at ch={ch}.",
        "why": "Consume the frequencies using the second string.",
    },
    9: {
        "what": "Reject if t has a character s never had.",
        "withValuesTemplate": "Is {ch} missing from counts?",
        "why": "Extra characters mean not an anagram.",
    },
    11: {
        "what": "Decrement the remaining count.",
        "withValuesTemplate": "counts[{ch}] decreases.",
        "why": "Match one occurrence from s with one from t.",
    },
    12: {
        "what": "Remove keys that hit zero.",
        "withValuesTemplate": "If counts[{ch}] is 0, delete the key.",
        "why": "Keeps the map showing only leftover characters.",
    },
    14: {
        "what": "Success only if nothing is left over.",
        "withValuesTemplate": "len(counts) == 0 → {len(counts) == 0}.",
        "why": "An empty map means every count was paired off.",
    },
}
