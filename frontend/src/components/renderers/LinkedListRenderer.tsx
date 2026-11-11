"use client";

import { formatValue } from "@/lib/format";

type Props = {
  name: string;
  nodes: unknown[];
  pointers: Record<string, number>;
};

export function LinkedListRenderer({ name, nodes, pointers }: Props) {
  const shown = nodes.slice(0, 50);

  return (
    <div className="renderer-block">
      <div className="renderer-title">{name}</div>
      <div className="ll-row">
        {shown.length === 0 && <div className="ll-null">None</div>}
        {shown.map((val, idx) => {
          const labels = Object.entries(pointers)
            .filter(([, pos]) => pos === idx)
            .map(([label]) => label);
          return (
            <div key={`${name}-node-${idx}`} className="ll-node-wrap">
              <div className="ll-node">
                <div className="ll-val">{formatValue(val)}</div>
                <div className="ll-next">→</div>
              </div>
              <div className="ll-pointers">
                {labels.map((label) => (
                  <span key={label} className="pointer-label">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {shown.length > 0 && <div className="ll-null">None</div>}
      </div>
    </div>
  );
}
