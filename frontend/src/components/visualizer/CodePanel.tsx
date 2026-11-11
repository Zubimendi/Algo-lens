"use client";

import { highlightLine } from "@/lib/highlighter";
import type { LanguageId } from "@/lib/languages";

type Props = {
  code: string;
  currentLine: number | null;
  language?: LanguageId;
};

export function CodePanel({
  code,
  currentLine,
  language = "python",
}: Props) {
  const lines = code.replace(/\n$/, "").split("\n");

  return (
    <div className="code-panel">
      <div className="panel-label">Code</div>
      <pre className="code-pre">
        {lines.map((line, i) => {
          const lineNo = i + 1;
          const active = currentLine === lineNo;
          const tokens = highlightLine(line, language);
          return (
            <div
              key={lineNo}
              className={`code-line ${active ? "active-line" : ""}`}
            >
              <span className="line-no">{lineNo}</span>
              <span className="line-text">
                {tokens.length === 0 ? (
                  " "
                ) : (
                  tokens.map((t, ti) => (
                    <span key={ti} className={`tok tok-${t.kind}`}>
                      {t.text}
                    </span>
                  ))
                )}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
