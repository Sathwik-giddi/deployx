import Link from "next/link";
import type { ReactNode } from "react";

const sourceUrl = "https://github.com/Sathwik-giddi/deployx";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#marketing-content"
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Skip to marketing content
      </a>
      <header className="border-b border-line bg-canvas">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/marketing" className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-xs font-black text-white">D/X</span>
            <span>
              <span className="block text-sm font-black tracking-[-0.01em]">DEPLOYX</span>
              <span className="block text-xs text-muted">Open deployment operations</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Marketing navigation">
            <a href="#product" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Product</a>
            <a href="#workflow" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Workflow</a>
            <a href="#architecture" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Architecture</a>
            <Link href="/" className="inline-flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Open console</Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-line bg-panel">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>DEPLOYX is simulation-first and open source under the MIT License.</p>
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-bold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">View source on GitHub</a>
        </div>
      </footer>
    </div>
  );
}
