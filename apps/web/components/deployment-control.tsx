"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, PrimaryLink, SecondaryLink } from "@/components/page-header";
import { StatePanel } from "@/components/state-panel";
import { StatusMark } from "@/components/status";
import { compatibilityChecks, deploymentRecord } from "@/lib/demo-data";
import type { CheckStatus } from "@/lib/types";

type Phase = "preflight" | "remediation" | "ready" | "deploying" | "deployed" | "rolled-back";
type PreflightState = "complete" | "running";

const canaryStages = [1, 5, 25, 50, 100] as const;

const phaseOrder: Record<Phase, number> = {
  preflight: 0,
  remediation: 1,
  ready: 2,
  deploying: 3,
  deployed: 4,
  "rolled-back": 5,
};

const phaseDetails: Array<{ id: Phase; label: string; note: string }> = [
  { id: "preflight", label: "Preflight", note: "Read the target boundary" },
  { id: "remediation", label: "Remediate", note: "Clear blocking checks" },
  { id: "ready", label: "Gate review", note: "Confirm promotion" },
  { id: "deploying", label: "Canary deploy", note: "Move traffic in steps" },
  { id: "deployed", label: "Observed", note: "Record release health" },
  { id: "rolled-back", label: "Rollback", note: "Return to the prior release" },
];

const checkLabels: Record<CheckStatus, string> = {
  pass: "Pass",
  warning: "Warning",
  blocked: "Blocked",
};

function PhaseRail({ phase }: { phase: Phase }) {
  const activeIndex = phaseOrder[phase];

  return (
    <ol className="grid gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Deployment progression">
      {phaseDetails.map((item, index) => {
        const complete = index < activeIndex;
        const current = index === activeIndex;
        return (
          <li
            key={item.id}
            aria-current={current ? "step" : undefined}
            className={`rounded-lg border p-3 ${current ? "border-accent bg-accent-soft" : complete ? "border-line bg-panel" : "border-line-soft bg-canvas"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`font-mono text-xs font-bold ${current ? "text-accent" : "text-muted"}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              {current ? <StatusMark status="investigating" label="Current" /> : complete ? <StatusMark status="healthy" label="Done" /> : null}
            </div>
            <p className="mt-3 text-sm font-bold text-ink">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{item.note}</p>
          </li>
        );
      })}
    </ol>
  );
}

function ReleaseSummary() {
  const metrics = [
    ["Requests", deploymentRecord.requests],
    ["Success rate", deploymentRecord.successRate],
    ["P95 latency", deploymentRecord.p95Latency],
    ["Error rate", deploymentRecord.errorRate],
  ];

  return (
    <aside className="rounded-xl border border-line bg-panel p-5" aria-label="Simulation release record">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft pb-4">
        <div>
          <p className="text-xs font-bold text-muted">Simulation release record</p>
          <h2 className="mt-1 font-mono text-xl font-bold text-ink">{deploymentRecord.id}</h2>
        </div>
        <StatusMark status="healthy" label="Healthy snapshot" />
      </div>
      <div className="mt-5">
        <p className="text-xs font-bold text-muted">Version</p>
        <p className="mt-1 break-words font-mono text-sm font-bold text-ink">{deploymentRecord.version}</p>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line-soft bg-line-soft">
        {metrics.map(([label, value]) => (
          <div key={label} className="bg-panel p-3">
            <dt className="text-xs font-bold text-muted">{label}</dt>
            <dd className="mt-1 font-mono text-sm font-bold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 space-y-2 border-t border-line-soft pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">Environment</span>
          <span className="font-bold text-ink">{deploymentRecord.environment}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">Snapshot</span>
          <span className="font-mono text-xs font-bold text-ink">{deploymentRecord.startedAt}</span>
        </div>
      </div>
    </aside>
  );
}

function CheckRow({
  check,
  onApply,
}: {
  check: (typeof compatibilityChecks)[number];
  onApply: (id: string) => void;
}) {
  const resolved = check.status === "pass";

  return (
    <li className="border-t border-line-soft py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusMark status={check.status} label={checkLabels[check.status]} />
            <span className="text-xs font-bold text-muted">{check.category}</span>
          </div>
          <h3 className="mt-2 text-sm font-bold leading-5 text-ink">{check.label}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{check.detail}</p>
          {!resolved ? <p className="mt-2 rounded-lg bg-amber-soft px-3 py-2 text-xs leading-5 text-amber-ink">Fix: {check.remediation}</p> : null}
        </div>
        {resolved ? (
          <span className="inline-flex min-h-11 items-center text-xs font-bold text-ok-ink">Resolved</span>
        ) : (
          <button
            type="button"
            onClick={() => onApply(check.id)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Apply remediation
          </button>
        )}
      </div>
    </li>
  );
}

export default function DeploymentControl() {
  const [phase, setPhase] = useState<Phase>("preflight");
  const [preflightState, setPreflightState] = useState<PreflightState>("complete");
  const [preflightCleared, setPreflightCleared] = useState(false);
  const [checks, setChecks] = useState(compatibilityChecks);
  const [canaryStep, setCanaryStep] = useState(0);
  const [feedback, setFeedback] = useState("Preflight evidence is loaded from the simulation snapshot.");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const blockers = useMemo(() => checks.filter((check) => check.status === "blocked"), [checks]);
  const warnings = useMemo(() => checks.filter((check) => check.status === "warning"), [checks]);
  const passCount = checks.length - blockers.length - warnings.length;
  const canPromote = blockers.length === 0;

  const runPreflight = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setPreflightState("running");
    setPreflightCleared(false);
    setFeedback("Running a simulated preflight against the ACME target boundary.");
    timerRef.current = window.setTimeout(() => {
      setPreflightState("complete");
      setPreflightCleared(true);
      setPhase("remediation");
      setFeedback(
        blockers.length > 0
          ? `Preflight complete. ${blockers.length} blocking checks need remediation before promotion.`
          : "Preflight complete. The target boundary is ready for gate review.",
      );
    }, 650);
  };

  const applyRemediation = (id: string) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPreflightState("complete");
    const resolvedStatus: CheckStatus = "pass";
    setChecks((current) => current.map((check) => (check.id === id ? { ...check, status: resolvedStatus } : check)));
    setPreflightCleared(false);
    setPhase("remediation");
    setFeedback("Remediation recorded in the simulation workspace. Re-run preflight before promotion.");
  };

  const applyAllRemediations = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPreflightState("complete");
    const resolvedStatus: CheckStatus = "pass";
    setChecks((current) => current.map((check) => (check.status === "blocked" || check.status === "warning" ? { ...check, status: resolvedStatus } : check)));
    setPreflightCleared(false);
    setPhase("remediation");
    setFeedback("All available remediations recorded. Re-run preflight before opening the gate.");
  };

  const openGate = () => {
    if (!canPromote) {
      setFeedback("Resolve every blocking check before opening the promotion gate.");
      return;
    }
    if (!preflightCleared) {
      setFeedback("Run a fresh preflight after remediation before opening the promotion gate.");
      return;
    }
    setPhase("ready");
    setFeedback("Gate review opened. Confirm the canary before moving traffic.");
  };

  const startCanary = () => {
    if (phase !== "ready") {
      return;
    }
    setPhase("deploying");
    setCanaryStep(1);
    setFeedback("Canary deploy started at 1 percent of the simulated target traffic.");
  };

  const advanceCanary = () => {
    if (phase !== "deploying") {
      return;
    }
    const currentIndex = canaryStages.indexOf(canaryStep as (typeof canaryStages)[number]);
    const nextStep = canaryStages[Math.min(currentIndex + 1, canaryStages.length - 1)];
    setCanaryStep(nextStep);
    if (nextStep === 100) {
      setPhase("deployed");
      setFeedback("Canary completed. The simulation is marked observed and ready for review.");
    } else {
      setFeedback(`Canary advanced to ${nextStep} percent. Continue only while checks remain clear.`);
    }
  };

  const triggerRollback = () => {
    setPhase("rolled-back");
    setCanaryStep(0);
    setFeedback("The simulated error rate crossed the 0.5 percent threshold at 50 percent traffic. DEPLOYX returned traffic to the prior release.");
  };

  const resetRehearsal = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setChecks(compatibilityChecks);
    setPhase("preflight");
    setPreflightState("complete");
    setPreflightCleared(false);
    setCanaryStep(0);
    setFeedback("Rehearsal reset to the original ACME simulation snapshot.");
  };

  return (
    <>
      <PageHeader
        eyebrow="Release control / ACME simulation"
        title="Make the next change observable."
        description="Read the release boundary, record the fix, then move a canary through a deliberate operational sequence. Every value on this page is simulation data."
        simulation={true}
        actions={
          <>
            <SecondaryLink href="/incidents">Review incident context</SecondaryLink>
            <PrimaryLink href="/lab">Open fault lab</PrimaryLink>
          </>
        }
      />

      {checks.length === 0 ? (
        <StatePanel
          kind="empty"
          title="No preflight checks are available"
          description="The simulation data source returned no checks. Reset the workspace or inspect the incident queue for related context."
        />
      ) : (
        <>
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]" aria-label="Release overview">
            <div className="rounded-xl border border-line bg-panel p-4 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line-soft pb-5">
                <div>
                  <p className="text-xs font-bold text-accent">Operational timeline</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Release progression</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusMark status="healthy" label={`${passCount} pass`} />
                  <StatusMark status={warnings.length > 0 ? "warning" : "healthy"} label={`${warnings.length} warning`} />
                  <StatusMark status={blockers.length > 0 ? "blocked" : "healthy"} label={`${blockers.length} blocking`} />
                </div>
              </div>
              <div className="mt-5">
                <PhaseRail phase={phase} />
              </div>
              <div className="mt-5 flex flex-col gap-3 border-t border-line-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-3xl text-sm leading-6 text-muted" aria-live="polite">{feedback}</p>
                <div className="flex flex-wrap gap-2">
                  {phase === "preflight" || phase === "remediation" ? (
                    <button
                      type="button"
                      onClick={runPreflight}
                      disabled={preflightState === "running"}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-wait disabled:opacity-60"
                    >
                      {preflightState === "running" ? "Preflight running" : "Run preflight"}
                    </button>
                  ) : null}
                  {phase === "remediation" && canPromote && preflightCleared ? (
                    <button
                      type="button"
                      onClick={openGate}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      Open gate review
                    </button>
                  ) : null}
                  {phase === "ready" ? (
                    <button
                      type="button"
                      onClick={startCanary}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      Start deploy canary at 1%
                    </button>
                  ) : null}
                {phase === "deploying" ? (
                  <>
                    <button
                      type="button"
                      onClick={advanceCanary}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      Advance canary to {canaryStages[Math.min(canaryStages.indexOf(canaryStep as (typeof canaryStages)[number]) + 1, canaryStages.length - 1)]}%
                    </button>
                    {canaryStep === 50 ? (
                      <button
                        type="button"
                        onClick={triggerRollback}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-danger bg-danger-soft px-4 text-sm font-bold text-danger-ink transition-colors hover:bg-danger hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                      >
                        Simulate error threshold
                      </button>
                    ) : null}
                  </>
                ) : null}
                {phase === "deployed" || phase === "rolled-back" ? (
                  <button
                    type="button"
                    onClick={resetRehearsal}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  >
                    Reset rehearsal
                  </button>
                ) : null}
                </div>
              </div>
            </div>
            <ReleaseSummary />
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]" aria-label="Deployment evidence">
            <div className="rounded-xl border border-line bg-panel p-4 md:p-6">
              <div className="flex flex-col gap-3 border-b border-line-soft pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-accent">Evidence register</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Preflight checks</h2>
                </div>
                {phase === "remediation" && (blockers.length > 0 || warnings.length > 0) ? (
                  <button
                    type="button"
                    onClick={applyAllRemediations}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  >
                    Record all fixes
                  </button>
                ) : null}
              </div>
              <ul className="mt-5">
                {checks.map((check) => (
                  <CheckRow key={check.id} check={check} onApply={applyRemediation} />
                ))}
              </ul>
            </div>

            <aside className="rounded-xl border border-line bg-panel p-5" aria-labelledby="gate-title">
              <p className="text-xs font-bold text-accent">Gate conditions</p>
              <h2 id="gate-title" className="mt-1 font-display text-2xl font-semibold text-ink">Promotion boundary</h2>
              <p className="mt-3 text-sm leading-6 text-muted">The simulated gate stays closed while any blocking check remains unresolved.</p>
              <div className="mt-5 space-y-3 border-t border-line-soft pt-5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Blocking checks</span>
                  <StatusMark status={blockers.length > 0 ? "blocked" : "healthy"} label={blockers.length === 0 ? "Clear" : `${blockers.length} open`} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Warnings</span>
                  <StatusMark status={warnings.length > 0 ? "warning" : "healthy"} label={warnings.length === 0 ? "Clear" : String(warnings.length)} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Canary traffic</span>
                  <span className="font-mono text-sm font-bold text-ink">{canaryStep}%</span>
                </div>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3 text-xs text-muted">
                  <span>Rollout position</span>
                  <span className="font-mono">
                    {phase === "deployed" ? "Complete" : phase === "rolled-back" ? "Rolled back" : "In progress"}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-lg bg-line-soft" role="progressbar" aria-label="Canary rollout" aria-valuemin={0} aria-valuemax={100} aria-valuenow={canaryStep}>
                  <div className="h-2 rounded-lg bg-accent transition-[width] duration-300" style={{ width: `${canaryStep}%` }} />
                </div>
              </div>
              <div className="mt-5 border-t border-line-soft pt-5">
                <p className="text-xs leading-5 text-muted">Simulation scope</p>
                <p className="mt-1 break-words font-mono text-xs leading-5 text-ink">customer-graph-1.8.0 / ACME / Production</p>
              </div>
            </aside>
          </section>
        </>
      )}
    </>
  );
}
