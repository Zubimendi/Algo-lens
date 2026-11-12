"use client";

import type { StepInsight as Insight } from "@/lib/step-insight";

type Props = {
  insight: Insight | null;
  stepLabel: string;
};

export function StepInsightPanel({ insight, stepLabel }: Props) {
  if (!insight) return null;

  const hasReads = insight.reads.length > 0;
  const hasWrites = insight.writes.length > 0;

  return (
    <div className="step-insight">
      <div className="insight-top">
        <div className="panel-label">This step</div>
        <div className="insight-meta">{stepLabel}</div>
      </div>
      <div className="insight-headline">{insight.headline}</div>
      {insight.detail && <p className="insight-detail">{insight.detail}</p>}

      {(hasReads || hasWrites) && (
        <div className="insight-grid">
          {hasReads && (
            <div className="insight-card">
              <div className="insight-col-label">Reading</div>
              <ul className="insight-list">
                {insight.reads.map((r) => (
                  <li key={r.label}>
                    <span className="insight-key">{r.label}</span>
                    <span className="insight-val">{r.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasWrites && (
            <div className="insight-card insight-card-write">
              <div className="insight-col-label">Changing</div>
              <ul className="insight-list">
                {insight.writes.map((w) => (
                  <li key={w.label}>
                    <span className="insight-key">{w.label}</span>
                    <span className="insight-val">{w.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
