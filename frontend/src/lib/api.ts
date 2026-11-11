import type { ProblemDetail, ProblemSummary, TraceResponse } from "./trace-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

export function fetchProblems(): Promise<ProblemSummary[]> {
  return request("/api/v1/problems");
}

export function fetchProblem(id: string): Promise<ProblemDetail> {
  return request(`/api/v1/problems/${id}`);
}

export function runTrace(body: {
  code: string;
  input: Record<string, unknown> | string;
  problemId?: string | null;
}): Promise<TraceResponse> {
  return request("/api/v1/trace", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export { API_URL };
