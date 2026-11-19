import Link from "next/link";
import { AppNav } from "@/components/AppNav";

export default function HomePage() {
  return (
    <div className="app-shell">
      <AppNav />
      <main className="hub">
        <p className="hub-kicker">AlgoLens Studio</p>
        <h1 className="hub-title">Learn the pattern. Then step the solution.</h1>
        <p className="hub-lede">
          Study recurring algorithm patterns with animated stages, then open a
          related problem — or paste any solution and visualize it line by line.
        </p>
        <div className="hub-actions">
          <Link href="/study" className="hub-card">
            <span className="hub-card-kicker">Path 1</span>
            <span className="hub-card-title">Study algorithms</span>
            <span className="hub-card-body">
              Pick a pattern like Sliding Window, scrub an animated lesson, then
              practice on tagged problems.
            </span>
          </Link>
          <Link href="/visualize" className="hub-card">
            <span className="hub-card-kicker">Path 2</span>
            <span className="hub-card-title">Visualize a solution</span>
            <span className="hub-card-body">
              Paste your own code or load an example and step through the real
              data structures.
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
