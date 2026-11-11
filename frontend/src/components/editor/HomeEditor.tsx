"use client";

import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Visualizer } from "@/components/visualizer/Visualizer";
import { fetchProblem, fetchProblems, runTrace } from "@/lib/api";
import { LANGUAGES, type LanguageId } from "@/lib/languages";
import type {
  ProblemDetail,
  ProblemSummary,
  TraceResponse,
  ViewMode,
} from "@/lib/trace-types";

const CUSTOM = "custom";

const BLANK_STARTER = `class Solution:
    def solve(self, nums: list[int], target: int) -> int:
        """Sum nums, then add target."""
        # Paste any correct Python solution.
        # Comments and docstrings are fine.
        total = 0
        for n in nums:  # accumulate
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
  const [language, setLanguage] = useState<LanguageId>("python");
  const [mode, setMode] = useState<ViewMode>("beginner");
  const [trace, setTrace] = useState<TraceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(true);
  const vizRef = useRef<HTMLElement | null>(null);

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
        setLanguage("python");
        setEditorOpen(true);
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
    setLanguage("python");
    setTrace(null);
    setError(null);
    setEditorOpen(true);
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
        problemId: selectedId === CUSTOM ? null : selectedId,
        language,
      });
      setTrace(result);
      setEditorOpen(false);
      if (result.error && result.steps.length === 0) {
        setError(result.error);
        setEditorOpen(true);
      } else {
        requestAnimationFrame(() => {
          vizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setTrace(null);
      setEditorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">AlgoLens</div>
        <div className="top-controls">
          <label className="field">
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageId)}
            >
              {LANGUAGES.map((l) => (
                <option
                  key={l.id}
                  value={l.id}
                  disabled={l.status !== "supported"}
                >
                  {l.label}
                  {l.status === "coming_soon" ? " (soon)" : ""}
                </option>
              ))}
            </select>
          </label>
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
            Teaching mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ViewMode)}
            >
              <option value="beginner">Beginner</option>
              <option value="standard">Standard</option>
            </select>
          </label>
          <ThemeToggle />
        </div>
      </header>

      <section className="app-section" aria-labelledby="write-title">
        <div className="section-header">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div>
              <span className="section-kicker">Step 1</span>
              <h2 id="write-title" className="section-title">
                Write your solution
              </h2>
              <p className="section-subtitle">
                {detail
                  ? detail.description
                  : "Paste a LeetCode-style Python Solution (or function) and the test input you want to walk through. Comments and docstrings are supported."}
              </p>
            </div>
            {trace && (
              <button
                type="button"
                className="collapse-toggle"
                onClick={() => setEditorOpen((o) => !o)}
              >
                {editorOpen ? "Hide editor" : "Edit solution"}
              </button>
            )}
          </div>
        </div>

        {editorOpen && (
          <div className="section-body">
            <div className="editor-grid">
              <div className="editor-block">
                <span className="panel-label">Solution code</span>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  height="260px"
                />
              </div>
              <label className="editor-block input-block">
                <span className="panel-label">
                  Test input (JSON or key=value)
                </span>
                <textarea
                  className="input-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  spellCheck={false}
                  placeholder={'{"head": [1,2,3], "k": 2}'}
                />
              </label>
            </div>

            {error && (
              <div className="banner error" style={{ marginTop: "1rem" }}>
                <pre className="error-pre">{error}</pre>
              </div>
            )}

            <div className="section-actions">
              <button type="button" onClick={loadBlank}>
                Reset custom
              </button>
              <button
                type="button"
                className="run-btn"
                onClick={onRun}
                disabled={loading}
              >
                {loading ? "Tracing…" : "Run visualization"}
              </button>
            </div>
          </div>
        )}

        {!editorOpen && (
          <div className="section-body">
            <p className="muted" style={{ margin: 0 }}>
              Editor hidden so you can focus on the walkthrough.{" "}
              <button type="button" onClick={() => setEditorOpen(true)}>
                Edit solution
              </button>
            </p>
          </div>
        )}
      </section>

      <section
        className="app-section"
        aria-labelledby="viz-title"
        ref={vizRef}
      >
        <div className="section-header">
          <span className="section-kicker">Step 2</span>
          <h2 id="viz-title" className="section-title">
            Step through the solution
          </h2>
          <p className="section-subtitle">
            Pause on any line. Watch the data structures move, see exactly what
            changed, and read why that step exists in the algorithm — until the
            final answer makes sense.
          </p>
        </div>

        <div className="section-body" style={{ padding: trace ? 0 : undefined }}>
          {!trace && (
            <p className="muted" style={{ margin: 0 }}>
              Press <strong>Run visualization</strong> above to generate a
              step-by-step trace for your solution and input.
            </p>
          )}
          {trace && <Visualizer trace={trace} mode={mode} />}
        </div>
      </section>
    </div>
  );
}
