import { AppNav } from "@/components/AppNav";
import { PatternCatalog } from "@/components/patterns/PatternCatalog";

export default function StudyPage() {
  return (
    <div className="app-shell">
      <AppNav />
      <section className="app-section">
        <div className="section-header">
          <span className="section-kicker">Study algorithms</span>
          <h1 className="section-title">Pattern catalog</h1>
          <p className="section-subtitle">
            Learn the move first — then open a problem that uses it.
          </p>
        </div>
        <div className="section-body">
          <PatternCatalog />
        </div>
      </section>
    </div>
  );
}
