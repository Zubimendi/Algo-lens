"use client";

import { formatValue } from "@/lib/format";
import type { Change } from "@/lib/trace-types";

type Props = {
  changes: Change[];
};

export function WhatChanged({ changes }: Props) {
  // Prefer real mutations; if the only rows are first-frame "added", show a short summary
  const meaningful = changes.filter((c) => c.kind === "changed" || c.kind === "removed");
  const shown = meaningful.length > 0 ? meaningful : changes.slice(0, 4);

  return (
    <div className="what-changed">
      <div className="panel-label">What changed this step</div>
      {changes.length === 0 ? (
        <div className="muted">No variable changes this step.</div>
      ) : (
        <div className="change-list">
          {shown.map((c) => (
            <div key={`${c.name}-${c.kind}`} className="change-chip">
              <strong>{c.name}</strong>
              {c.kind === "added" && (
                <>
                  {" "}
                  added → <span className="value-wrap">{formatValue(c.after)}</span>
                </>
              )}
              {c.kind === "removed" && (
                <>
                  {" "}
                  removed (
                  <span className="value-wrap">{formatValue(c.before)}</span>)
                </>
              )}
              {c.kind === "changed" && (
                <>
                  : <span className="value-wrap">{formatValue(c.before)}</span>
                  {" → "}
                  <span className="value-wrap">{formatValue(c.after)}</span>
                </>
              )}
            </div>
          ))}
          {meaningful.length === 0 && changes.length > shown.length && (
            <div className="muted">+{changes.length - shown.length} more locals entered scope</div>
          )}
        </div>
      )}
    </div>
  );
}
