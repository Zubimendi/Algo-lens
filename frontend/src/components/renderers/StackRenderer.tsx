"use client";

import { formatValue } from "@/lib/format";

type Props = {
  name: string;
  items: unknown[];
};

export function StackRenderer({ name, items }: Props) {
  const shown = items.slice(-20);
  return (
    <div className="renderer-block">
      <div className="renderer-title">
        {name} <span className="type-tag">stack</span>
      </div>
      <div className="stack-col">
        <div className="stack-end-label">top</div>
        {[...shown].reverse().map((item, idx) => (
          <div key={`${name}-s-${idx}`} className="stack-cell">
            {formatValue(item)}
          </div>
        ))}
        {shown.length === 0 && <div className="muted">empty</div>}
        <div className="stack-end-label">bottom</div>
      </div>
    </div>
  );
}
