"use client";

import { useEffect, useState } from "react";
import { PlaybackBar } from "@/components/visualizer/PlaybackBar";
import type { SceneFrame } from "@/lib/pattern-types";
import { getPatternStage } from "./stages/registry";

type Props = {
  patternId: string;
  frames: SceneFrame[];
};

export function PatternLesson({ patternId, frames }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const total = frames.length;
  const frame = frames[index];
  const Stage = getPatternStage(patternId);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [patternId, frames]);

  useEffect(() => {
    if (!playing || total === 0) return;
    const ms = Math.max(280, 900 / speed);
    const id = window.setInterval(() => {
      setIndex((i) => {
        if (i >= total - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, ms);
    return () => window.clearInterval(id);
  }, [playing, speed, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => Math.min(total - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  if (!frame || !Stage) {
    return (
      <p className="muted">
        No animated stage is available for this pattern yet.
      </p>
    );
  }

  return (
    <div className="pattern-lesson">
      <PlaybackBar
        index={index}
        total={total}
        playing={playing}
        speed={speed}
        mode="lines"
        storyAvailable={false}
        counterLabel={`Frame ${total ? index + 1 : 0} / ${total}`}
        onFirst={() => setIndex(0)}
        onPrev={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() => setIndex((i) => Math.min(total - 1, i + 1))}
        onLast={() => setIndex(Math.max(total - 1, 0))}
        onTogglePlay={() => setPlaying((p) => !p)}
        onSpeed={setSpeed}
        onScrub={setIndex}
        onMode={() => {}}
      />
      <Stage key={`${patternId}-${index}`} frame={frame} />
    </div>
  );
}
