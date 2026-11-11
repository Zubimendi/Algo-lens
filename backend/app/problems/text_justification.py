PROBLEM = {
    "id": "text-justification",
    "title": "Text Justification",
    "description": "Pack words into lines of exact width with greedy fitting and space distribution.",
    "rendererFocus": ["array", "pointers"],
}

STARTER_CODE = '''class Solution:
    def fullJustify(self, words: list[str], maxWidth: int) -> list[str]:
        n = len(words)
        i = 0
        result = []
        while i < n:
            j = i + 1
            length = len(words[i])
            while j < n and length + 1 + len(words[j]) <= maxWidth:
                length += 1 + len(words[j])
                j += 1
            line_words = words[i:j]
            if j >= n or len(line_words) == 1:
                line = " ".join(line_words)
                line += " " * (maxWidth - len(line))
            else:
                spaces = maxWidth - sum(len(w) for w in line_words)
                gaps = len(line_words) - 1
                base, extra = divmod(spaces, gaps)
                parts = []
                for k in range(gaps):
                    parts.append(line_words[k])
                    parts.append(" " * (base + (1 if k < extra else 0)))
                parts.append(line_words[-1])
                line = "".join(parts)
            result.append(line)
            i = j
        return result
'''

EXAMPLES = [
    {
        "label": "Example 1 (width 16)",
        "input": {
            "words": ["This", "is", "an", "example", "of", "text", "justification."],
            "maxWidth": 16,
        },
        "expected": [
            "This    is    an",
            "example  of text",
            "justification.  ",
        ],
    },
    {
        "label": "Example 2",
        "input": {
            "words": ["What", "must", "be", "acknowledgment", "shall", "be"],
            "maxWidth": 16,
        },
        "expected": [
            "What   must   be",
            "acknowledgment  ",
            "shall be        ",
        ],
    },
    {
        "label": "Example 3",
        "input": {
            "words": [
                "Science",
                "is",
                "what",
                "we",
                "understand",
                "well",
                "enough",
                "to",
                "explain",
                "to",
                "a",
                "computer.",
                "Art",
                "is",
                "everything",
                "else",
                "we",
                "do",
            ],
            "maxWidth": 20,
        },
        "expected": [
            "Science  is  what we",
            "understand      well",
            "enough to explain to",
            "a  computer.  Art is",
            "everything  else  we",
            "do                  ",
        ],
    },
]

# Line numbers refer to STARTER_CODE (1-indexed)
TEMPLATES = {
    3: {
        "what": "Remember how many words we have.",
        "withValuesTemplate": "n becomes {n}, the number of words.",
        "why": "We need a stop condition for the outer walk.",
    },
    4: {
        "what": "Start the outer pointer at the first word.",
        "withValuesTemplate": "i is set to {i}.",
        "why": "i marks the start of the current line's word range.",
    },
    5: {
        "what": "Prepare an empty list for finished lines.",
        "withValuesTemplate": "result starts as {result}.",
        "why": "Each justified line will be appended here.",
    },
    6: {
        "what": "Keep building lines while unused words remain.",
        "withValuesTemplate": "Check i < n → {i} < {n}.",
        "why": "Outer loop walks through the whole word list.",
    },
    7: {
        "what": "Start the end pointer just after i.",
        "withValuesTemplate": "j starts at i + 1 = {j}.",
        "why": "j will grow while words still fit on this line.",
    },
    8: {
        "what": "Seed the line length with the first word.",
        "withValuesTemplate": "length starts as len(words[i]) = {length}.",
        "why": "Greedy packing needs a running character count.",
    },
    9: {
        "what": "Check whether the next word still fits.",
        "withValuesTemplate": "Ask if word at j fits given length={length}, maxWidth={maxWidth}.",
        "why": "Greedy rule: keep adding words while they fit.",
    },
    10: {
        "what": "Add a space and the next word to the running length.",
        "withValuesTemplate": "length grows to {length}.",
        "why": "Account for the mandatory single space between words.",
    },
    11: {
        "what": "Advance the end pointer.",
        "withValuesTemplate": "j becomes {j}.",
        "why": "Include this word in the current line range [i, j).",
    },
    12: {
        "what": "Slice the words that belong on this line.",
        "withValuesTemplate": "line_words = words[{i}:{j}] → {line_words}.",
        "why": "These are the words we must justify now.",
    },
    13: {
        "what": "Decide left-justify vs full-justify.",
        "withValuesTemplate": "Last line or single word? j={j}, n={n}, count={len(line_words) if line_words is not None else 0}.",
        "why": "Last line and single-word lines are left-justified.",
    },
    14: {
        "what": "Join words with single spaces.",
        "withValuesTemplate": "line becomes a left-joined string.",
        "why": "Base for left-justified lines.",
    },
    15: {
        "what": "Pad trailing spaces to reach maxWidth.",
        "withValuesTemplate": "Pad until the line length equals {maxWidth}.",
        "why": "Every line must be exactly maxWidth characters.",
    },
    17: {
        "what": "Count spaces still needed inside the line.",
        "withValuesTemplate": "spaces = {spaces}.",
        "why": "These spaces will be distributed across gaps.",
    },
    18: {
        "what": "Count gaps between words.",
        "withValuesTemplate": "gaps = {gaps}.",
        "why": "Spaces are shared across these gaps.",
    },
    19: {
        "what": "Split spaces as evenly as possible.",
        "withValuesTemplate": "divmod gives base={base}, extra={extra}.",
        "why": "Left gaps get one extra space when leftover remains.",
    },
    25: {
        "what": "Assemble the fully justified line string.",
        "withValuesTemplate": "line is ready at width {maxWidth}.",
        "why": "All gaps now hold the distributed spaces.",
    },
    26: {
        "what": "Store the finished line.",
        "withValuesTemplate": "Append line; result length is now {len(result)}.",
        "why": "One more line is complete.",
    },
    27: {
        "what": "Move i to the start of the next line.",
        "withValuesTemplate": "i jumps to j = {i}.",
        "why": "Continue with the remaining words.",
    },
    28: {
        "what": "Return every justified line.",
        "withValuesTemplate": "Done. result has {len(result)} lines.",
        "why": "The algorithm finished packing all words.",
    },
}
