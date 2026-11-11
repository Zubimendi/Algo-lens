export type TypedValue = {
  type: string;
  value: unknown;
  id?: number | null;
  truncated?: boolean;
  length?: number;
};

export type Change = {
  name: string;
  before: unknown;
  after: unknown;
  kind: "changed" | "added" | "removed";
};

export type Explain = {
  what: string;
  withValues: string;
  why: string;
};

export type Step = {
  index: number;
  line: number;
  event: string;
  frame: string;
  locals: Record<string, TypedValue>;
  changes: Change[];
  explain?: Explain | null;
  stdout?: string;
};

export type TraceResponse = {
  schemaVersion: number;
  problem?: { id: string; title: string } | null;
  language?: string;
  code: string;
  input: Record<string, unknown>;
  steps: Step[];
  result: unknown;
  error?: string | null;
  capped?: boolean;
};

export type ProblemSummary = {
  id: string;
  title: string;
  description: string;
  rendererFocus: string[];
};

export type ProblemExample = {
  label: string;
  input: Record<string, unknown>;
  expected?: unknown;
};

export type ProblemDetail = ProblemSummary & {
  starterCode: string;
  examples: ProblemExample[];
};

export type ViewMode = "beginner" | "standard";
