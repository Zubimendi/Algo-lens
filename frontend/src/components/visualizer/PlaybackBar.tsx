"use client";

type Props = {
  index: number;
  total: number;
  playing: boolean;
  speed: number;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onTogglePlay: () => void;
  onSpeed: (speed: number) => void;
  onScrub: (index: number) => void;
};

export function PlaybackBar({
  index,
  total,
  playing,
  speed,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onTogglePlay,
  onSpeed,
  onScrub,
}: Props) {
  const disabled = total === 0;

  return (
    <div className="playback-bar">
      <div className="playback-buttons">
        <button type="button" onClick={onFirst} disabled={disabled}>
          |&lt;
        </button>
        <button type="button" onClick={onPrev} disabled={disabled}>
          &lt;
        </button>
        <button type="button" className="primary" onClick={onNext} disabled={disabled}>
          Next &gt;
        </button>
        <button type="button" onClick={onLast} disabled={disabled}>
          &gt;|
        </button>
        <button type="button" onClick={onTogglePlay} disabled={disabled}>
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
      />
      <div className="step-counter">
        Step {total ? index + 1 : 0} / {total}
      </div>
    </div>
  );
}
