"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { PatternLesson } from "@/components/patterns/PatternLesson";
import { fetchPattern } from "@/lib/api";
import type { PatternDetail } from "@/lib/pattern-types";

type Props = {
  patternId: string;
};

export function PatternStudy({ patternId }: Props) {
  const [pattern, setPattern] = useState<PatternDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPattern(patternId)
      .then(setPattern)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [patternId]);

  return (
    <div className="app-shell">
      <AppNav />

      {loading && <p className="muted">Loading lesson…</p>}
      {error && (
        <div className="banner error">
          <pre className="error-pre">{error}</pre>
          <p>
            <Link href="/study">Back to catalog</Link>
          </p>
        </div>
      )}

      {pattern && (
        <>
          <section className="app-section">
            <div className="section-header">
              <span className="section-kicker">Pattern lesson</span>
              <h1 className="section-title">{pattern.title}</h1>
              <p className="section-subtitle">{pattern.blurb}</p>
              {pattern.complexity && (
                <p className="muted" style={{ marginTop: "0.35rem" }}>
                  {pattern.complexity}
                </p>
              )}
            </div>
            <div className="section-body">
              <PatternLesson
                patternId={pattern.id}
                frames={pattern.lesson}
              />
            </div>
          </section>

          <section className="app-section">
            <div className="section-header">
              <span className="section-kicker">Pattern card</span>
              <h2 className="section-title">When to reach for this</h2>
            </div>
            <div className="section-body checklist-grid">
              <Checklist title="Use when" items={pattern.when} />
              <Checklist title="Not when" items={pattern.whenNot} />
              <Checklist title="Telltale signs" items={pattern.telltales} />
            </div>
          </section>

          <section className="app-section">
            <div className="section-header">
              <span className="section-kicker">Practice</span>
              <h2 className="section-title">Related problems</h2>
              <p className="section-subtitle">
                Open a problem in the visualizer — starter code and examples are
                ready to step through.
              </p>
            </div>
            <div className="section-body">
              {pattern.relatedProblems.length === 0 ? (
                <p className="muted">No tagged problems yet.</p>
              ) : (
                <ul className="related-list">
                  {pattern.relatedProblems.map((p) => (
                    <li key={p.id}>
                      <div>
                        <strong>{p.title}</strong>
                        <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                          {p.description}
                        </p>
                      </div>
                      <Link
                        className="run-btn related-cta"
                        href={`/visualize?problem=${encodeURIComponent(p.id)}`}
                      >
                        Open in Visualizer
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="checklist-card">
      <h3 className="checklist-title">{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
