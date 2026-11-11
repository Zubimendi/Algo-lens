"use client";

import { formatValue } from "@/lib/format";

type Props = {
  name: string;
  items: unknown[];
  pointers: Record<string, number>;
  highlightIndices?: Set<number>;
};

export function ArrayRenderer({
  name,
  items,
  pointers,
  highlightIndices,
}: Props) {
  const shown = items.slice(0, 50);
  const truncated = items.length > 50;

  return (
    <div className="renderer-block">
      <div className="renderer-title">
        {name} <span className="type-tag">array</span>
      </div>
      <div className="structure-stage">
        <div className="structure-row-3d">
          {shown.map((item, idx) => {
            const flash = highlightIndices?.has(idx);
            return (
              <div
                key={`${name}-${idx}`}
                className={`cell-3d ${flash ? "flash" : ""}`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="array-index">{idx}</div>
                <div className="array-value">{formatValue(item)}</div>
              </div>
            );
          })}
          {truncated && <div className="cell-3d muted">…</div>}
        </div>
        <div className="pointer-row">
          {shown.map((_, idx) => {
            const labels = Object.entries(pointers)
              .filter(([, pos]) => pos === idx)
              .map(([label]) => label);
            return (
              <div key={`ptr-${idx}`} className="pointer-slot">
                {labels.map((label) => (
                  <span key={label} className="pointer-label">
                    ^{label}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
