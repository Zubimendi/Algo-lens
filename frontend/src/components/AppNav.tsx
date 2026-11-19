"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

type Props = {
  trailing?: ReactNode;
};

export function AppNav({ trailing }: Props) {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const active =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);
    return active ? "app-nav-link active" : "app-nav-link";
  };

  return (
    <header className="top-bar app-nav">
      <div className="brand-row">
        <Link href="/" className="brand">
          AlgoLens
        </Link>
        <nav className="app-nav-links" aria-label="Primary">
          <Link href="/study" className={linkClass("/study")}>
            Study algorithms
          </Link>
          <Link href="/visualize" className={linkClass("/visualize")}>
            Visualize a solution
          </Link>
        </nav>
      </div>
      <div className="top-controls">
        {trailing}
        <ThemeToggle />
      </div>
    </header>
  );
}
