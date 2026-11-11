"use client";

import { formatValue } from "@/lib/format";
import type { Change } from "@/lib/trace-types";

type Props = {
  changes: Change[];
};

export function WhatChanged({ changes }: Props) {
  return (
    <div className="what-changed">
      <div className="panel-label">What changed this step</div>
      {changes.length === 0 ? (
        <div className="muted">No variable changes this step.</div>
      ) : (
        <div className="change-list">
          {changes.map((c) => (
            <span key={`${c.name}-${c.kind}`} className="change-chip">
              <strong>{c.name}</strong>
              {c.kind === "added" && (
                <>
                  {" "}
                  added → {formatValue(c.after)}
                </>
              )}
              {c.kind === "removed" && (
                <>
                  {" "}
                  removed ({formatValue(c.before)})
                </>
              )}
              {c.kind === "changed" && (
                <>
                  : {formatValue(c.before)} → {formatValue(c.after)}
                </>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
