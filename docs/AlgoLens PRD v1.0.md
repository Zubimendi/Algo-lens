# AlgoLens PRD v1.0

*An interactive visual debugger that teaches LeetCode solutions line by line.*

Status: Draft for build | Platforms: Web app (v0.x), Chrome extension (v1.x) | Language at launch: Python 3

---

## 1. Overview

### 1.1 Vision

AlgoLens turns a LeetCode solution into an interactive visual lesson. The learner steps through the code one line at a time and sees the current line, every variable's value, the data structure's state, what just changed, and a plain-English explanation of why the next line runs.

### 1.2 One-sentence pitch

"Python Tutor, rebuilt for LeetCode learners, with a built-in teacher that explains every line in plain English using the real values."

### 1.3 Origin story (the founding use case)

The creator was doing timed LeetCode interview prep. On **Text Justification (LeetCode 68)** they understood the solution in theory but could not read the code: nested loops, two pointers (`i`, `j`), slices (`words[i:j]`), and `divmod` hid what the program was actually doing. Reading the code gave no picture. Redrawing it as tables (which words fit on a line, how spaces are handed out) made it click. AlgoLens automates that redrawing.

**The product must pass this test: after stepping through a problem in AlgoLens, the user can rewrite the solution from scratch.**

---

## 2. Problem and target user

### 2.1 Problem

Beginner and intermediate learners can follow an algorithm's idea but cannot mentally simulate the code. Typical blockers:

- Not knowing what a variable holds at a given moment (pointers, indices, counters).
- Not knowing why a loop or condition stopped.
- Not understanding Python idioms (slicing, `divmod`, `join`, comprehension).
- Not understanding what a data structure looks like (e.g., what `head` of a linked list really is).
- Studying a solution passively and being unable to reproduce it.

### 2.2 Primary user

Visual learners doing LeetCode/interview prep, beginner to intermediate, who study solutions after failing a timed attempt.

### 2.3 Secondary users

Bootcamp students and instructors who want shareable step-through lessons.

### 2.4 User workflow AlgoLens supports

1. Attempt problem in 25 minutes.
2. If stuck, paste the problem's solution (or own attempt).
3. Step through it with explanations until it makes sense.
4. Re-implement from scratch, then compare.

---

## 3. Competitive landscape

| Tool | What it does | Gap AlgoLens targets |
| --- | --- | --- |
| **Python Tutor** | General step-through visualizer for Python, Java, JS, C, C++. Runs code, records state per line, lets users step forward and back. Very large user base since 2010. Embeddable. | Not LeetCode-aware; shows state but does not explain the *meaning* of each line or the pattern. |
| **LeetTrace** | Chrome extension that traces Python solutions on LeetCode and visualizes arrays, hash maps, linked lists and trees. Reads editor code, runs it with Pyodide in the browser, shows a side panel. | Execution-focused; limited teaching layer (explanations, why/what-changed, prediction). |
| **LeetViz** | Chrome side-panel animations of problems; community-submitted, open-source, AI-generatable visualizers keyed to supported problems. Very small user base. | Per-problem animations, not a general debugger of the user's own code. |
| **labuladong plugin** | Adds an algorithm visualization panel beneath solution code on LeetCode. | Tied to that site's own curated solutions. |

**Takeaway:** the concept is validated, the market is not saturated, and the open lane is the **teaching layer**: line explanations with real values, "why did it stop", prediction practice, and debugging the learner's own failed attempt.

---

## 4. Goals, non-goals, success metrics

### 4.1 Goals

- G1: Make any supported Python solution fully step-through-able with correct state at every step.
- G2: Explain each line in plain English using real runtime values.
- G3: Show exactly what changed at each step so users never compare two big objects by eye.
- G4: Build active-learning features (prediction, rewrite-from-scratch) on top of passive viewing.
- G5: Ship a web app first; reuse the same engine in a Chrome extension.

### 4.2 Non-goals (for v0.x)

- Visualizing every LeetCode problem automatically on day one.
- Languages other than Python.
- Hosting or reproducing LeetCode's problem statements.
- Grading submissions or replacing LeetCode's judge.
- Mobile-native apps.

### 4.3 Success metrics

| Metric | Target |
| --- | --- |
| Creator can rewrite Valid Anagram, Remove Nth Node, and Text Justification from scratch after using AlgoLens on each | 3 of 3 |
| Trace correctness vs. real Python execution on golden tests | 100% of steps match |
| Time from paste to first visualized step | under 3 seconds for golden problems |
| Beta users who say they "understand the code" after one session | at least 70% |
| Return usage (users who visualize 3+ problems in a week) | at least 40% of beta users |

---

## 5. User stories

1. As a learner, I paste a solution and a test input and press Next to see one line execute at a time.
2. As a learner, I see every variable's current value beside the code so I never have to guess.
3. As a learner, I see a **What changed** panel (e.g., `j: 2 → 3`) so I can notice the effect of each line.
4. As a learner, I read a plain-English explanation of the current line with real numbers filled in.
5. As a learner, I see why a loop or `if` stopped, with each part of the condition shown as true/false.
6. As a learner, I go back a step to re-watch something I missed.
7. As a learner, I hide the explanation and **predict** the next value before revealing it.
8. As a learner, I see data structures drawn as pictures (arrays with pointers, linked lists, hash tables, trees), not just text.
9. As a learner, I paste my own failed attempt and the reference solution and see where their behavior first diverges.
10. As a learner, I see the pattern name and a one-line takeaway at the end (e.g., "greedy chunking").
11. As a learner, I can share a link to a specific step-through.
12. As a Chrome user, I click a Visualize button on a LeetCode page to open the same experience in a side panel.

---

## 6. Scope by release

### v0.1: "Golden demo" (web app)

- Python only. Types: ints, strings, lists, dicts, sets, plus pointer markers on arrays/strings.
- Paste code + input, run, step Next/Previous/First/Last, scrubber, Play/Pause.
- Code panel with current-line highlight; variable table; What changed panel.
- Explanations **hand-authored** for three golden problems to validate the UX before automating.
- Hash table and array/pointer renderers.

### v0.2: Teaching layer

- Condition breakdown ("why did it stop").
- Prediction mode.
- LLM-generated explanation templates, filled with real trace values.
- Linked list renderer (head, next arrows, pointers named `slow`, `fast`, `dummy`).

### v0.3: Compare and share

- Compare-my-attempt vs. reference (divergence detection).
- Shareable links.
- Stacks, queues, recursion call stack renderer.

### v1.0: Chrome extension

- Content script reads LeetCode editor code and injects a Visualize button.
- Side panel hosts the AlgoLens UI; test cases pulled from the page's examples where possible.

### Later

- Trees, graphs, heaps, matrices, DP tables, Dijkstra priority queue.
- Pattern detection library; spaced-repetition "rewrite from memory" drills.
- JavaScript/TypeScript, then Java, C++, Go.

---

## 7. Functional requirements

Priority: P0 = must for the version, P1 = should, P2 = nice.

### 7.1 Input

| ID | Requirement | Pri | Ver |
| --- | --- | --- | --- |
| FR-1 | Code editor accepts a Python solution (class `Solution` method or plain function). | P0 | 0.1 |
| FR-2 | User supplies test input as JSON-like arguments (e.g., `words=[...], maxWidth=16`). | P0 | 0.1 |
| FR-3 | Preloaded examples for the golden problems. | P0 | 0.1 |
| FR-4 | Input validation with readable errors (syntax errors, missing method). | P0 | 0.1 |

### 7.2 Execution and tracing

| ID | Requirement | Pri | Ver |
| --- | --- | --- | --- |
| FR-5 | Execute user code in the browser sandbox, off the main thread. | P0 | 0.1 |
| FR-6 | Record one snapshot per executed line (line number, local variables, return value). | P0 | 0.1 |
| FR-7 | Hard caps: maximum steps (default 5,000), maximum runtime, maximum output size, with a friendly message when hit. | P0 | 0.1 |
| FR-8 | Deep-copy values at each step so later mutation does not alter history. | P0 | 0.1 |
| FR-9 | Compute a diff between consecutive snapshots (changed, added, removed variables and elements). | P0 | 0.1 |
| FR-10 | Support calls and recursion with a call-stack frame per call. | P1 | 0.3 |

### 7.3 Playback controls

| ID | Requirement | Pri | Ver |
| --- | --- | --- | --- |
| FR-11 | Next, Previous, First, Last, Play/Pause, speed control, timeline scrubber. | P0 | 0.1 |
| FR-12 | Keyboard shortcuts: Right/Left arrows, Space to play. | P1 | 0.1 |
| FR-13 | Step counter "Step 7 / 18". | P0 | 0.1 |
| FR-14 | Jump to the next iteration of the current loop / next time a chosen variable changes. | P2 | 0.3 |

### 7.4 Visual state

| ID | Requirement | Pri | Ver |
| --- | --- | --- | --- |
| FR-15 | Variable table with name, type, current value, and a highlight when it changed this step. | P0 | 0.1 |
| FR-16 | Array/string renderer with index labels and named pointer markers (`i`, `j`, `left`, `right`). | P0 | 0.1 |
| FR-17 | Hash table renderer showing key/value rows; highlight lookups, inserts, updates. | P0 | 0.1 |
| FR-18 | Linked list renderer with node boxes, arrows, and named pointers; show `None` termination. | P1 | 0.2 |
| FR-19 | Stack/queue renderers; recursion call stack. | P1 | 0.3 |
| FR-20 | Tree, graph, heap, matrix, DP table renderers. | P2 | later |

### 7.5 Teaching layer

| ID | Requirement | Pri | Ver |
| --- | --- | --- | --- |
| FR-21 | **What changed** panel listing before → after for every variable changed by the step. | P0 | 0.1 |
| FR-22 | **Explain this line** panel: plain English plus the same line with real values substituted. | P0 | 0.1 (hand-authored), 0.2 (generated) |
| FR-23 | **Why did it stop / continue** panel for `while`, `if`, and boolean conditions: each sub-condition evaluated and shown as true/false with numbers. | P0 | 0.2 |
| FR-24 | **Predict mode**: hide the result, ask the user to enter the next value of a chosen variable, then reveal and score. | P1 | 0.2 |
| FR-25 | **Python idiom helper**: hover on `divmod`, slicing, `join`, ternary, comprehension to see a mini-explanation with the current values. | P1 | 0.2 |
| FR-26 | **Pattern card** at the end of the run (name, when to use it, one-line takeaway). | P2 | 0.3 |
| FR-27 | **Compare attempt vs reference**: run both on the same input and point to the first step where state diverges. | P1 | 0.3 |

### 7.5.1 Explanation rules

- Numbers in explanations must come from the trace, never from an LLM guess.
- Every explanation has three parts: *What this line does* (generic), *With current values* (specific), *Why* (purpose in the algorithm).
- Use short sentences and avoid jargon on first use; define terms inline.

### 7.6 Sharing and persistence

| ID | Requirement | Pri | Ver |
| --- | --- | --- | --- |
| FR-28 | Shareable URL encoding the code, input, and step. | P1 | 0.3 |
| FR-29 | Save past sessions locally (history list). | P2 | 0.3 |

### 7.7 Chrome extension

| ID | Requirement | Pri | Ver |
| --- | --- | --- | --- |
| FR-30 | Detect LeetCode problem pages and read the editor contents. | P0 | 1.0 |
| FR-31 | Inject a Visualize button; open AlgoLens in the Chrome side panel. | P0 | 1.0 |
| FR-32 | Parse the page's example inputs to prefill test input where possible; fall back to manual input. | P1 | 1.0 |
| FR-33 | Same engine and UI package as the web app. | P0 | 1.0 |

---

## 8. UX design

### 8.1 Main layout (desktop)

```
+------------------------------------------------------------------+
| AlgoLens   [Problem: Text Justification]   [Input v]   [Run]    |
+---------------------------+--------------------------------------+
| CODE                      | VISUAL STATE                         |
|  12  j = i + 1            |  words                               |
|  13  length = len(...)    |  [This][is][an][example][of]...      |
|  14> while j < n and ...  |    ^i       ^j                       |
|  15      length += ...    |                                      |
|  16      j += 1           |  Variables                           |
|                           |  i=0  j=3  length=10  n=7            |
+---------------------------+--------------------------------------+
| WHAT CHANGED     length: 7 -> 10     j: 2 -> 3                   |
+------------------------------------------------------------------+
| EXPLAIN THIS LINE                                                |
|  Can "example" fit? 10 + 1 + 7 = 18, which is more than 16.      |
|  So the line stops here and j stays 3.                           |
+------------------------------------------------------------------+
| [|<] [<] [> Next] [>|]  [Play] speed  ====o======  Step 9/31     |
+------------------------------------------------------------------+
```

### 8.2 Design principles

1. **One step, one change.** Never advance more than one meaningful thing per click.
2. **Show the numbers.** Substitute values into the code line before explaining.
3. **Highlight, don't describe.** Changed values flash; unchanged values are muted.
4. **Show the loop's decision.** Conditions display their true/false pieces.
5. **Teach, then test.** Predict mode follows explain mode.
6. **Reversible.** Previous is always instant and exact.

### 8.3 Beginner Mode panels (per step)

1. Current line
2. Values involved
3. What the line does (plain English)
4. What changed (before → after)
5. Why this step exists in the algorithm

### 8.4 Key screens

- **Home / paste screen:** editor, input box, example picker.
- **Visualizer screen:** layout above.
- **Compare screen (v0.3):** two code panes, shared timeline, divergence marker.
- **Summary screen:** pattern card, "Rewrite from memory" button.

---

## 9. Technical architecture

### 9.1 Principle: trace first, replay later

Follow the Python Tutor model. Run the program once, record the whole execution as a JSON trace, then let the UI be a pure function of `trace.steps[k]`. This makes Previous free, scrubbing trivial, and the web app and extension identical.

### 9.2 Pipeline

```
Code + input
   -> Runner (Pyodide in a Web Worker, sys.settrace)
   -> Raw trace (line events + locals)
   -> Normalizer (deep copy, type tagging, diffs)
   -> Annotator (explanation templates + real values)
   -> Trace JSON
   -> UI (code panel, renderers, panels, controls)
```

### 9.3 Components

| Component | Responsibility | Notes |
| --- | --- | --- |
| Runner | Execute user code safely, emit line events | Pyodide in a Web Worker; `sys.settrace` captures each line; enforce step/time caps; terminate worker on overrun. |
| Normalizer | Convert values to JSON with type tags and stable object ids | Detect shared references (aliasing); special-case linked-list nodes (`val`, `next`) and tree nodes. |
| Differ | Compare consecutive snapshots | Outputs changed variables and element-level changes. |
| Condition analyzer | Evaluate sub-expressions of conditions | Parse with Python `ast`; evaluate each boolean operand against the step's locals. |
| Annotator | Attach explanations to steps | Template per source line with placeholders filled from locals. |
| Renderer registry | Map value types to visual components | Array, string+pointers, dict, list-of-nodes, tree, etc. |
| UI shell | Layout, controls, state store | Framework of choice (e.g., React or Svelte); state is current step index only. |

### 9.4 Trace JSON schema (v1)

```json
{
  "schemaVersion": 1,
  "problem": { "id": "text-justification", "title": "Text Justification" },
  "code": "class Solution: ...",
  "input": { "words": ["This", "is"], "maxWidth": 16 },
  "steps": [
    {
      "index": 8,
      "line": 14,
      "event": "line",
      "frame": "fullJustify",
      "locals": {
        "i": { "type": "int", "value": 0 },
        "j": { "type": "int", "value": 2 },
        "length": { "type": "int", "value": 7 }
      },
      "changes": [
        { "name": "j", "before": 1, "after": 2 }
      ],
      "condition": {
        "expr": "j < n and length + 1 + len(words[j]) <= maxWidth",
        "parts": [
          { "text": "j < n", "result": true },
          { "text": "length + 1 + len(words[j]) <= maxWidth",
            "evaluated": "7 + 1 + 2 = 10 <= 16", "result": true }
        ],
        "result": true
      },
      "explain": {
        "what": "Check whether the next word still fits on this line.",
        "withValues": "7 + 1 + 2 = 10, which is at most 16, so it fits.",
        "why": "Greedy rule: keep adding words while they fit."
      },
      "stdout": ""
    }
  ],
  "result": ["This    is    an", "example  of text", "justification.  "]
}
```

### 9.5 Explanation layer design

- **Generated once per solution, not per step.** An LLM reads the code and produces one explanation template per source line with placeholders, e.g. `"Add {words[j]} ({len(words[j])} letters) plus 1 space to the length"`.
- **Values come from the trace.** The Annotator fills placeholders from real locals, so numbers are never invented.
- **Validation:** templates are checked by running them against the trace; any placeholder that fails to resolve is flagged and falls back to a generic description.
- **v0.1 uses hand-written templates** for the three golden problems to prove the UX before automating.
- Cache generated templates keyed by a hash of the code.

### 9.6 Data model (application level)

```
Session   { id, createdAt, code, inputJson, problemId?, traceId }
Trace     { id, schemaVersion, steps[], result, codeHash }
Template  { codeHash, lineNumber, what, withValuesTemplate, why }
Attempt   { id, sessionId, role: "reference" | "user", code }
Prediction{ sessionId, stepIndex, variable, guess, actual, correct }
```

v0.1 can keep everything in memory and the URL. Add persistence in v0.3.

### 9.7 Security and performance

- All user code runs in the browser worker, never on a server in v0.x.
- Enforce step cap (default 5,000), time cap, and output cap; terminate the worker on overrun.
- Cap displayed collection size (e.g., show first 50 items with an expand control).
- Run the Runner in a worker so an infinite loop cannot freeze the page.

### 9.8 Chrome extension specifics (Manifest V3)

- All extension logic, including the Python runtime and its WebAssembly files, must be bundled in the extension package; remotely hosted code is not allowed.
- Extension pages have a minimum content security policy that permits WebAssembly (`wasm-unsafe-eval`) but not `unsafe-eval`; sandboxed pages can use a more relaxed policy. **Spike required:** confirm the Python runtime runs correctly inside a side-panel page or a sandboxed page before committing to the extension architecture.
- Components: content script (read editor, inject button), side panel (UI), service worker (messaging), sandboxed runner.
- Keep the engine and UI as one shared package consumed by both the web app and the extension.

---

## 10. LeetCode integration plan

1. v0.x: user pastes code and input manually; no LeetCode coupling.
2. v1.0: extension reads the editor and the problem's example inputs.
3. Do not store or redistribute problem statements; link to the problem instead.
4. Review LeetCode's terms of service and Chrome Web Store policies before launching the extension publicly.

---

## 11. Golden test set and acceptance criteria

| # | Problem | Why it is a golden test | Key visuals |
| --- | --- | --- | --- |
| 1 | Valid Anagram | Hash map counting; simplest beginner case | dict table with lookup/insert/update |
| 2 | Remove Nth Node From End (LeetCode 19) | Linked list, dummy node, fixed-gap two pointers | node boxes, `slow` and `fast` arrows, rewiring |
| 3 | Text Justification (LeetCode 68) | Nested loops, slices, `divmod`, special cases | word array with `i` and `j`, line builder, space distribution |

### Acceptance criteria

- AC-1: For each golden problem and at least 3 inputs, the trace's final result equals the real Python result.
- AC-2: Every step's variable values match values from an independent run with `print` debugging.
- AC-3: Previous then Next returns to an identical screen.
- AC-4: Infinite-loop code stops at the step cap with a clear message.
- AC-5: For Text Justification, the "why did it stop" panel shows `10 + 1 + 7 = 18 > 16` at the moment `example` is rejected on line 1.
- AC-6: The creator can explain every line of each golden solution aloud after using AlgoLens.

### Appendix A: Text Justification expected beats (width 16)

| Phase | What the learner should see |
| --- | --- |
| Line 1 greedy | `length` goes 4, 7, 10; `example` rejected at 18; `j = 3` |
| Line 1 stretch | letters 8, spaces 8, gaps 2, `divmod(8,2) = (4,0)`; result `"This    is    an"` |
| Line 2 greedy | `length` 7, 10, 15; `justification.` rejected |
| Line 2 stretch | spaces 3, `divmod(3,2) = (1,1)`; first gap 2, second gap 1; `"example  of text"` |
| Line 3 | last line, left-justified; padded with 2 trailing spaces |

---

## 12. Roadmap

| Phase | Weeks (suggested) | Deliverable |
| --- | --- | --- |
| 0. Spikes | 1 | Python runtime in a Web Worker with line tracing; confirm step capture and caps. Separately, spike the same runtime inside an extension side panel. |
| 1. v0.1 | 2-3 | Web app with code panel, variable table, hash table and array renderers, playback, What changed; hand-authored explanations for 3 golden problems. |
| 2. v0.2 | 3-4 | Condition breakdown, predict mode, idiom helper, LLM template generation, linked list renderer. |
| 3. v0.3 | 3-4 | Compare attempt vs reference, sharing, stack/queue/call-stack renderers. |
| 4. v1.0 | 3-4 | Chrome extension: button injection, side panel, example input parsing. |
| 5. Beyond | ongoing | Trees, graphs, heaps, DP tables, pattern library, more languages. |

Timeline is a planning guess for a solo builder; adjust after the Phase 0 spikes.

---

## 13. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing tools (e.g., LeetTrace, LeetViz) already cover execution visualization | Differentiation unclear | Compete on the teaching layer: explain, why-it-stopped, predict, compare. Validate with real learners early. |
| Python runtime does not run cleanly inside an extension context | Blocks the extension | Phase 0 spike; fall back to hosting the visualizer as a web page opened from a content-script button. |
| LLM explanations contain wrong numbers | Loses trust | Templates only; numbers from trace; automated placeholder validation. |
| Large traces (long loops) overwhelm the UI | Poor performance | Step cap, collapse repeated loop iterations, virtualize the timeline. |
| Visual clutter for large structures | Confusing | Truncate with expand; show only values relevant to the current line. |
| Scope creep (every data structure, every language) | Never ships | Ship the 3 golden problems first; add structures one at a time. |
| LeetCode terms or store policy limits | Blocks distribution | Review terms early; keep the web app fully usable without the extension. |

---

## 14. Open questions

1. Which UI framework and rendering approach (SVG, canvas, or HTML) for renderers?
2. Should explanations be authored per problem (curated library) or generated for any pasted code? Plan: curated first, generated second.
3. How should multiple test cases be handled in one session?
4. What is the free vs. paid boundary, if any, given LLM costs for template generation?
5. How will progress and "rewrite from memory" results be stored without accounts?

---

## 15. Immediate next steps

1. Run the Phase 0 spikes (worker tracing, then extension side panel).
2. Build the v0.1 stepper around Text Justification, since it is the founding use case.
3. Hand-author its explanation templates and check them against the acceptance criteria.
4. Add Valid Anagram (hash map renderer) and Remove Nth Node (linked list renderer).
5. Test with 3 to 5 other learners and measure the success metrics in section 4.3.
