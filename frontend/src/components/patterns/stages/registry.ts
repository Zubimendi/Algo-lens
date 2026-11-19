import type { ComponentType } from "react";
import type { SceneFrame } from "@/lib/pattern-types";
import { SlidingWindowStage } from "./SlidingWindowStage";

export type StageProps = {
  frame: SceneFrame;
};

const STAGES: Record<string, ComponentType<StageProps>> = {
  sliding_window: SlidingWindowStage,
};

export function getPatternStage(
  patternId: string,
): ComponentType<StageProps> | null {
  return STAGES[patternId] ?? null;
}
