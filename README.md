# AlgoLens

**An interactive visual debugger that teaches LeetCode solutions line by line.**

Paste a Python solution and a test input, press Run, then step through every line. AlgoLens shows the current line, live variable values, what just changed, a picture of the relevant data structure, and a plain-English explanation that uses the real numbers from the trace—not guesses.

> Product test: after stepping through a problem in AlgoLens, you should be able to rewrite the solution from scratch.

---

## What’s in this MVP

| Piece | Status |
| --- | --- |
| **Custom paste → Run → visualize** any Python `Solution` / function | Done |
| Syntax / validation errors surfaced before (or instead of) a trace | Done |
| Dynamic line explanations from AST + real runtime values | Done |
| Syntax highlighting + comments/docstrings (language-ready) | Done |
| Optional golden example packs (richer hand-authored explanations) | Done |
| Structure renderers (auto-detected) | Done — see below |
| Beginner / Standard teaching modes | Done |
| LLM-generated explanations | Not in MVP (API stub returns `501`) |
| Share links, compare-attempt, Chrome extension | Later |

The product is **dynamic by default**: you paste code and input yourself. The three golden problems are only convenience loaders for demos—not a fixed catalog of what can be visualized.

Stack: **Python 3.12 + FastAPI** backend, **Next.js 15 (App Router) + TypeScript** frontend.

---

## Architecture

AlgoLens follows a **trace once, replay later** model (same idea as Python Tutor):

1. The backend runs the user’s Python once under `sys.settrace`.
2. It records a JSON trace of every line (locals, diffs, explanations).
3. The frontend is a pure function of `trace.steps[k]` — Previous, scrubbing, and Play are free and exact.

```
Code + input
  → Validate (AST + entry method)
  → Sandboxed runner (subprocess, step/time caps)
  → Normalizer (typed values, deep copies)
  → Differ (what changed)
  → Annotator (hand templates filled with real locals)
  → Trace JSON
  → Next.js visualizer
```

User code never runs in the browser. The API process isolates each run in a child process with a default **5,000-step** cap and a **~5s** wall-clock timeout.

---

## Repository layout

```
Algo-lens/
├── docs/                      # Product PRD
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + CORS
│   │   ├── api/routes/        # HTTP endpoints
│   │   ├── tracer/            # validate, sandbox, runner, normalizer, differ, annotator
│   │   ├── problems/          # Golden packs (code, examples, templates)
│   │   └── schemas/           # Pydantic Trace models
│   ├── tests/golden/          # Acceptance tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/
│   │   │   ├── editor/        # Home paste + Run UI
│   │   │   ├── visualizer/    # Layout, playback, explain panels
│   │   │   └── renderers/     # Array, dict, linked list, variables
│   │   └── lib/               # API client + Trace types
│   ├── .env.local             # NEXT_PUBLIC_API_URL
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- Python **3.12+**
- Node.js **20+** (22 recommended) and npm
- Optional: Docker + Docker Compose

---

## Quick start (local)

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export PYTHONPATH=.                # Windows (PowerShell): $env:PYTHONPATH="."
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)  
Interactive docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
# frontend/.env.local should contain:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Docker Compose (optional)

From the repo root:

```bash
docker compose up --build
```

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8000](http://localhost:8000)

---

## Using the app

1. Stay on **Custom (paste your own)** (default), or optionally **Load example** for a golden demo.
2. Paste a Python `class Solution` method (or top-level function) and a matching **test input** (JSON object or `key=value` pairs).
3. Toggle **Beginner** or **Standard** mode.
4. Press **Run**.
   - Syntax / structure problems → clear error (no bogus trace).
   - Successful run → full step trace with visuals + per-line explanations.
5. Step with **Next / Previous**, the scrubber, **Play**, or keyboard:
   - `→` / `←` — next / previous step  
   - `Space` — play / pause  

Wrong-but-runnable solutions still visualize; you’ll see the (incorrect) state evolution and final result. AlgoLens is aimed at understanding correct solutions, not at judging them.

### Modes

| Mode | Behavior |
| --- | --- |
| **Beginner** | Stacked teaching panels per step (current line → what → with values → why); unchanged variables are muted |
| **Standard** | Compact layout; same data, less scaffolding |

### What you see while stepping

- **Code** — current line highlighted  
- **Visual state** — auto-picked structure drawings + variable table  
- **What changed** — before → after for each updated name  
- **Explain this line** — *what* / *with current values* / *why* (numbers come from the trace)  
- **Result** — final return value when the run finishes  

### Structure renderers (auto-detected)

| Type | How it’s detected | Visual |
| --- | --- | --- |
| Array / string | `list` / `tuple` / multi-char `str` | Indexed cells + pointer markers (`i`, `j`, …) |
| Hash map | `dict` | Key / value table |
| Set | `set` | Chip cloud |
| Matrix | Rectangular list-of-lists | 2D grid |
| Linked list | `ListNode` (`val`/`next`), or `head=[…]` input | Node boxes + arrows |
| Binary tree | `TreeNode` (`val`/`left`/`right`), or `root=[…]` level-order input | Level-order node rows |
| Stack | Variable names like `stack`, `st`, `stk` | Vertical top→bottom |
| Queue | `deque` or names like `queue`, `q` | Front→back row |
| Heap | Names like `heap`, `pq`, `minHeap` | Indexed array + parent/child hint |

Naming hints only retag plain lists—`deque` and node objects are detected by type.

---

## Explanations

For **any** pasted solution (no `problemId`):

- The annotator walks the AST and classifies each line (assign, loop, branch, return, …).
- `withValues` inserts **real** locals / diffs from the trace next to the source line.
- Numbers are never invented.

When you load a golden example and keep `problemId` set, optional **hand-authored** templates override the generic blurbs for that pack (still filled only from trace values).

## Golden example packs (optional)

| ID | Problem | Focus |
| --- | --- | --- |
| `text-justification` | Text Justification (LC 68) | Arrays, two pointers, `divmod`, greedy packing |
| `valid-anagram` | Valid Anagram | Hash-map counting |
| `remove-nth-node` | Remove Nth Node From End (LC 19) | Linked list, dummy node, `slow`/`fast` |

Each pack ships with starter code, ≥3 example inputs, and richer per-line templates under `backend/app/problems/`.

---

## API reference

Base URL (local): `http://127.0.0.1:8000`

### `GET /health`

```json
{ "status": "ok" }
```

### `GET /api/v1/problems`

Lists golden problem summaries (`id`, `title`, `description`, `rendererFocus`).

### `GET /api/v1/problems/{id}`

Full pack: starter code + examples.

### `GET /api/v1/languages`

Lists languages the UI can select. Python is supported now; others are marked `coming_soon` so the highlighter/editor can grow without API churn.

### `POST /api/v1/trace`

Run and annotate a solution.

**Request**

```json
{
  "code": "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        ...",
  "input": { "s": "anagram", "t": "nagaram" },
  "problemId": "valid-anagram",
  "language": "python"
}
```

- `code` — Python `Solution` method or top-level function (comments/docstrings OK; markdown \`\`\` fences are stripped)  
- `input` — JSON object **or** kwargs-style string, e.g. `words=["a","b"], maxWidth=16`  
- `problemId` — optional; when set to a golden id, hand templates are applied  
- `language` — defaults to `python`; other ids are reserved for later runtimes  

**Response (shape)**

```json
{
  "schemaVersion": 1,
  "problem": { "id": "valid-anagram", "title": "Valid Anagram" },
  "code": "...",
  "input": { "s": "anagram", "t": "nagaram" },
  "steps": [
    {
      "index": 0,
      "line": 3,
      "event": "line",
      "frame": "isAnagram",
      "locals": {
        "s": { "type": "str", "value": "anagram" }
      },
      "changes": [],
      "explain": {
        "what": "...",
        "withValues": "...",
        "why": "..."
      },
      "stdout": ""
    }
  ],
  "result": true,
  "error": null,
  "capped": false
}
```

If a safety limit is hit, `capped` is `true` and `error` explains why. Partial steps may still be present.

### `POST /api/v1/explain-templates`

Reserved for future LLM template generation. MVP always returns **501**.

### Try it quickly

Use the interactive docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs), or from `backend/`:

```bash
source .venv/bin/activate
PYTHONPATH=. python - <<'PY'
from fastapi.testclient import TestClient
from app.main import app
from app.problems.valid_anagram import STARTER_CODE, EXAMPLES

c = TestClient(app)
r = c.post("/api/v1/trace", json={
    "code": STARTER_CODE,
    "input": EXAMPLES[0]["input"],
    "problemId": "valid-anagram",
})
print(r.status_code, r.json()["result"], "steps=", len(r.json()["steps"]))
PY
```

---

## Safety & limits

| Limit | Default | Purpose |
| --- | --- | --- |
| Step cap | 5,000 | Stop runaway loops |
| Wall-clock timeout | ~5 seconds | Kill hung subprocesses |
| Collection display | First ~50 items | Keep the UI readable |

Runs happen in a **spawned subprocess**, not on the API event loop. This is still an MVP sandbox—do not expose the API to untrusted public traffic without hardening (container isolation, seccomp, stricter builtins, resource quotas, auth, rate limits).

---

## Testing

From `backend/`:

```bash
source .venv/bin/activate
export PYTHONPATH=.
pytest -q
```

Golden acceptance coverage includes:

- Final results match expected outputs for all golden examples  
- Trace locals behave correctly for hash-map / pointer beats  
- Step snapshots are immutable (Previous/Next safe)  
- Infinite loops hit a cap or timeout with a clear error  
- Text Justification shows the “reject `example` when `10+1+7 > 16`” beat  
- Input / code validation returns readable errors  

Frontend production build:

```bash
cd frontend
npm run build
```

---

## Configuration

| Variable | Where | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Backend base URL (default `http://127.0.0.1:8000`) |
| `PYTHONPATH` | Backend shell | Must include `backend/` so `app.*` imports resolve |

CORS is open (`*`) for local MVP development.

---

## Roadmap (not in this MVP)

Aligned with the PRD, next slices include:

- Condition breakdown (“why did it stop”) and prediction mode  
- LLM explanation **templates** (numbers still filled only from the trace)  
- Compare my attempt vs reference (first divergence)  
- Shareable session links  
- Chrome extension that reads the LeetCode editor  
- More renderers: trees, graphs, heaps, matrices, DP tables  

Product background and acceptance criteria: [`docs/AlgoLens PRD v1.0.md`](docs/AlgoLens%20PRD%20v1.0.md).

---

## Troubleshooting

| Symptom | Likely fix |
| --- | --- |
| Frontend “Failed to fetch” | Backend not running, or `NEXT_PUBLIC_API_URL` wrong / needs restart after change |
| `ModuleNotFoundError: app` | Run uvicorn/pytest with `PYTHONPATH=.` from `backend/` |
| Trace `capped` / timeout | Input too large or infinite loop — reduce input or fix the loop |
| Validation 400 | Missing `Solution` method / top-level function, or bad input JSON |
| Linked-list input | Pass `head` as a JSON array, e.g. `"head": [1,2,3,4,5], "n": 2` |

---

## License

No license file is checked in yet. Add one before publishing the repo.
