"use client";

type Props = {
  code: string;
  currentLine: number | null;
};

export function CodePanel({ code, currentLine }: Props) {
  const lines = code.replace(/\n$/, "").split("\n");

  return (
    <div className="code-panel">
      <div className="panel-label">Code</div>
      <pre className="code-pre">
        {lines.map((line, i) => {
          const lineNo = i + 1;
          const active = currentLine === lineNo;
          return (
            <div
              key={lineNo}
              className={`code-line ${active ? "active-line" : ""}`}
            >
              <span className="line-no">{lineNo}</span>
              <span className="line-text">{line || " "}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
