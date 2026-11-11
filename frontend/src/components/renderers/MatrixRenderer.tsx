"use client";

import { formatValue } from "@/lib/format";

type Props = {
  name: string;
  rows: unknown[][];
};

export function MatrixRenderer({ name, rows }: Props) {
  const shown = rows.slice(0, 20).map((r) => r.slice(0, 20));
  return (
    <div className="renderer-block">
      <div className="renderer-title">
        {name}{" "}
        <span className="type-tag">
          matrix {rows.length}×{rows[0]?.length ?? 0}
        </span>
      </div>
      <div className="matrix-grid">
        {shown.map((row, r) => (
          <div key={`r-${r}`} className="matrix-row">
            <span className="matrix-row-label">{r}</span>
            {row.map((cell, c) => (
              <div key={`c-${r}-${c}`} className="matrix-cell">
                <div className="array-index">
                  {r},{c}
                </div>
                <div className="array-value">{formatValue(cell)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
