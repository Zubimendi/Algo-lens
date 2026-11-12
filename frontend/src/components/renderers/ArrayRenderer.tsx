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
  const compact = shown.length > 0 && shown.length <= 12;

  const isOutput = /^(result|ans|answer|output|res|out)$/i.test(name);

  return (
    <div className={`renderer-block array-block ${isOutput ? "array-block-output" : ""}`}>
      <div className="renderer-title">
        {name}{" "}
        <span className="type-tag">
          {isOutput ? "output" : "array"} · {items.length}
        </span>
        {isOutput && (
          <code className="array-inline-value">{formatValue(items)}</code>
        )}
      </div>
      <div
        className={`array-scroll ${compact ? "array-scroll-wrap" : ""}`}
        tabIndex={0}
        aria-label={`${name} array`}
      >
        <div className={`array-track ${compact ? "array-track-wrap" : ""}`}>
          {shown.map((item, idx) => {
            const pointed = Object.entries(pointers)
              .filter(([, pos]) => pos === idx)
              .map(([label]) => label);
            const flash = highlightIndices?.has(idx);
            const active = pointed.length > 0;
            return (
              <div key={`${name}-${idx}`} className="array-col">
                <div
                  className={[
                    "array-cell",
                    active ? "array-cell-active" : "",
                    flash ? "array-cell-flash" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="array-index">[{idx}]</div>
                  <div className="array-value">{formatValue(item)}</div>
                </div>
                <div className="pointer-slot">
                  {pointed.map((label) => (
                    <span key={label} className="pointer-badge">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {truncated && (
            <div className="array-col">
              <div className="array-cell muted">
                <div className="array-index">…</div>
                <div className="array-value">+{items.length - 50}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {Object.keys(pointers).length > 0 && (
        <div className="pointer-legend muted">
          Pointers on this array:{" "}
          {Object.entries(pointers)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}
        </div>
      )}
      {!compact && items.length > 6 && (
        <div className="scroll-hint muted">
          Scroll sideways to see every element
        </div>
      )}
    </div>
  );
}
