"use client";

import { formatValue } from "@/lib/format";

type Props = {
  name: string;
  entries: { key: unknown; value: unknown }[];
  changedKeys?: Set<string>;
};

export function DictRenderer({ name, entries, changedKeys }: Props) {
  const shown = entries.slice(0, 50);

  return (
    <div className="renderer-block">
      <div className="renderer-title">{name}</div>
      {shown.length === 0 ? (
        <div className="muted">{"{}"} empty</div>
      ) : (
        <table className="dict-table">
          <thead>
            <tr>
              <th>key</th>
              <th>value</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => {
              const keyStr = String(row.key);
              const flash = changedKeys?.has(keyStr);
              return (
                <tr key={keyStr} className={flash ? "flash" : undefined}>
                  <td>{formatValue(row.key)}</td>
                  <td>{formatValue(row.value)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
