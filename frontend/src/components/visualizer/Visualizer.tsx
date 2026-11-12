"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VisualState } from "@/components/renderers/VisualState";
import { formatValue, plainFromTyped } from "@/lib/format";
import type { LanguageId } from "@/lib/languages";
import { buildStepInsight } from "@/lib/step-insight";
import type { TraceResponse, ViewMode } from "@/lib/trace-types";
import { CodePanel } from "./CodePanel";
import { ExplainPanel } from "./ExplainPanel";
import { PlaybackBar } from "./PlaybackBar";
import { StepInsightPanel } from "./StepInsight";
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
    const ms = 900 / speed;
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

  const insight = useMemo(() => {
    if (!step) return null;
    return buildStepInsight(lineText, step.locals, step.changes);
  }, [step, lineText]);

  const resultSoFar = useMemo(() => {
    if (!step) return undefined;
    for (const key of ["result", "ans", "answer", "output", "res"]) {
      if (key in step.locals) return plainFromTyped(step.locals[key]);
    }
    return undefined;
  }, [step]);

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
        Go one line at a time. Read the green <strong>This step</strong> panel
        before clicking Next — it shows the real numbers behind the line.
      </p>

      <StepInsightPanel
        insight={insight}
        stepLabel={`Step ${index + 1}/${total} · line ${step?.line ?? "?"}`}
      />

      {resultSoFar !== undefined && (
        <div className="running-result">
          <span className="panel-label">Result so far</span>
          <code>{formatValue(resultSoFar)}</code>
          {index < total - 1 && (
            <span className="muted">
              {" "}
              — watch this grow; final answer appears at the last step
            </span>
          )}
        </div>
      )}

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
          <span className="panel-label">Final result (end of run)</span>{" "}
          <code>{JSON.stringify(trace.result)}</code>
          {index === total - 1 ? (
            <span className="muted"> — you are on the last step</span>
          ) : (
            <span className="muted">
              {" "}
              — compare with “Result so far” to see how extras got appended
            </span>
          )}
        </div>
      )}
    </div>
  );
}
