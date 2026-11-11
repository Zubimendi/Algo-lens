"use client";

import { formatValue } from "@/lib/format";

type Props = {
  name: string;
  items: unknown[];
};

export function QueueRenderer({ name, items }: Props) {
  const shown = items.slice(0, 40);
  return (
    <div className="renderer-block">
      <div className="renderer-title">
        {name} <span className="type-tag">queue</span>
      </div>
      <div className="queue-row">
        <span className="queue-end">front</span>
        {shown.length === 0 && <span className="muted">empty</span>}
        {shown.map((item, idx) => (
          <div key={`${name}-q-${idx}`} className="queue-cell">
            {formatValue(item)}
          </div>
        ))}
        <span className="queue-end">back</span>
      </div>
    </div>
  );
}
