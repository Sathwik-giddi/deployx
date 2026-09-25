import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const sourceUrl = "https://github.com/Sathwik-giddi/deployx";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const socialImage = siteUrl ? `${siteUrl.replace(/\/$/, "")}/marketing/og-card.png` : undefined;

export const metadata: Metadata = {
  title: "Deployment operations for unfamiliar enterprise estates",
  description: "DEPLOYX is an open-source deployment operations workspace for discovery, integration, preflight, canary rehearsal, incident response, and deployment memory.",
  ...(socialImage
    ? {
        openGraph: {
          title: "DEPLOYX | Deployment operations",
          description: "Make an unfamiliar environment legible.",
          images: [{ url: socialImage, width: 1200, height: 630, alt: "DEPLOYX open-source deployment operations project card" }],
        },
        twitter: {
          card: "summary_large_image",
          title: "DEPLOYX | Deployment operations",
          description: "Make an unfamiliar environment legible.",
          images: [socialImage],
        },
      }
    : {}),
};

const surfaceLinks = [
  { href: "/topology", label: "Environment graph", detail: "Trace resources, dependencies, permissions, and blast radius." },
  { href: "/data", label: "Mapping workbench", detail: "Review field-level evidence before a canonical customer schema is accepted." },
  { href: "/integrations", label: "Integration studio", detail: "Configure mappings, runtime policies, and local adapter evidence." },
  { href: "/deployments", label: "Deployment control", detail: "Run preflight, remediate, and rehearse canary rollback." },
  { href: "/incidents", label: "Incident workspace", detail: "Correlate evidence while the operator remains in control." },
  { href: "/memory", label: "Deployment memory", detail: "Turn recurring failures into reusable patterns." },
] as const;

const workflowSteps = [
  { number: "01", title: "Discover", detail: "Inventory resources and dependencies." },
  { number: "02", title: "Reconcile", detail: "Review mappings and API contracts." },
  { number: "03", title: "Validate", detail: "Resolve compatibility checks." },
  { number: "04", title: "Promote", detail: "Rehearse canary stages and rollback." },
  { number: "05", title: "Respond", detail: "Record incident evidence and containment." },
  { number: "06", title: "Remember", detail: "Save a reusable deployment pattern." },
] as const;

const architectureLayers = [
  { label: "Discovery", detail: "Cloud, data, identity, and SaaS resources." },
  { label: "Customer graph", detail: "Typed dependencies and blast-radius visibility." },
  { label: "Compatibility", detail: "Network, IAM, schema, and remediation checks." },
  { label: "Integration", detail: "Canonical mappings and adapter evidence." },
  { label: "Deployment", detail: "Canary stages and rollback thresholds." },
  { label: "Release evidence", detail: "Recorded release state and boundary context." },
  { label: "Incident", detail: "Evidence-backed hypotheses and human response." },
  { label: "Memory", detail: "Playbooks, known failures, and reusable validation." },
] as const;

export default function MarketingPage() {
  return (
    <main id="marketing-content">
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-accent-soft px-2 py-1 text-xs font-bold text-accent">Open source</span>
              <span className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-bold text-muted">Simulation-first</span>
            </div>
            <p className="max-w-xl text-sm font-bold text-accent">Deployment operations for Forward Deployment Engineers</p>
            <h1 className="mt-4 max-w-3xl break-words font-display text-[clamp(2.5rem,7vw,6.8rem)] font-semibold leading-[0.9] tracking-[-0.055em] text-ink">Make an unfamiliar environment legible.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted">DEPLOYX puts discovery, integration, preflight, canary rehearsal, incident response, and deployment memory in one reviewable workspace.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex min-h-12 items-center rounded-lg bg-ink px-5 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Open the operations console</Link>
              <a href="#architecture" className="inline-flex min-h-12 items-center rounded-lg border border-line bg-surface px-5 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">View the architecture</a>
            </div>
            <p className="mt-7 max-w-lg text-sm leading-6 text-muted">ACME is fictional. The current project uses deterministic fixtures, keeps rehearsal state local, and does not connect to customer infrastructure or execute deployments.</p>
          </div>
          <div className="relative min-w-0">
            <div className="mb-3 flex items-center justify-between text-xs font-bold text-muted">
              <span>Product preview</span>
              <span className="font-mono">ACME / PRODUCTION SIMULATION</span>
            </div>
            <Image src="/marketing/console-preview.svg" alt="DEPLOYX operations console showing a production graph, deployment blockers, and an incident workspace" width={1440} height={960} priority unoptimized className="h-auto w-full rounded-xl border border-line bg-panel shadow-[0_24px_70px_rgba(23,33,31,0.16)]" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-bold text-accent">Evidence</p><p className="mt-2 text-sm leading-6 text-muted">Recorded decisions include an evidence trail.</p></div>
              <div className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-bold text-accent">Control</p><p className="mt-2 text-sm leading-6 text-muted">Suggestions never become production actions by themselves.</p></div>
              <div className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-bold text-accent">Memory</p><p className="mt-2 text-sm leading-6 text-muted">Known failures become the next starting point.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="scroll-mt-20 border-b border-line bg-panel">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="text-sm font-bold text-accent">The product surface</p>
              <h2 className="mt-3 max-w-md font-display text-4xl font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-5xl">One place for the decisions that usually get split.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-muted">The product model places discovery, data decisions, deployment gates, and incident response in one reviewable workspace. Each route currently keeps its rehearsal state local while the control-plane boundary is being wired.</p>
              <Link href="/" className="mt-7 inline-flex min-h-11 items-center font-bold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Open the operations console</Link>
            </div>
            <div className="divide-y divide-line-soft border-y border-line-soft">
              {surfaceLinks.map((surface, index) => (
                <Link key={surface.href} href={surface.href} className="group grid gap-3 py-5 transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:px-3">
                  <span className="font-mono text-xs font-bold text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <span><span className="block text-base font-bold text-ink">{surface.label}</span><span className="mt-1 block text-sm leading-6 text-muted">{surface.detail}</span></span>
                  <span className="text-sm font-bold text-accent">Open</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end lg:gap-16">
            <div>
              <p className="text-sm font-bold text-accent">Operator workflow</p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-5xl">The workflow is designed to leave a reviewable trail.</h2>
              <p className="mt-5 text-base leading-7 text-muted">A deployment is not just a successful release. It is a record of what was discovered, what was approved, what failed, and what should be checked next time.</p>
            </div>
            <ol className="mt-4 grid gap-2 xl:hidden">
              {workflowSteps.map((step) => (
                <li key={step.number} className="rounded-lg border border-line bg-panel p-4">
                  <div className="flex items-start gap-3"><span className="font-mono text-xs font-bold text-accent">{step.number}</span><span><span className="block text-sm font-bold text-ink">{step.title}</span><span className="mt-1 block text-sm leading-6 text-muted">{step.detail}</span></span></div>
                </li>
              ))}
            </ol>
            <div className="hidden overflow-x-auto xl:block">
              <Image src="/marketing/workflow.svg" alt="Six-step DEPLOYX operator workflow from discovery to deployment memory" width={1600} height={720} unoptimized className="h-auto min-w-[1100px] max-w-none rounded-xl border border-line bg-panel" />
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="scroll-mt-20 border-b border-line bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-16 lg:px-10">
          <div>
            <p className="text-sm font-bold text-accent-soft">System architecture</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">Discovery feeds operations.</h2>
            <p className="mt-5 text-base leading-7 text-white/75">The target architecture uses the customer graph as shared context. Compatibility, deployment, incident response, and memory are designed to refer back to the same resources and decisions.</p>
            <div className="mt-8 border-l-2 border-accent pl-4 text-sm leading-6 text-white/75">The repository is intentionally honest about its boundary. Live provider adapters and deployment execution are future work, not implied capabilities.</div>
          </div>
          <ul className="mt-4 grid gap-2 xl:hidden">
            {architectureLayers.map((layer) => (
              <li key={layer.label} className="rounded-lg border border-white/20 bg-white/5 p-4">
                <p className="text-sm font-bold text-white">{layer.label}</p>
                <p className="mt-1 text-sm leading-6 text-white/70">{layer.detail}</p>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto xl:block">
            <Image src="/marketing/architecture.svg" alt="DEPLOYX architecture showing discovery, customer graph, compatibility, integration, deployment, release evidence, incident, and memory layers" width={1600} height={900} unoptimized className="h-auto min-w-[1100px] max-w-none rounded-xl border border-white/20" />
          </div>
        </div>
      </section>

      <section id="open-source" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-10">
          <div>
            <p className="text-sm font-bold text-accent">Open source by design</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-5xl">A safe place to learn the hard parts.</h2>
            <p className="mt-5 text-base leading-7 text-muted">The project is built to be read, forked, and extended. The ACME-LAB makes failure modes reproducible without asking contributors to bring a customer account or production credentials.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center rounded-lg bg-ink px-5 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Read the source</a>
              <Link href="/memory" className="inline-flex min-h-12 items-center rounded-lg border border-line bg-surface px-5 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">See deployment memory</Link>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-panel p-6 sm:p-8">
            <p className="text-sm font-bold text-accent">Repository facts</p>
            <dl className="mt-6 divide-y divide-line-soft border-y border-line-soft">
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-muted">License</dt><dd className="font-mono text-sm font-bold text-ink">MIT</dd></div>
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-muted">Customer data</dt><dd className="font-mono text-sm font-bold text-ink">Fictional ACME fixtures</dd></div>
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-muted">Infrastructure access</dt><dd className="font-mono text-sm font-bold text-ink">Disabled by design</dd></div>
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-muted">Deployment execution</dt><dd className="font-mono text-sm font-bold text-ink">Simulation only</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-accent-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-14 sm:px-8 sm:py-18 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="text-sm font-bold text-accent">Start with the environment</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">Read the graph before you change the release.</h2>
          </div>
          <Link href="/topology" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg bg-ink px-5 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-accent-soft">Open the environment graph</Link>
        </div>
      </section>
    </main>
  );
}
