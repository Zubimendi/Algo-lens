"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPatterns } from "@/lib/api";
import type { PatternSummary } from "@/lib/pattern-types";

export function PatternCatalog() {
  const [patterns, setPatterns] = useState<PatternSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatterns()
      .then(setPatterns)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="muted">Loading patterns…</p>;
  }

  if (error) {
    return (
      <div className="banner error">
        <pre className="error-pre">{error}</pre>
      </div>
    );
  }

  if (patterns.length === 0) {
    return <p className="muted">No patterns published yet.</p>;
  }

  return (
    <div className="pattern-grid">
      {patterns.map((p) => (
        <Link key={p.id} href={`/study/${p.id}`} className="pattern-card">
          <span className="pattern-card-title">{p.title}</span>
          <span className="pattern-card-blurb">{p.blurb}</span>
          <span className="pattern-card-meta">
            {p.complexity || "—"}
            {p.tags?.length ? ` · ${p.tags.join(", ")}` : ""}
          </span>
        </Link>
      ))}
    </div>
  );
}
