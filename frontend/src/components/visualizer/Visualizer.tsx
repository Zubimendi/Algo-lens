"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VisualState } from "@/components/renderers/VisualState";
import { formatValue, plainFromTyped } from "@/lib/format";
import type { LanguageId } from "@/lib/languages";
import { buildStepInsight } from "@/lib/step-insight";
import {
  beatIndexForStep,
  buildStoryBeats,
  skippedBetween,
  snapToBeat,
  type PlaybackMode,
} from "@/lib/story-beats";
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
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("story");

  const beats = useMemo(
    () => buildStoryBeats(trace.steps),
    [trace.steps],
  );
  const storyAvailable =
    trace.steps.length > 12 && beats.length < trace.steps.length;

  const totalLines = trace.steps.length;
  const beatIdx = beatIndexForStep(beats, stepIndex);
  const step = trace.steps[stepIndex];

  // Navigation list depends on mode
  const navCount = playbackMode === "story" ? beats.length : totalLines;
  const navIndex = playbackMode === "story" ? beatIdx : stepIndex;

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
    setPlaybackMode(trace.steps.length > 12 ? "story" : "lines");
  }, [trace]);

  const goToStep = useCallback(
    (next: number) => {
      if (totalLines === 0) return;
      setPlaying(false);
      setStepIndex(Math.max(0, Math.min(totalLines - 1, next)));
    },
    [totalLines],
  );

  const goNav = useCallback(
    (nextNav: number) => {
      setPlaying(false);
      if (playbackMode === "story") {
        const clamped = Math.max(0, Math.min(beats.length - 1, nextNav));
        setStepIndex(beats[clamped]?.stepIndex ?? 0);
      } else {
        goToStep(nextNav);
      }
    },
    [playbackMode, beats, goToStep],
  );

  const setMode = useCallback(
    (next: PlaybackMode) => {
      setPlaying(false);
      setPlaybackMode(next);
      if (next === "story") {
        setStepIndex((i) => snapToBeat(beats, i));
      }
    },
    [beats],
  );

  useEffect(() => {
    if (!playing || navCount === 0) return;
    // Story holds a beat longer so it feels like a watchable sequence
    const base = playbackMode === "story" ? 1400 : 900;
    const ms = base / speed;
    const id = window.setInterval(() => {
      if (playbackMode === "story") {
        setStepIndex((prev) => {
          const bi = beatIndexForStep(beats, prev);
          if (bi >= beats.length - 1) {
            setPlaying(false);
            return prev;
          }
          return beats[bi + 1].stepIndex;
        });
      } else {
        setStepIndex((prev) => {
          if (prev >= totalLines - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }
    }, ms);
    return () => window.clearInterval(id);
  }, [playing, speed, playbackMode, beats, navCount, totalLines]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNav(navIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goNav(navIndex - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNav, navIndex]);

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

  const skipped = skippedBetween(beats, beatIdx);
  const chapter =
    playbackMode === "story" ? beats[beatIdx]?.reason : undefined;

  const counterLabel =
    playbackMode === "story"
      ? `Beat ${beatIdx + 1}/${beats.length} · line ${step?.line ?? "?"}`
      : `Step ${stepIndex + 1}/${totalLines} · line ${step?.line ?? "?"}`;

  if (totalLines === 0) {
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
        index={navIndex}
        total={navCount}
        playing={playing}
        speed={speed}
        mode={storyAvailable ? playbackMode : "lines"}
        storyAvailable={storyAvailable}
        counterLabel={counterLabel}
        chapterLabel={chapter}
        onFirst={() => goNav(0)}
        onPrev={() => goNav(navIndex - 1)}
        onNext={() => goNav(navIndex + 1)}
        onLast={() => goNav(navCount - 1)}
        onTogglePlay={() => setPlaying((p) => !p)}
        onSpeed={setSpeed}
        onScrub={goNav}
        onMode={setMode}
      />
      <p className="playback-hint">
        {playbackMode === "story" && storyAvailable ? (
          <>
            <strong>Story</strong> plays the teaching spine (
            {beats.length} beats from {totalLines} lines). Press{" "}
            <strong>Play</strong> for a watchable pass, or{" "}
            <strong>Pause</strong> on any beat. Switch to{" "}
            <strong>All lines</strong> when you want every step.
            {skipped > 0 && (
              <>
                {" "}
                <span className="muted">
                  (skipped {skipped} routine line
                  {skipped === 1 ? "" : "s"} since the last beat)
                </span>
              </>
            )}
          </>
        ) : (
          <>
            Go one line at a time. Read the green <strong>This step</strong>{" "}
            panel before clicking Next — it shows the real numbers behind the
            line.
          </>
        )}
      </p>

      <StepInsightPanel
        insight={insight}
        stepLabel={
          playbackMode === "story" && storyAvailable
            ? `${chapter ?? "Beat"} · ${counterLabel}`
            : counterLabel
        }
      />

      {resultSoFar !== undefined && (
        <div className="running-result">
          <span className="panel-label">Result so far</span>
          <code>{formatValue(resultSoFar)}</code>
          {stepIndex < totalLines - 1 && (
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
              key={`state-${step.index}-${playbackMode}`}
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
          {stepIndex === totalLines - 1 ? (
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
