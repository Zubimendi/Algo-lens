PROBLEM = {
    "id": "remove-nth-node",
    "title": "Remove Nth Node From End of List",
    "description": "Delete the nth node from the end using a dummy head and two pointers.",
    "rendererFocus": ["linked_list", "pointers"],
}

STARTER_CODE = '''class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def removeNthFromEnd(self, head: ListNode, n: int) -> ListNode:
        dummy = ListNode(0, head)
        fast = dummy
        slow = dummy
        for _ in range(n + 1):
            fast = fast.next
        while fast is not None:
            fast = fast.next
            slow = slow.next
        slow.next = slow.next.next
        return dummy.next
'''

EXAMPLES = [
    {
        "label": "Example 1",
        "input": {"head": [1, 2, 3, 4, 5], "n": 2},
        "expected": [1, 2, 3, 5],
    },
    {
        "label": "Example 2",
        "input": {"head": [1], "n": 1},
        "expected": [],
    },
    {
        "label": "Example 3",
        "input": {"head": [1, 2], "n": 1},
        "expected": [1],
    },
]

TEMPLATES = {
    8: {
        "what": "Create a dummy node before the real head.",
        "withValuesTemplate": "dummy points before the list starting at {head}.",
        "why": "Simplifies deleting the first node.",
    },
    9: {
        "what": "Place the fast pointer at dummy.",
        "withValuesTemplate": "fast starts at dummy.",
        "why": "Fast will walk n+1 steps ahead of slow.",
    },
    10: {
        "what": "Place the slow pointer at dummy.",
        "withValuesTemplate": "slow starts at dummy.",
        "why": "Slow will land just before the node to delete.",
    },
    11: {
        "what": "Advance fast by n+1 steps.",
        "withValuesTemplate": "Open a gap of n nodes between slow and fast.",
        "why": "When fast hits the end, slow is right before the target.",
    },
    12: {
        "what": "Move fast one step forward.",
        "withValuesTemplate": "fast advances.",
        "why": "Build the fixed gap.",
    },
    13: {
        "what": "Walk both pointers until fast falls off the list.",
        "withValuesTemplate": "Continue while fast is not None.",
        "why": "Keep the gap while sliding to the end.",
    },
    14: {
        "what": "Advance fast.",
        "withValuesTemplate": "fast moves ahead.",
        "why": "Maintain progress toward the end.",
    },
    15: {
        "what": "Advance slow.",
        "withValuesTemplate": "slow moves ahead.",
        "why": "Slow approaches the node before the deletion target.",
    },
    16: {
        "what": "Rewire the next pointer to skip the target node.",
        "withValuesTemplate": "slow.next skips one node.",
        "why": "This deletes the nth node from the end.",
    },
    17: {
        "what": "Return the real head after dummy.",
        "withValuesTemplate": "Return dummy.next as the new list head.",
        "why": "Dummy is only a helper and is discarded.",
    },
}
