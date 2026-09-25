import Link from "next/link";

interface StatePanelProps {
  kind: "empty" | "loading" | "error";
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

const kindLabel = {
  empty: "No matching data",
  loading: "Loading data",
  error: "Data unavailable",
};

export function StatePanel({ kind, title, description, actionHref, actionLabel }: StatePanelProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
      aria-busy={kind === "loading"}
      className="flex min-h-56 flex-col items-start justify-center rounded-xl border border-dashed border-line bg-surface p-6 md:p-8"
    >
      <div className="mb-5 flex items-center gap-3" aria-hidden="true">
        <span className={`h-3 w-3 rounded-sm ${kind === "error" ? "bg-danger" : kind === "loading" ? "bg-amber" : "bg-muted"}`} />
        <span className="h-px w-12 bg-line" />
      </div>
      <p className="mb-2 text-xs font-bold text-muted">{kindLabel[kind]}</p>
      <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-line bg-panel px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
