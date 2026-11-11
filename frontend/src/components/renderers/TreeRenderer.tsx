"use client";

import { formatValue } from "@/lib/format";

type Props = {
  name: string;
  /** Level-order nodes; null = empty slot */
  nodes: (unknown | null)[];
};

export function TreeRenderer({ name, nodes }: Props) {
  const levels: (unknown | null)[][] = [];
  let i = 0;
  let levelSize = 1;
  while (i < nodes.length) {
    const level = nodes.slice(i, i + levelSize);
    levels.push(level);
    i += levelSize;
    levelSize *= 2;
  }

  return (
    <div className="renderer-block">
      <div className="renderer-title">
        {name} <span className="type-tag">tree</span>
      </div>
      <div className="tree-levels">
        {levels.map((level, li) => (
          <div key={`lvl-${li}`} className="tree-level">
            {level.map((node, ni) => (
              <div
                key={`n-${li}-${ni}`}
                className={`tree-node ${node === null || node === undefined ? "empty" : ""}`}
              >
                {node === null || node === undefined ? "·" : formatValue(node)}
              </div>
            ))}
          </div>
        ))}
        {nodes.length === 0 && <div className="muted">empty tree</div>}
      </div>
    </div>
  );
}
