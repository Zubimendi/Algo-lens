"use client";

import { formatValue } from "@/lib/format";

type Props = {
  name: string;
  items: unknown[];
};

export function SetRenderer({ name, items }: Props) {
  const shown = items.slice(0, 50);
  return (
    <div className="renderer-block">
      <div className="renderer-title">
        {name} <span className="type-tag">set</span>
      </div>
      <div className="chip-row">
        {shown.length === 0 && <span className="muted">∅ empty</span>}
        {shown.map((item, idx) => (
          <span key={`${name}-${idx}`} className="set-chip">
            {formatValue(item)}
          </span>
        ))}
      </div>
    </div>
  );
}
