import { Suspense } from "react";
import { HomeEditor } from "@/components/editor/HomeEditor";

export default function VisualizePage() {
  return (
    <Suspense fallback={<div className="app-shell muted">Loading editor…</div>}>
      <HomeEditor />
    </Suspense>
  );
}
