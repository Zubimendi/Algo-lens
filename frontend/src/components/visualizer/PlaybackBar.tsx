"use client";

import type { PlaybackMode } from "@/lib/story-beats";

type Props = {
  index: number;
  total: number;
  playing: boolean;
  speed: number;
  mode: PlaybackMode;
  storyAvailable: boolean;
  counterLabel: string;
  chapterLabel?: string;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onTogglePlay: () => void;
  onSpeed: (speed: number) => void;
  onScrub: (index: number) => void;
  onMode: (mode: PlaybackMode) => void;
};

export function PlaybackBar({
  index,
  total,
  playing,
  speed,
  mode,
  storyAvailable,
  counterLabel,
  chapterLabel,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onTogglePlay,
  onSpeed,
  onScrub,
  onMode,
}: Props) {
  const disabled = total === 0;

  return (
    <div className="playback-stack">
      {storyAvailable && (
        <div className="playback-mode" role="group" aria-label="Playback mode">
          <button
            type="button"
            className={mode === "story" ? "mode-pill active" : "mode-pill"}
            onClick={() => onMode("story")}
          >
            Story
          </button>
          <button
            type="button"
            className={mode === "lines" ? "mode-pill active" : "mode-pill"}
            onClick={() => onMode("lines")}
          >
            All lines
          </button>
          {mode === "story" && (
            <span className="playback-mode-hint muted">
              Key teaching beats — pause anytime, or switch to All lines for
              every step
            </span>
          )}
        </div>
      )}

      <div className="playback-bar">
        <div className="playback-buttons">
          <button
            type="button"
            onClick={onFirst}
            disabled={disabled}
            title="First"
          >
            First
          </button>
          <button
            type="button"
            onClick={onPrev}
            disabled={disabled}
            title="Previous (←)"
          >
            Prev
          </button>
          <button
            type="button"
            className="primary"
            onClick={onNext}
            disabled={disabled}
            title="Next (→)"
          >
            Next
          </button>
          <button
            type="button"
            onClick={onLast}
            disabled={disabled}
            title="Last"
          >
            Last
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={disabled}
            title="Play / Pause (Space)"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <label className="speed">
            Speed
            <select
              value={speed}
              onChange={(e) => onSpeed(Number(e.target.value))}
            >
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={4}>4×</option>
            </select>
          </label>
        </div>
        <input
          className="scrubber"
          type="range"
          min={0}
          max={Math.max(total - 1, 0)}
          value={total ? index : 0}
          onChange={(e) => onScrub(Number(e.target.value))}
          disabled={disabled}
          aria-label={mode === "story" ? "Beat scrubber" : "Step scrubber"}
        />
        <div className="step-counter-wrap">
          <div className="step-counter">{counterLabel}</div>
          {chapterLabel && (
            <div className="chapter-label">{chapterLabel}</div>
          )}
        </div>
      </div>
    </div>
  );
}
