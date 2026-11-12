"use client";

import type { Explain, ViewMode } from "@/lib/trace-types";

type Props = {
  explain?: Explain | null;
  mode: ViewMode;
  line: number | null;
  lineText?: string;
};

export function ExplainPanel({ explain, mode, line, lineText }: Props) {
  if (!explain) {
    return (
      <div className="explain-panel">
        <div className="panel-label">Why this line</div>
        <div className="muted">Run a trace to see explanations.</div>
      </div>
    );
  }

  if (mode === "beginner") {
    return (
      <div className="explain-panel beginner">
        <div className="panel-label">Why this line (beginner)</div>
        <ol className="beginner-steps">
          <li>
            <strong>Code</strong>
            <div>
              {line != null ? (
                <code>
                  {line}: {lineText}
                </code>
              ) : (
                "—"
              )}
            </div>
          </li>
          <li>
            <strong>In plain English</strong>
            <div>{explain.what}</div>
          </li>
          <li>
            <strong>With the numbers from this step</strong>
            <div>{explain.withValues}</div>
          </li>
          <li>
            <strong>Role in the algorithm</strong>
            <div>{explain.why}</div>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="explain-panel">
      <div className="panel-label">Why this line</div>
      <p>{explain.withValues}</p>
      <p className="muted why">{explain.why}</p>
    </div>
  );
}
