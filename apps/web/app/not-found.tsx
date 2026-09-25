import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <section className="max-w-lg">
        <p className="text-xs font-bold text-accent">404 / Unmapped resource</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">That workspace view does not exist.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Use the operational brief to return to a discovered environment or deployment workflow.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Return to overview
        </Link>
      </section>
    </div>
  );
}
