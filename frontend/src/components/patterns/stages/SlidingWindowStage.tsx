"use client";

import type { SceneFrame } from "@/lib/pattern-types";
import { formatValue } from "@/lib/format";

type Props = {
  frame: SceneFrame;
};

export function SlidingWindowStage({ frame }: Props) {
  const items = frame.array ?? [];
  const n = Math.max(items.length, 1);
  const [winL, winR] = frame.window ?? [-1, -1];
  const hasWindow = winL >= 0 && winR >= winL;
  const highlights = new Set(frame.highlights ?? []);
  const pointers = frame.pointers ?? {};
  const counters = frame.counters ?? {};

  const bandLeft = hasWindow ? `${(winL / n) * 100}%` : "0%";
  const bandWidth = hasWindow ? `${((winR - winL + 1) / n) * 100}%` : "0%";

  return (
    <div className="pattern-stage sliding-window-stage">
      <div className="stage-track-wrap" style={{ ["--n" as string]: n }}>
        {hasWindow && (
          <div
            className={[
              "window-band",
              frame.valid === false ? "window-band-invalid" : "",
              frame.valid === true ? "window-band-valid" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ left: bandLeft, width: bandWidth }}
            aria-hidden
          />
        )}
        <div className="stage-array">
          {items.map((item, idx) => {
            const inWindow = hasWindow && idx >= winL && idx <= winR;
            const pointed = Object.entries(pointers)
              .filter(([, pos]) => pos === idx)
              .map(([label]) => label);
            const lit = highlights.has(idx);
            return (
              <div key={idx} className="stage-col">
                <div
                  className={[
                    "stage-cell cell-3d",
                    inWindow ? "stage-cell-window" : "",
                    lit ? "stage-cell-lit" : "",
                    frame.valid === false && inWindow ? "stage-cell-invalid" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="array-index">[{idx}]</div>
                  <div className="array-value">{formatValue(item)}</div>
                </div>
                <div className="pointer-slot">
                  {pointed.map((label) => (
                    <span key={label} className="pointer-badge">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stage-counters">
        {Object.entries(counters).map(([key, value]) => (
          <div key={key} className="stage-counter-chip">
            <span className="panel-label">{key}</span>
            <code>{formatValue(value)}</code>
          </div>
        ))}
        {frame.valid != null && (
          <div
            className={`stage-counter-chip ${
              frame.valid ? "chip-valid" : "chip-invalid"
            }`}
          >
            <span className="panel-label">invariant</span>
            <code>{frame.valid ? "holds" : "broken"}</code>
          </div>
        )}
      </div>

      <p className="stage-note">{frame.note}</p>
    </div>
  );
}
