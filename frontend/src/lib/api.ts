import type { PatternDetail, PatternSummary } from "./pattern-types";
import type { ProblemDetail, ProblemSummary, TraceResponse } from "./trace-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8005";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail =
        typeof body.detail === "string"
          ? body.detail
          : body.detail?.detail || JSON.stringify(body.detail) || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function fetchProblems(pattern?: string): Promise<ProblemSummary[]> {
  const qs = pattern ? `?pattern=${encodeURIComponent(pattern)}` : "";
  return request(`/api/v1/problems${qs}`);
}

export function fetchProblem(id: string): Promise<ProblemDetail> {
  return request(`/api/v1/problems/${id}`);
}

export function fetchPatterns(): Promise<PatternSummary[]> {
  return request("/api/v1/patterns");
}

export function fetchPattern(id: string): Promise<PatternDetail> {
  return request(`/api/v1/patterns/${id}`);
}

export function runTrace(body: {
  code: string;
  input: Record<string, unknown> | string;
  problemId?: string | null;
  language?: string;
}): Promise<TraceResponse> {
  return request("/api/v1/trace", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export { API_URL };
