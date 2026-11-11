"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VisualState } from "@/components/renderers/VisualState";
import type { LanguageId } from "@/lib/languages";
import type { TraceResponse, ViewMode } from "@/lib/trace-types";
import { CodePanel } from "./CodePanel";
import { ExplainPanel } from "./ExplainPanel";
import { PlaybackBar } from "./PlaybackBar";
import { WhatChanged } from "./WhatChanged";

type Props = {
  trace: TraceResponse;
  mode: ViewMode;
};

export function Visualizer({ trace, mode }: Props) {
  const language = (trace.language || "python") as LanguageId;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const total = trace.steps.length;
  const step = trace.steps[index];

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [trace]);

  const go = useCallback(
    (next: number) => {
      if (total === 0) return;
      setPlaying(false);
      setIndex(Math.max(0, Math.min(total - 1, next)));
    },
    [total],
  );

  useEffect(() => {
    if (!playing || total === 0) return;
    const ms = 850 / speed;
    const id = window.setInterval(() => {
      setIndex((prev) => {
        if (prev >= total - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, ms);
    return () => window.clearInterval(id);
  }, [playing, speed, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const lines = useMemo(
    () => trace.code.replace(/\n$/, "").split("\n"),
    [trace.code],
  );
  const lineText =
    step && step.line >= 1 && step.line <= lines.length
      ? lines[step.line - 1]
      : "";

  if (total === 0) {
    return (
      <div className="visualizer empty">
        <p className="muted">
          {trace.error
            ? trace.error
            : "No steps recorded. Check your code and input."}
        </p>
        {trace.capped && (
          <p className="error">Execution hit a safety cap.</p>
        )}
      </div>
    );
  }

  return (
    <div className={`visualizer mode-${mode}`}>
      {trace.error && <div className="banner warn">{trace.error}</div>}
      {trace.capped && (
        <div className="banner warn">
          Stopped early because a step or time cap was reached.
        </div>
      )}

      <PlaybackBar
        index={index}
        total={total}
        playing={playing}
        speed={speed}
        onFirst={() => go(0)}
        onPrev={() => go(index - 1)}
        onNext={() => go(index + 1)}
        onLast={() => go(total - 1)}
        onTogglePlay={() => setPlaying((p) => !p)}
        onSpeed={setSpeed}
        onScrub={go}
      />
      <p className="playback-hint">
        Pause anytime. Use <strong>Next step</strong> / <strong>Prev</strong>,
        the scrubber, or keyboard ← → and Space to study each line.
      </p>

      <div className="viz-main">
        <CodePanel
          code={trace.code}
          currentLine={step?.line ?? null}
          language={language}
        />
        <div className="viz-right">
          <div className="panel-label">Data structures (this step)</div>
          {step && (
            <VisualState
              key={`state-${step.index}`}
              locals={step.locals}
              changes={step.changes}
              muteUnchanged={mode === "beginner"}
            />
          )}
        </div>
      </div>

      <div className="teach-grid">
        <WhatChanged changes={step?.changes ?? []} />
        <ExplainPanel
          explain={step?.explain}
          mode={mode}
          line={step?.line ?? null}
          lineText={lineText}
        />
      </div>

      {trace.result !== undefined && trace.result !== null && (
        <div className="result-bar">
          <span className="panel-label">Final result</span>{" "}
          <code>{JSON.stringify(trace.result)}</code>
          {index === total - 1 ? (
            <span className="muted"> — algorithm finished</span>
          ) : (
            <span className="muted"> — available when you reach the last step</span>
          )}
        </div>
      )}
    </div>
  );
}
