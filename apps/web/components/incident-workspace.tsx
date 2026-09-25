"use client";

import { useMemo, useState } from "react";
import { PageHeader, PrimaryLink, SecondaryLink } from "@/components/page-header";
import { StatePanel } from "@/components/state-panel";
import { StatusMark } from "@/components/status";
import { activeIncident } from "@/lib/demo-data";

type QueueFilter = "all" | "open" | "contained";
type IncidentState = "Investigating" | "Acknowledged" | "Contained" | "Resolved";
type Signal = (typeof activeIncident.evidence)[number]["signal"];

const incidentStatus: Record<IncidentState, string> = {
  Investigating: "investigating",
  Acknowledged: "pending",
  Contained: "contained",
  Resolved: "healthy",
};

const signalLabels: Record<Signal, string> = {
  change: "Change",
  degradation: "Degradation",
  correlation: "Correlation",
  scope: "Scope",
};

const signalStatus: Record<Signal, string> = {
  change: "warning",
  degradation: "blocked",
  correlation: "investigating",
  scope: "healthy",
};

function IncidentTimeline({ state }: { state: IncidentState }) {
  const steps: Array<{ label: string; note: string }> = [
    { label: "Investigating", note: "Signal received" },
    { label: "Acknowledged", note: "Operator owns response" },
    { label: "Contained", note: "Impact is bounded" },
    { label: "Resolved", note: "Close with evidence" },
  ];
  const activeIndex = state === "Investigating" ? 0 : state === "Acknowledged" ? 1 : state === "Contained" ? 2 : 3;

  return (
    <ol className="grid gap-3 sm:grid-cols-4" aria-label="Incident response progression">
      {steps.map((step, index) => {
        const complete = index < activeIndex;
        const current = index === activeIndex;
        return (
          <li
            key={step.label}
            aria-current={current ? "step" : undefined}
            className={`rounded-lg border p-3 ${current ? "border-accent bg-accent-soft" : complete ? "border-line bg-panel" : "border-line-soft bg-canvas"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`font-mono text-xs font-bold ${current ? "text-accent" : "text-muted"}`}>{String(index + 1).padStart(2, "0")}</span>
              {current ? <StatusMark status={incidentStatus[state]} label="Current" /> : complete ? <StatusMark status="healthy" label="Done" /> : null}
            </div>
            <p className="mt-3 text-sm font-bold text-ink">{step.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{step.note}</p>
          </li>
        );
      })}
    </ol>
  );
}

function IncidentQueue({ filter, onFilterChange, state }: { filter: QueueFilter; onFilterChange: (filter: QueueFilter) => void; state: IncidentState }) {
  const filters: Array<{ id: QueueFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "contained", label: "Contained" },
  ];

  return (
    <aside className="rounded-xl border border-line bg-panel p-5" aria-labelledby="queue-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-accent">Response queue</p>
          <h2 id="queue-title" className="mt-1 font-display text-2xl font-semibold text-ink">Active signal</h2>
        </div>
        <span className="font-mono text-xs text-muted">01</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-1 border-b border-line-soft pb-3" role="group" aria-label="Filter incident queue">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            aria-pressed={filter === item.id}
            className={`min-h-11 rounded-lg px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${filter === item.id ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-line-soft bg-canvas p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-danger-ink">{activeIncident.id}</span>
          <span className="text-xs font-bold text-muted">{activeIncident.severity} severity</span>
        </div>
        <h3 className="mt-2 text-base font-bold leading-6 text-ink">{activeIncident.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">ACME customer boundary, simulation snapshot.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3 text-xs">
          <span className="text-muted">Started {activeIncident.startedAt}</span>
          <StatusMark status={incidentStatus[state]} label={state} />
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">The queue contains only the current simulation incident. Filters change the view, not the source record.</p>
    </aside>
  );
}

function EvidenceItem({ evidence }: { evidence: (typeof activeIncident.evidence)[number] }) {
  return (
    <li className="flex flex-col gap-2 border-b border-line-soft py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <StatusMark status={signalStatus[evidence.signal]} label={signalLabels[evidence.signal]} />
        <span className="text-sm font-bold text-ink">{evidence.label}</span>
      </div>
      <span className="font-mono text-sm font-bold text-ink">{evidence.value}</span>
    </li>
  );
}

export default function IncidentWorkspace() {
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [acknowledged, setAcknowledged] = useState(false);
  const [contained, setContained] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [completedSafeguards, setCompletedSafeguards] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("The incident is visible but not yet acknowledged.");

  const incidentState: IncidentState = resolved
    ? "Resolved"
    : contained
      ? "Contained"
      : acknowledged
        ? "Acknowledged"
        : "Investigating";

  const visible = useMemo(() => {
    if (filter === "open") {
      return !contained && !resolved;
    }
    if (filter === "contained") {
      return contained && !resolved;
    }
    return true;
  }, [contained, filter, resolved]);
  const emptyFilterMessage = filter === "open"
    ? resolved ? "already resolved" : contained ? "already contained" : "still open"
    : resolved ? "already resolved" : "not yet contained";

  const acknowledge = () => {
    setAcknowledged(true);
    setFeedback("Acknowledged. The response owner can now record containment actions.");
  };

  const contain = () => {
    if (!acknowledged) {
      setFeedback("Acknowledge the incident before recording containment.");
      return;
    }
    setContained(true);
    setFeedback("Containment recorded. Keep production approval disabled while the signal settles.");
  };

  const resolve = () => {
    if (!contained) {
      setFeedback("Contain the incident before resolving it.");
      return;
    }
    setResolved(true);
    setFeedback("Resolved in the simulation. Evidence and safeguards remain available for review.");
  };

  const reset = () => {
    setAcknowledged(false);
    setContained(false);
    setResolved(false);
    setCompletedSafeguards([]);
    setFilter("all");
    setFeedback("The incident has been reset to the ACME simulation snapshot.");
  };

  const toggleSafeguard = (id: string) => {
    setCompletedSafeguards((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const recordAllSafeguards = () => {
    setCompletedSafeguards(activeIncident.remediation.map((_, index) => `remediation-${index}`));
    setFeedback("All listed containment safeguards are recorded in the simulation workspace.");
  };

  return (
    <>
      <PageHeader
        eyebrow="Incident response / ACME simulation"
        title="Bound the blast radius."
        description="Acknowledge the signal, record containment, and preserve the evidence trail. This workspace contains simulation values only."
        simulation={true}
        actions={
          <>
            <SecondaryLink href="/deployments">Open deployment plan</SecondaryLink>
            <PrimaryLink href="/lab">Inspect lab state</PrimaryLink>
          </>
        }
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(18rem,0.62fr)_minmax(0,1.38fr)]" aria-label="Incident workspace">
        <IncidentQueue filter={filter} onFilterChange={setFilter} state={incidentState} />

        <div className="min-w-0 rounded-xl border border-line bg-panel p-4 md:p-6">
          {!visible ? (
            <div className="space-y-4">
              <StatePanel
                kind="empty"
                title="No incident matches this view"
                description={`The simulation incident is ${emptyFilterMessage}. Clear the filter to return to the active signal.`}
              />
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                Show all incidents
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-line-soft pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-danger-ink">{activeIncident.severity} severity</span>
                    <span className="text-xs font-bold text-muted">Detected {activeIncident.detectedAt}</span>
                    <StatusMark status={incidentStatus[incidentState]} label={incidentState} />
                  </div>
                  <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink">{activeIncident.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">Probable cause: {activeIncident.probableCause}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!acknowledged ? (
                    <button type="button" onClick={acknowledge} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Acknowledge incident</button>
                  ) : !contained ? (
                    <button type="button" onClick={contain} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Contain incident</button>
                  ) : !resolved ? (
                    <button type="button" onClick={resolve} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Mark incident resolved</button>
                  ) : (
                    <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Reset simulation</button>
                  )}
                  {acknowledged && !resolved ? (
                    <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Reset</button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5">
                <IncidentTimeline state={incidentState} />
              </div>

              <div className="mt-5 border-t border-line-soft pt-5" aria-live="polite">
                <p className="text-sm leading-6 text-ink">{feedback}</p>
              </div>

              <div className="mt-5 grid gap-5 border-t border-line-soft pt-5 xl:grid-cols-2">
                <section aria-labelledby="evidence-title">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-accent">ACME simulation evidence</p>
                      <h3 id="evidence-title" className="mt-1 font-display text-xl font-semibold text-ink">What changed</h3>
                    </div>
                    <span className="font-mono text-xs font-bold text-muted">Confidence {activeIncident.confidence}%</span>
                  </div>
                  <ul className="mt-4">
                    {activeIncident.evidence.map((evidence) => (
                      <EvidenceItem key={evidence.id} evidence={evidence} />
                    ))}
                  </ul>
                </section>

                <section aria-labelledby="scope-title">
                  <p className="text-xs font-bold text-accent">Observed scope</p>
                  <h3 id="scope-title" className="mt-1 font-display text-xl font-semibold text-ink">Affected surfaces</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-muted">Services</p>
                      <ul className="mt-2 space-y-2">
                        {activeIncident.affectedServices.map((service) => <li key={service} className="border-l-2 border-danger pl-3 text-sm text-ink">{service}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted">Workflows</p>
                      <ul className="mt-2 space-y-2">
                        {activeIncident.affectedWorkflows.map((workflow) => <li key={workflow} className="border-l-2 border-accent pl-3 text-sm text-ink">{workflow}</li>)}
                      </ul>
                    </div>
                  </div>
                </section>
              </div>

              <section className="mt-5 border-t border-line-soft pt-5" aria-labelledby="safeguards-title">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-xs font-bold text-accent">Containment record</p>
                    <h3 id="safeguards-title" className="mt-1 font-display text-xl font-semibold text-ink">Record safeguards</h3>
                  </div>
                  <button
                    type="button"
                    onClick={recordAllSafeguards}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  >
                    Record all safeguards
                  </button>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">These are the simulated actions from the incident record. Mark each one as it is applied to the response plan.</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {activeIncident.remediation.map((action, index) => {
                    const id = `remediation-${index}`;
                    const checked = completedSafeguards.includes(id);
                    return (
                      <li key={action}>
                        <label className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-5 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-canvas ${checked ? "border-ok bg-ok-soft text-ok-ink" : "border-line-soft bg-surface text-ink hover:border-line"}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSafeguard(id)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                          />
                          <span className="flex-1">{action}</span>
                          <StatusMark status={checked ? "healthy" : "unknown"} label={checked ? "Recorded" : "Open"} />
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs font-bold text-muted">{completedSafeguards.length} of {activeIncident.remediation.length} safeguards recorded</p>
              </section>
            </>
          )}
        </div>
      </section>
    </>
  );
}
