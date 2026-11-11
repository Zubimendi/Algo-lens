"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VisualState } from "@/components/renderers/VisualState";
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
      setIndex(Math.max(0, Math.min(total - 1, next)));
    },
    [total],
  );

  useEffect(() => {
    if (!playing || total === 0) return;
    const ms = 700 / speed;
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
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }
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

      <div className="viz-main">
        <CodePanel code={trace.code} currentLine={step?.line ?? null} />
        <div className="viz-right">
          <div className="panel-label">Visual state</div>
          {step && (
            <VisualState
              locals={step.locals}
              changes={step.changes}
              muteUnchanged={mode === "beginner"}
            />
          )}
        </div>
      </div>

      <WhatChanged changes={step?.changes ?? []} />
      <ExplainPanel
        explain={step?.explain}
        mode={mode}
        line={step?.line ?? null}
        lineText={lineText}
      />

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

      {trace.result !== undefined && trace.result !== null && (
        <div className="result-bar">
          <span className="panel-label">Result</span>{" "}
          <code>{JSON.stringify(trace.result)}</code>
        </div>
      )}
    </div>
  );
}
