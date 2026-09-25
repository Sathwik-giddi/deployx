"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <section className="w-full max-w-xl rounded-xl border border-danger/40 bg-panel p-6 md:p-8">
        <p className="text-xs font-bold text-danger">Workspace error</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">This view could not load.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          The simulated workspace data stayed local. Retry this view, or return to the operational brief.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Retry this view
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Return to overview
          </Link>
        </div>
      </section>
    </div>
  );
}
