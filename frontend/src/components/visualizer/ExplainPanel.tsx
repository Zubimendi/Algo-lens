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
        <div className="panel-label">Explain this line</div>
        <div className="muted">Run a trace to see explanations.</div>
      </div>
    );
  }

  if (mode === "beginner") {
    return (
      <div className="explain-panel beginner">
        <div className="panel-label">Beginner walkthrough</div>
        <ol className="beginner-steps">
          <li>
            <strong>Current line</strong>
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
            <strong>What the line does</strong>
            <div>{explain.what}</div>
          </li>
          <li>
            <strong>With current values</strong>
            <div>{explain.withValues}</div>
          </li>
          <li>
            <strong>Why this step exists</strong>
            <div>{explain.why}</div>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="explain-panel">
      <div className="panel-label">Explain this line</div>
      <p>{explain.withValues}</p>
      <p className="muted why">{explain.why}</p>
    </div>
  );
}
