"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, PrimaryLink, SecondaryLink } from "@/components/page-header";
import { StatePanel } from "@/components/state-panel";
import { StatusMark } from "@/components/status";
import { labServices } from "@/lib/demo-data";
import type { LabService, ResourceStatus } from "@/lib/types";

type SweepState = "idle" | "running" | "complete";
type FaultMap = Record<string, string[]>;

function humanizeFault(fault: string) {
  return fault.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function statusLabel(status: ResourceStatus) {
  if (status === "healthy") return "Healthy";
  if (status === "warning") return "Warning";
  if (status === "critical") return "Critical";
  return "Unknown";
}

function getServiceStatus(service: LabService, activeFaults: string[]): ResourceStatus {
  if (activeFaults.length === 0) {
    return service.status;
  }
  const severeFaults = ["wrong-credentials", "corrupt-records", "expired-token", "rate-limit"];
  return activeFaults.some((fault) => severeFaults.includes(fault)) ? "critical" : "warning";
}

function ServiceRow({ service, activeFaults, status, selected, onSelect }: { service: LabService; activeFaults: string[]; status: ResourceStatus; selected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`w-full border-l-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:p-5 ${selected ? "border-accent bg-accent-soft" : "border-transparent hover:bg-canvas"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold text-muted">{service.technology}</p>
            <h3 className="mt-1 text-base font-bold leading-5 text-ink">{service.name}</h3>
          </div>
          <StatusMark status={status} label={statusLabel(status)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
          <span className="font-mono">{service.latency}</span>
          <span>{activeFaults.length === 0 ? service.message : `${activeFaults.length} fault${activeFaults.length === 1 ? "" : "s"} injected`}</span>
          {selected ? <span className="font-bold text-accent">Selected service</span> : null}
        </div>
      </button>
    </li>
  );
}

function FaultToggle({ fault, active, onToggle }: { fault: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${active ? "border-accent bg-accent text-white hover:bg-ink" : "border-line bg-surface text-ink hover:border-ink"}`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : "bg-muted"}`} aria-hidden="true" />
      <span>{humanizeFault(fault)}</span>
      <span className="text-xs font-semibold">{active ? "Active" : "Enable"}</span>
    </button>
  );
}

export default function LabControl() {
  const [faults, setFaults] = useState<FaultMap>(() => {
    const initial: FaultMap = {};
    for (const service of labServices) {
      initial[service.id] = [];
    }
    return initial;
  });
  const [selectedId, setSelectedId] = useState(labServices[0]?.id ?? "");
  const [sweepState, setSweepState] = useState<SweepState>("idle");
  const [sweepCount, setSweepCount] = useState(0);
  const [lastSweep, setLastSweep] = useState("No sweep recorded");
  const [feedback, setFeedback] = useState("Lab is at baseline. Inject a fault or run a sweep to change the simulation.");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const activeFaultCount = useMemo(() => Object.values(faults).reduce((total, serviceFaults) => total + serviceFaults.length, 0), [faults]);
  const selectedService = labServices.find((service) => service.id === selectedId) ?? labServices[0];
  const selectedFaults = selectedService ? faults[selectedService.id] ?? [] : [];
  const selectedStatus = selectedService ? getServiceStatus(selectedService, selectedFaults) : "unknown";

  const toggleFault = (serviceId: string, fault: string) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const wasActive = faults[serviceId]?.includes(fault) ?? false;
    setFaults((current) => {
      const serviceFaults = current[serviceId] ?? [];
      const nextFaults = serviceFaults.includes(fault) ? serviceFaults.filter((item) => item !== fault) : [...serviceFaults, fault];
      return { ...current, [serviceId]: nextFaults };
    });
    setSweepState("idle");
    setFeedback(`${humanizeFault(fault)} ${wasActive ? "removed from" : "injected into"} the ACME simulation.`);
  };

  const resetLab = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const next: FaultMap = {};
    for (const service of labServices) {
      next[service.id] = [];
    }
    setFaults(next);
    setSweepState("idle");
    setSweepCount(0);
    setLastSweep("No sweep recorded");
    setFeedback("Lab reset. Every simulated service is back at its baseline state.");
  };

  const runSweep = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setSweepState("running");
    setFeedback("Sweeping all simulated services and recording the current fault state.");
    timerRef.current = window.setTimeout(() => {
      setSweepState("complete");
      setSweepCount((current) => current + 1);
      setLastSweep("Just now, simulation");
      setFeedback(`Sweep complete. ${activeFaultCount} active fault${activeFaultCount === 1 ? "" : "s"} observed across the lab.`);
    }, 800);
  };

  return (
    <>
      <PageHeader
        eyebrow="Fault lab / ACME simulation"
        title="Test the boundary before production does."
        description="Inject a browser-state fault, inspect the signal, then sweep the whole simulated estate. Start the local ACME-LAB services to exercise their fault endpoints."
        simulation={true}
        actions={
          <>
            <SecondaryLink href="/incidents">Review incident response</SecondaryLink>
            <PrimaryLink href="/deployments">Open deployment plan</PrimaryLink>
          </>
        }
      />

      {labServices.length === 0 ? (
        <StatePanel kind="empty" title="No simulated services are available" description="The lab has no service fixtures to inspect. Return to the deployment workspace to review the current simulation boundary." />
      ) : (
        <>
          <section className="rounded-xl border border-line bg-panel p-4 md:p-6" aria-labelledby="sweep-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div>
                <p className="text-xs font-bold text-accent">Lab control</p>
                <h2 id="sweep-title" className="mt-1 font-display text-2xl font-semibold text-ink">Observe the current fault field</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={runSweep}
                  disabled={sweepState === "running"}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-wait disabled:opacity-60"
                >
                  {sweepState === "running" ? "Sweep running" : "Run fault sweep"}
                </button>
                <button
                  type="button"
                  onClick={resetLab}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  Reset lab
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-line-soft bg-canvas p-4">
                <p className="text-xs font-bold text-muted">Active faults</p>
                <p className="mt-2 font-mono text-2xl font-bold text-ink">{activeFaultCount}</p>
              </div>
              <div className="rounded-lg border border-line-soft bg-canvas p-4">
                <p className="text-xs font-bold text-muted">Services observed</p>
                <p className="mt-2 font-mono text-2xl font-bold text-ink">{labServices.length}</p>
              </div>
              <div className="rounded-lg border border-line-soft bg-canvas p-4">
                <p className="text-xs font-bold text-muted">Last sweep</p>
                <p className="mt-2 font-mono text-sm font-bold text-ink">{sweepState === "running" ? "Checking services" : lastSweep}</p>
              </div>
            </div>
            <p className="mt-4 rounded-lg border border-line-soft bg-canvas px-4 py-3 text-sm leading-6 text-muted" aria-live="polite">{feedback}</p>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]" aria-label="Fault lab workspace">
            <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-panel">
              <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-4 sm:px-5">
                <div>
                  <p className="text-xs font-bold text-accent">Service estate</p>
                  <h2 className="mt-1 font-display text-xl font-semibold text-ink">Select a service</h2>
                </div>
                <span className="font-mono text-xs font-bold text-muted">{labServices.length.toString().padStart(2, "0")}</span>
              </div>
              <ul className="divide-y divide-line-soft">
                {labServices.map((service) => {
                  const activeFaults = faults[service.id] ?? [];
                  return (
                    <ServiceRow
                      key={service.id}
                      service={service}
                      activeFaults={activeFaults}
                      status={getServiceStatus(service, activeFaults)}
                      selected={service.id === selectedService?.id}
                      onSelect={() => {
                        setSelectedId(service.id);
                        setFeedback(`${service.name} selected. Fault controls are ready for the simulation.`);
                      }}
                    />
                  );
                })}
              </ul>
            </div>

            <div className="min-w-0 rounded-xl border border-line bg-panel p-4 md:p-6" aria-labelledby="service-title">
              {selectedService ? (
                <>
                  <div className="flex flex-col gap-4 border-b border-line-soft pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-muted">Selected service / {selectedService.technology}</p>
                      <h2 id="service-title" className="mt-2 font-display text-3xl font-semibold leading-tight text-ink">{selectedService.name}</h2>
                      <p className="mt-3 text-sm leading-6 text-muted">{selectedService.message}.</p>
                    </div>
                    <StatusMark status={selectedStatus} label={statusLabel(selectedStatus)} />
                  </div>

                  <section className="mt-5" aria-labelledby="fault-controls-title">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                      <div>
                        <p className="text-xs font-bold text-accent">Fault controls</p>
                        <h3 id="fault-controls-title" className="mt-1 font-display text-xl font-semibold text-ink">Inject or clear a signal</h3>
                      </div>
                      <span className="font-mono text-xs font-bold text-muted">{selectedFaults.length} active on this service</span>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Choose a fault to change the simulated response. The service status updates immediately so the blast radius is visible.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedService.availableFaults.map((fault) => (
                        <FaultToggle key={fault} fault={fault} active={selectedFaults.includes(fault)} onToggle={() => toggleFault(selectedService.id, fault)} />
                      ))}
                    </div>
                  </section>

                  <section className="mt-5 border-t border-line-soft pt-5" aria-labelledby="service-state-title">
                    <p className="text-xs font-bold text-accent">Observed state</p>
                    <h3 id="service-state-title" className="mt-1 font-display text-xl font-semibold text-ink">What the lab sees</h3>
                    {selectedFaults.length > 0 ? (
                      <ul className="mt-4 space-y-2">
                        {selectedFaults.map((fault) => (
                          <li key={fault} className="flex items-start gap-3 rounded-lg border border-danger-soft bg-danger-soft p-3 text-sm leading-6 text-danger-ink">
                            <span className="text-xs font-bold">Injected</span>
                            <span>{humanizeFault(fault)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <StatePanel kind="empty" title="No injected faults" description="This service is following its baseline simulation state." />
                    )}
                  </section>

                  <div className="mt-5 grid gap-3 border-t border-line-soft pt-5 sm:grid-cols-2">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2 text-sm">
                      <span className="text-muted">Latency snapshot</span>
                      <span className="font-mono font-bold text-ink">{selectedService.latency}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2 text-sm">
                      <span className="text-muted">Sweep record</span>
                      <span className="font-mono font-bold text-ink">{sweepState === "running" ? "Checking" : sweepCount > 0 ? `${sweepCount} run${sweepCount === 1 ? "" : "s"}` : "Not run"}</span>
                    </div>
                  </div>
                </>
              ) : (
                <StatePanel kind="empty" title="No service selected" description="Choose a service from the simulated estate to inspect its fault controls." />
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
