import { POINTER_NAMES } from "./format";
import type { Change, Step } from "./trace-types";

export type StoryBeat = {
  stepIndex: number;
  reason: string;
};

export type PlaybackMode = "story" | "lines";

const ANSWER_NAMES =
  /^(result|ans|answer|output|res|out|best|max|maxi|mini|count)$/i;
const STRUCTURE_TYPES = new Set([
  "list",
  "tuple",
  "dict",
  "set",
  "matrix",
  "linked_list",
  "tree",
  "stack",
  "queue",
  "heap",
  "str",
]);

const MAX_BEATS = 36;

function isMeaningfulChange(c: Change): boolean {
  if (c.kind === "removed") return true;
  if (c.kind === "added") {
    return (
      ANSWER_NAMES.test(c.name) ||
      POINTER_NAMES.has(c.name) ||
      /^(left|right|lo|hi|start|end|slow|fast|window|seen|last|counts|freq)$/i.test(
        c.name,
      )
    );
  }
  if (c.before === c.after) return false;
  return true;
}

function scoreStep(
  step: Step,
  prev: Step | null,
): { score: number; reason: string } {
  if (step.event === "return") {
    return { score: 100, reason: "Return" };
  }

  const meaningful = (step.changes || []).filter(isMeaningfulChange);
  if (meaningful.length === 0) {
    return { score: 0, reason: "" };
  }

  let score = 0;
  const reasons: string[] = [];

  for (const c of meaningful) {
    if (ANSWER_NAMES.test(c.name)) {
      score += 40;
      reasons.push(`Update ${c.name}`);
    } else if (
      POINTER_NAMES.has(c.name) ||
      /^(left|right|lo|hi|start|end|slow|fast|L|R)$/i.test(c.name)
    ) {
      score += 26;
      reasons.push(`Move ${c.name}`);
    } else {
      const tv = step.locals[c.name];
      if (tv && STRUCTURE_TYPES.has(tv.type)) {
        score += 35;
        reasons.push(`Change ${c.name}`);
      } else if (c.kind === "removed") {
        score += 20;
        reasons.push(`Drop ${c.name}`);
      } else {
        score += 12;
        reasons.push(`Change ${c.name}`);
      }
    }
  }

  if (prev && Math.abs(step.line - prev.line) > 3) {
    score += 8;
    if (!reasons.length) reasons.push("Phase shift");
  }

  if (step.explain?.what) score += 5;

  return { score, reason: reasons[0] || "Key step" };
}

/**
 * Collapse a full line-level trace into teaching beats for Story mode.
 * Always keeps first + last; prefers structural / pointer / answer / return steps.
 */
export function buildStoryBeats(steps: Step[]): StoryBeat[] {
  if (steps.length === 0) return [];
  if (steps.length <= 12) {
    return steps.map((_, i) => ({
      stepIndex: i,
      reason: i === 0 ? "Start" : i === steps.length - 1 ? "Finish" : "Step",
    }));
  }

  const scored: { index: number; score: number; reason: string }[] = [];
  for (let i = 0; i < steps.length; i++) {
    if (i === 0) {
      scored.push({ index: 0, score: 1000, reason: "Start" });
      continue;
    }
    if (i === steps.length - 1) {
      scored.push({ index: i, score: 1000, reason: "Finish" });
      continue;
    }
    const { score, reason } = scoreStep(steps[i], steps[i - 1]);
    if (score > 0) scored.push({ index: i, score, reason });
  }

  if (scored.length < 8) {
    const stride = Math.max(1, Math.floor(steps.length / 16));
    for (let i = 0; i < steps.length; i += stride) {
      if (!scored.some((s) => s.index === i)) {
        scored.push({ index: i, score: 1, reason: "Checkpoint" });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  const keep = new Map<number, string>();
  keep.set(0, "Start");
  keep.set(steps.length - 1, "Finish");

  for (const row of scored) {
    if (keep.size >= MAX_BEATS) break;
    let tooClose = false;
    for (const k of keep.keys()) {
      if (k !== row.index && Math.abs(k - row.index) <= 1) {
        tooClose = true;
        break;
      }
    }
    if (tooClose && row.score < 40) continue;
    if (!keep.has(row.index)) keep.set(row.index, row.reason);
  }

  const indices = [...keep.keys()].sort((a, b) => a - b);
  const withCheckpoints: number[] = [];
  for (let i = 0; i < indices.length; i++) {
    withCheckpoints.push(indices[i]);
    if (i === indices.length - 1) break;
    const a = indices[i];
    const b = indices[i + 1];
    if (b - a > 14 && keep.size < MAX_BEATS) {
      const mid = Math.floor((a + b) / 2);
      if (!keep.has(mid)) {
        keep.set(mid, "Continue");
        withCheckpoints.push(mid);
      }
    }
  }

  const finalIndices = [...new Set(withCheckpoints)].sort((a, b) => a - b);
  return finalIndices.map((stepIndex) => ({
    stepIndex,
    reason: keep.get(stepIndex) || "Key step",
  }));
}

export function beatIndexForStep(
  beats: StoryBeat[],
  stepIndex: number,
): number {
  if (!beats.length) return 0;
  let best = 0;
  let bestDist = Math.abs(beats[0].stepIndex - stepIndex);
  for (let i = 1; i < beats.length; i++) {
    const d = Math.abs(beats[i].stepIndex - stepIndex);
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  }
  return best;
}

export function snapToBeat(beats: StoryBeat[], stepIndex: number): number {
  if (!beats.length) return stepIndex;
  return beats[beatIndexForStep(beats, stepIndex)].stepIndex;
}

export function skippedBetween(beats: StoryBeat[], beatIndex: number): number {
  if (beatIndex <= 0 || beatIndex >= beats.length) return 0;
  return Math.max(
    0,
    beats[beatIndex].stepIndex - beats[beatIndex - 1].stepIndex - 1,
  );
}
