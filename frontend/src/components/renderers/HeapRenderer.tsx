"use client";

import { formatValue } from "@/lib/format";

type Props = {
  name: string;
  items: unknown[];
};

export function HeapRenderer({ name, items }: Props) {
  const shown = items.slice(0, 31);
  // Render as array + simple parent/child index hints
  return (
    <div className="renderer-block">
      <div className="renderer-title">
        {name} <span className="type-tag">heap</span>
      </div>
      <div className="array-row">
        {shown.map((item, idx) => (
          <div key={`${name}-h-${idx}`} className="array-cell">
            <div className="array-index">{idx}</div>
            <div className="array-value">{formatValue(item)}</div>
          </div>
        ))}
        {shown.length === 0 && <span className="muted">empty</span>}
      </div>
      {shown.length > 1 && (
        <div className="muted heap-hint">
          Index layout: parent(i)=⌊(i−1)/2⌋, children 2i+1 / 2i+2
        </div>
      )}
    </div>
  );
}
