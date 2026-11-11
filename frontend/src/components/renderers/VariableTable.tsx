"use client";

import { formatValue, plainFromTyped } from "@/lib/format";
import type { Change, TypedValue } from "@/lib/trace-types";

type Props = {
  locals: Record<string, TypedValue>;
  changes: Change[];
  muteUnchanged?: boolean;
};

export function VariableTable({ locals, changes, muteUnchanged }: Props) {
  const changed = new Set(changes.map((c) => c.name));
  const names = Object.keys(locals).sort();

  return (
    <div className="renderer-block">
      <div className="renderer-title">Variables</div>
      <table className="var-table">
        <thead>
          <tr>
            <th>name</th>
            <th>type</th>
            <th>value</th>
          </tr>
        </thead>
        <tbody>
          {names.map((name) => {
            const tv = locals[name];
            const isChanged = changed.has(name);
            const muted = muteUnchanged && !isChanged;
            return (
              <tr
                key={name}
                className={`${isChanged ? "flash" : ""} ${muted ? "muted" : ""}`}
              >
                <td>{name}</td>
                <td>{tv.type}</td>
                <td>{formatValue(plainFromTyped(tv))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
