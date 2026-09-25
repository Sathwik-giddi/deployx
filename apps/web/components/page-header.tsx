import type { ReactNode } from "react";
import Link from "next/link";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  simulation?: boolean;
}

export function PageHeader({ eyebrow, title, description, actions, simulation = true }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="text-xs font-bold text-muted">{eyebrow}</p>
          {simulation ? (
            <span className="rounded-md bg-amber-soft px-2 py-1 text-xs font-bold text-amber-ink">
              Simulation workspace
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-[clamp(2rem,4vw,3.55rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-6 text-muted md:text-base">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      {children}
    </Link>
  );
}
