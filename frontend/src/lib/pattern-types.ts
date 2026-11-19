import type { ProblemSummary } from "./trace-types";

export type SceneFrame = {
  array: unknown[];
  pointers: Record<string, number>;
  window?: number[] | null;
  highlights?: number[];
  counters?: Record<string, unknown>;
  note: string;
  valid?: boolean | null;
};

export type PatternSummary = {
  id: string;
  title: string;
  blurb: string;
  tags: string[];
  complexity: string;
};

export type PatternDetail = PatternSummary & {
  when: string[];
  whenNot: string[];
  telltales: string[];
  lesson: SceneFrame[];
  relatedProblems: ProblemSummary[];
};
