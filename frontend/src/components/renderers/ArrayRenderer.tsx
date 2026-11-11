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
        {name}{" "}
        <span className="type-tag">array · {items.length}</span>
      </div>
      <div className="array-scroll" tabIndex={0} aria-label={`${name} array`}>
        <div className="array-track">
          {shown.map((item, idx) => {
            const flash = highlightIndices?.has(idx);
            const labels = Object.entries(pointers)
              .filter(([, pos]) => pos === idx)
              .map(([label]) => label);
            return (
              <div key={`${name}-${idx}`} className="array-col">
                <div
                  className={`cell-3d ${flash ? "flash" : ""}`}
                  style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}
                >
                  <div className="array-index">{idx}</div>
                  <div className="array-value">{formatValue(item)}</div>
                </div>
                <div className="pointer-slot">
                  {labels.map((label) => (
                    <span key={label} className="pointer-label">
                      ^{label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {truncated && (
            <div className="array-col">
              <div className="cell-3d muted">
                <div className="array-index">…</div>
                <div className="array-value">+{items.length - 50}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {items.length > 6 && (
        <div className="scroll-hint muted">Scroll sideways to see every element</div>
      )}
    </div>
  );
}
