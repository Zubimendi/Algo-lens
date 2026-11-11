"use client";

import { useEffect, useState } from "react";
import { fetchProblem, fetchProblems, runTrace } from "@/lib/api";
import type {
  ProblemDetail,
  ProblemSummary,
  TraceResponse,
  ViewMode,
} from "@/lib/trace-types";
import { Visualizer } from "@/components/visualizer/Visualizer";

const CUSTOM = "custom";

const BLANK_STARTER = `class Solution:
    def solve(self, nums: list[int], target: int) -> int:
        # Paste any correct Python solution.
        # Entry point: Solution method or a top-level function.
        total = 0
        for n in nums:
            total += n
        return total + target
`;

const BLANK_INPUT = `{
  "nums": [1, 2, 3],
  "target": 4
}`;

export function HomeEditor() {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>(CUSTOM);
  const [detail, setDetail] = useState<ProblemDetail | null>(null);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [code, setCode] = useState(BLANK_STARTER);
  const [inputText, setInputText] = useState(BLANK_INPUT);
  const [mode, setMode] = useState<ViewMode>("beginner");
  const [trace, setTrace] = useState<TraceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProblems()
      .then(setProblems)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (selectedId === CUSTOM) {
      setDetail(null);
      setExampleIdx(0);
      return;
    }
    fetchProblem(selectedId)
      .then((p) => {
        setDetail(p);
        setCode(p.starterCode);
        setExampleIdx(0);
        const ex = p.examples[0];
        setInputText(ex ? JSON.stringify(ex.input, null, 2) : "{}");
        setTrace(null);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [selectedId]);

  const onExampleChange = (idx: number) => {
    setExampleIdx(idx);
    if (!detail?.examples[idx]) return;
    setInputText(JSON.stringify(detail.examples[idx].input, null, 2));
  };

  const loadBlank = () => {
    setSelectedId(CUSTOM);
    setDetail(null);
    setCode(BLANK_STARTER);
    setInputText(BLANK_INPUT);
    setTrace(null);
    setError(null);
  };

  const onRun = async () => {
    setLoading(true);
    setError(null);
    try {
      let parsed: Record<string, unknown> | string = inputText;
      try {
        parsed = JSON.parse(inputText) as Record<string, unknown>;
      } catch {
        parsed = inputText;
      }
      const result = await runTrace({
        code,
        input: parsed,
        // Only attach curated templates when an example pack is selected
        problemId: selectedId === CUSTOM ? null : selectedId,
      });
      setTrace(result);
      if (result.error && result.steps.length === 0) {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setTrace(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">AlgoLens</div>
        <label className="field">
          Load example
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value={CUSTOM}>Custom (paste your own)</option>
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Example input
          <select
            value={exampleIdx}
            onChange={(e) => onExampleChange(Number(e.target.value))}
            disabled={!detail}
          >
            {!detail && <option value={0}>—</option>}
            {(detail?.examples || []).map((ex, i) => (
              <option key={ex.label} value={i}>
                {ex.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Mode
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as ViewMode)}
          >
            <option value="beginner">Beginner</option>
            <option value="standard">Standard</option>
          </select>
        </label>
        <button type="button" onClick={loadBlank}>
          Reset custom
        </button>
        <button
          type="button"
          className="run-btn"
          onClick={onRun}
          disabled={loading}
        >
          {loading ? "Running…" : "Run"}
        </button>
      </header>

      <p className="problem-desc">
        {detail
          ? detail.description
          : "Paste any Python Solution (or function) and a matching test input, then press Run. AlgoLens traces the run, visualizes state, and explains each line. Syntax errors are reported before execution."}
      </p>

      <div className="editor-grid">
        <label className="editor-block">
          <span className="panel-label">Python solution</span>
          <textarea
            className="code-input"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              // Editing away from a pack keeps curated templates only if still selected;
              // users can switch to Custom anytime.
            }}
            spellCheck={false}
            placeholder="class Solution: ..."
          />
        </label>
        <label className="editor-block input-block">
          <span className="panel-label">
            Test input (JSON object or key=value pairs)
          </span>
          <textarea
            className="input-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            spellCheck={false}
            placeholder={'{"nums": [1, 2], "target": 3}'}
          />
        </label>
      </div>

      {error && (
        <div className="banner error">
          <pre className="error-pre">{error}</pre>
        </div>
      )}

      {trace && <Visualizer trace={trace} mode={mode} />}
    </div>
  );
}
