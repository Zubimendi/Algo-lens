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
      <div className="renderer-title">{name}</div>
      <div className="array-row">
        {shown.map((item, idx) => {
          const flash = highlightIndices?.has(idx);
          return (
            <div
              key={`${name}-${idx}`}
              className={`array-cell ${flash ? "flash" : ""}`}
            >
              <div className="array-index">{idx}</div>
              <div className="array-value">{formatValue(item)}</div>
            </div>
          );
        })}
        {truncated && <div className="array-cell muted">…</div>}
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
  );
}
