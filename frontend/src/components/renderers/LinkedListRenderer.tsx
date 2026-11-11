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
      <div className="renderer-title">
        {name} <span className="type-tag">linked list · {nodes.length}</span>
      </div>
      <div className="array-scroll" tabIndex={0} aria-label={`${name} linked list`}>
        <div className="ll-track">
          {shown.length === 0 && <div className="ll-null">None</div>}
          {shown.map((val, idx) => {
            const labels = Object.entries(pointers)
              .filter(([, pos]) => pos === idx)
              .map(([label]) => label);
            return (
              <div key={`${name}-node-${idx}`} className="node-3d">
                <div
                  className="node-3d-face"
                  style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
                >
                  {formatValue(val)}
                </div>
                <div className="ll-pointers">
                  {labels.map((label) => (
                    <span key={label} className="pointer-label">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="ll-arrow-3d" aria-hidden>
                  →
                </div>
              </div>
            );
          })}
          {shown.length > 0 && <div className="ll-null">None</div>}
        </div>
      </div>
      {nodes.length > 5 && (
        <div className="scroll-hint muted">Scroll sideways to see every node</div>
      )}
    </div>
  );
}
