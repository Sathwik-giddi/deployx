import Link from "next/link";
import { ControlPlaneStatus } from "@/components/control-plane-status";
import { HomeMap } from "@/components/home-map";
import { PageHeader, PrimaryLink, SecondaryLink } from "@/components/page-header";
import { StatusMark } from "@/components/status";
import {
  activeIncident,
  apiEndpoints,
  compatibilityChecks,
  deploymentRecord,
  discoveryTotals,
  mappingSuggestions,
} from "@/lib/demo-data";

const evidenceTimeline = [
  {
    code: "MAP",
    title: "Legacy customer mapping prepared",
    detail: "Five canonical field suggestions are waiting for human review.",
    href: "/data",
  },
  {
    code: "API",
    title: "Legacy SOAP contract changed",
    detail: "A service account response now includes an optional region field.",
    href: "/apis",
  },
  {
    code: "IAM",
    title: "Warehouse write policy removed",
    detail: "The production workload role no longer includes the reviewed write binding.",
    href: "/deployments",
  },
] as const;

export default function OverviewPage() {
  const blockers = compatibilityChecks.filter((check) => check.blocking);
  const warnings = compatibilityChecks.filter((check) => check.status === "warning");
  const pendingMappings = mappingSuggestions.filter((mapping) => mapping.status === "pending");
  const observedEndpoints = apiEndpoints.filter((endpoint) => endpoint.discoveryStatus === "observed");

  return (
    <>
      <PageHeader
        eyebrow="Operational brief / ACME production"
        title="Production has three deployment blockers."
        description="DEPLOYX traced the release path through customer data, event delivery, and the warehouse boundary. Resolve the failed preflight checks before promotion."
        actions={
          <>
            <PrimaryLink href="/deployments">Resolve deployment blockers</PrimaryLink>
            <SecondaryLink href="/topology">Inspect blast radius</SecondaryLink>
          </>
        }
      />

      <section aria-labelledby="discovery-heading" className="surface-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            <h2 id="discovery-heading" className="font-display text-2xl font-semibold text-ink">
              Discovered estate
            </h2>
            <p className="mt-1 text-sm text-muted">Simulation snapshot from connected cloud, data, and API evidence.</p>
          </div>
          <StatusMark status="warning" label="Action required" />
        </div>
        <dl className="grid grid-cols-2 border-line sm:grid-cols-4 lg:grid-cols-7">
          {discoveryTotals.map((item, index) => (
            <div
              key={item.label}
              className={`min-w-0 px-4 py-4 sm:px-5 ${index < discoveryTotals.length - 1 ? "border-r border-line-soft" : ""}`}
            >
              <dt className="text-xs font-bold leading-5 text-muted">{item.label}</dt>
              <dd className="mt-1 font-mono text-2xl font-bold text-ink">{item.value}</dd>
              <dd className="mt-1 truncate text-[11px] text-muted">{item.provider}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]">
        <section className="surface-panel min-w-0 p-4 md:p-6" aria-labelledby="topology-preview-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold text-accent">Customer graph / Production</p>
              <h2 id="topology-preview-heading" className="mt-1 font-display text-2xl font-semibold text-ink">
                Customer data reaches three operational surfaces
              </h2>
            </div>
            <Link
              href="/topology"
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Inspect full graph
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-line-soft bg-canvas p-2 sm:p-4">
            <HomeMap />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft pt-4 text-xs text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber" aria-hidden="true" />
              Salesforce rate limits elevated
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-danger" aria-hidden="true" />
              Snowflake egress blocked
            </span>
          </div>
        </section>

        <section className="surface-panel flex min-w-0 flex-col" aria-labelledby="preflight-heading">
          <div className="border-b border-line px-5 py-4">
            <p className="text-xs font-bold text-accent">Next decision</p>
            <h2 id="preflight-heading" className="mt-1 font-display text-2xl font-semibold text-ink">
              Production promotion is blocked
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {blockers.length} failed checks and {warnings.length} warnings need a recorded FDE decision.
            </p>
          </div>
          <ol className="divide-y divide-line-soft">
            {blockers.map((check, index) => (
              <li key={check.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-danger-soft font-mono text-xs font-bold text-danger-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold leading-5 text-ink">{check.label}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted">{check.remediation}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-auto border-t border-line bg-canvas p-4">
            <PrimaryLink href="/deployments">Open remediation plan</PrimaryLink>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <section className="surface-panel" aria-labelledby="evidence-heading">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 md:px-6">
            <div>
              <p className="text-xs font-bold text-accent">Recent evidence</p>
              <h2 id="evidence-heading" className="mt-1 font-display text-2xl font-semibold text-ink">
                Changes that affect this deployment
              </h2>
            </div>
            <span className="text-xs font-bold text-muted">ACME-LAB</span>
          </div>
          <div className="divide-y divide-line-soft">
            {evidenceTimeline.map((event) => (
              <Link
                key={event.code}
                href={event.href}
                className="grid min-h-20 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent md:px-6"
              >
                <span className="flex h-10 w-11 items-center justify-center rounded-md border border-line bg-surface font-mono text-xs font-bold text-ink">
                  {event.code}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">{event.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{event.detail}</span>
                </span>
                <span className="text-sm font-bold text-accent">Open</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="surface-panel flex flex-col" aria-labelledby="incident-preview-heading">
          <div className="border-b border-line px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-accent">Active incident / {activeIncident.id}</p>
              <StatusMark status="investigating" label={activeIncident.state} />
            </div>
            <h2 id="incident-preview-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
              {activeIncident.title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Probable cause: {activeIncident.probableCause} at {activeIncident.confidence}% confidence.
            </p>
          </div>
          <dl className="grid grid-cols-2 divide-x divide-line-soft border-b border-line-soft">
            <div className="p-4">
              <dt className="text-xs font-bold text-muted">Onset</dt>
              <dd className="mt-1 font-mono text-lg font-bold text-ink">{activeIncident.startedAt}</dd>
            </div>
            <div className="p-4">
              <dt className="text-xs font-bold text-muted">Affected workflows</dt>
              <dd className="mt-1 font-mono text-lg font-bold text-ink">{activeIncident.affectedWorkflows.length}</dd>
            </div>
          </dl>
          <div className="mt-auto p-4">
            <SecondaryLink href="/incidents">Review incident evidence</SecondaryLink>
          </div>
        </section>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]" aria-labelledby="deployment-snapshot-heading">
        <div className="surface-panel p-5 md:p-6">
          <p className="text-xs font-bold text-accent">Last simulated deployment</p>
          <h2 id="deployment-snapshot-heading" className="mt-1 font-display text-2xl font-semibold text-ink">
            {deploymentRecord.id} / {deploymentRecord.version}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Customer graph release completed with canary checks and retained its previous rollback target.
          </p>
          <div className="mt-5">
            <StatusMark status={deploymentRecord.status} label="Canary retained" />
          </div>
        </div>
        <dl className="surface-panel grid grid-cols-2 overflow-hidden sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Requests", deploymentRecord.requests],
            ["Success", deploymentRecord.successRate],
            ["P95 latency", deploymentRecord.p95Latency],
            ["Errors", deploymentRecord.errorRate],
            ["Run cost", deploymentRecord.cost],
            ["Endpoints", String(observedEndpoints.length)],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={`min-w-0 px-4 py-5 ${index < 5 ? "border-b border-line-soft sm:border-b-0 sm:border-r" : ""}`}
            >
              <dt className="text-xs font-bold text-muted">{label}</dt>
              <dd className="mt-2 truncate font-mono text-lg font-bold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-6 text-xs leading-5 text-muted">
        All customer names, resources, evidence, and measurements in this workspace are an explicit ACME-LAB simulation.
        Pending mappings: {pendingMappings.length}.
      </p>
      <ControlPlaneStatus />
    </>
  );
}
