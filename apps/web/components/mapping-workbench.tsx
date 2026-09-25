"use client";

import { PageHeader } from "@/components/page-header";
import { StatePanel } from "@/components/state-panel";
import { mappingSuggestions } from "@/lib/demo-data";
import type { MappingStatus, MappingSuggestion } from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

const statusLabels: Record<MappingStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const statusBadgeStyles: Record<MappingStatus, string> = {
  pending: "border-amber/40 bg-amber-soft text-amber-ink",
  approved: "border-ok/40 bg-ok-soft text-ok-ink",
  rejected: "border-danger/40 bg-danger-soft text-danger-ink",
};

const tabs = [
  { id: "workbench", label: "Mapping workbench" },
  { id: "decisions", label: "Decision ledger" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function mappingMatches(mapping: MappingSuggestion, query: string) {
  return [
    mapping.source,
    mapping.sourceTable,
    mapping.sourceField,
    mapping.sourceType,
    mapping.targetField,
    mapping.targetType,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function MappingWorkbench() {
  const [mappings, setMappings] = useState(mappingSuggestions);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MappingStatus>("all");
  const [minimumConfidence, setMinimumConfidence] = useState(0);
  const [selectedId, setSelectedId] = useState(mappingSuggestions[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<TabId>("workbench");
  const [announcement, setAnnouncement] = useState("Mapping workbench ready.");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMappings = useMemo(
    () =>
      mappings.filter(
        (mapping) =>
          (statusFilter === "all" || mapping.status === statusFilter) &&
          mapping.confidence >= minimumConfidence &&
          mappingMatches(mapping, normalizedQuery),
      ),
    [mappings, minimumConfidence, normalizedQuery, statusFilter],
  );
  const selectedMapping =
    filteredMappings.find((mapping) => mapping.id === selectedId) ?? filteredMappings[0] ?? null;
  const decisionMappings = mappings.filter((mapping) => mapping.status !== "pending");
  const counts = useMemo(
    () =>
      mappings.reduce(
        (result, mapping) => ({ ...result, [mapping.status]: result[mapping.status] + 1 }),
        { pending: 0, approved: 0, rejected: 0 } as Record<MappingStatus, number>,
      ),
    [mappings],
  );
  const hasFilters =
    normalizedQuery.length > 0 || statusFilter !== "all" || minimumConfidence > 0;

  useEffect(() => {
    const nextMapping = filteredMappings.find((mapping) => mapping.id === selectedId) ?? filteredMappings[0];
    if (nextMapping) {
      if (nextMapping.id !== selectedId) {
        setSelectedId(nextMapping.id);
      }
      setAnnouncement(`${nextMapping.sourceField} selected.`);
    } else {
      setAnnouncement("No mappings match the current filters.");
    }
  }, [filteredMappings, selectedId]);

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setMinimumConfidence(0);
    setAnnouncement("Mapping filters cleared.");
  };

  const selectMapping = (mapping: MappingSuggestion) => {
    setSelectedId(mapping.id);
    setAnnouncement(`${mapping.sourceField} selected for review.`);
  };

  const updateDecision = (id: string, status: Exclude<MappingStatus, "pending">) => {
    const mapping = mappings.find((item) => item.id === id);
    if (!mapping) return;
    setMappings((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    setAnnouncement(`${mapping.sourceField} ${status === "approved" ? "approved" : "rejected"}.`);
  };

  const reopenMapping = (mapping: MappingSuggestion) => {
    if (mapping.status !== "rejected") {
      setAnnouncement("Approved mappings are locked in this simulation.");
      return;
    }
    setMappings((current) =>
      current.map((item) => (item.id === mapping.id ? { ...item, status: "pending" } : item)),
    );
    setAnnouncement(`${mapping.sourceField} returned to pending review.`);
  };

  const inspectMapping = (mapping: MappingSuggestion) => {
    setQuery("");
    setStatusFilter("all");
    setMinimumConfidence(0);
    setSelectedId(mapping.id);
    setActiveTab("workbench");
    setAnnouncement(`${mapping.sourceField} opened in the workbench.`);
    window.setTimeout(() => document.getElementById("mapping-detail-title")?.focus(), 0);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextId = tabs[nextIndex].id;
    setActiveTab(nextId);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <>
      <PageHeader
        eyebrow="Data discovery"
        title="Mapping workbench"
        description="Review canonical customer field mappings inferred for the simulated ACME migration. Confidence values, evidence, and decisions are simulation data held in this browser session."
        simulation={true}
      />

      <div className="space-y-6">
        <dl className="grid grid-cols-3 overflow-hidden rounded-xl border border-line bg-panel">
          {(["pending", "approved", "rejected"] as MappingStatus[]).map((item, index) => (
            <div key={item} className={`min-w-0 px-4 py-4 ${index < 2 ? "border-r border-line-soft" : ""}`}>
              <dt className="text-xs font-bold text-muted">{statusLabels[item]}</dt>
              <dd className="mt-1 font-mono text-2xl font-bold text-ink">{counts[item]}</dd>
            </div>
          ))}
        </dl>

        <div className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-muted-soft p-1" role="tablist" aria-label="Mapping workspace views">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const count = tab.id === "workbench" ? mappings.length : decisionMappings.length;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${tab.id}-tab`}
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "bg-panel text-ink" : "text-muted hover:bg-surface hover:text-ink"}`}
              >
                {tab.label} <span className="ml-1 font-mono text-xs">{count}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "workbench" ? (
          <section id="workbench-panel" role="tabpanel" aria-labelledby="workbench-tab">
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_27rem]">
              <div className="min-w-0 space-y-4">
                <section aria-labelledby="mapping-filters-title" className="rounded-xl border border-line bg-panel p-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_12rem_minmax(0,1fr)] xl:items-end">
                    <div>
                      <label id="mapping-filters-title" htmlFor="mapping-search" className="text-xs font-bold text-muted">
                        Search fields and targets
                      </label>
                      <input
                        id="mapping-search"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Source, table, field, or target"
                        className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-muted hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
                      />
                    </div>
                    <div>
                      <label htmlFor="mapping-status-filter" className="text-xs font-bold text-muted">Decision state</label>
                      <select
                        id="mapping-status-filter"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as "all" | MappingStatus)}
                        className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
                      >
                        <option value="all">All decisions</option>
                        {(Object.keys(statusLabels) as MappingStatus[]).map((item) => (
                          <option key={item} value={item}>{statusLabels[item]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <label htmlFor="confidence-filter" className="text-xs font-bold text-muted">Minimum confidence</label>
                        <output htmlFor="confidence-filter" className="font-mono text-xs font-bold text-ink">{minimumConfidence}%</output>
                      </div>
                      <input
                        id="confidence-filter"
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={minimumConfidence}
                        onChange={(event) => setMinimumConfidence(Number(event.target.value))}
                        className="mt-3 h-11 w-full cursor-pointer accent-accent outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3 text-xs text-muted">
                    <p aria-live="polite">{filteredMappings.length} of {mappings.length} simulation mappings shown</p>
                    {hasFilters ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                </section>

                <section aria-labelledby="mapping-list-title" className="overflow-hidden rounded-xl border border-line bg-panel">
                  <div className="border-b border-line px-4 py-4 sm:px-5">
                    <h2 id="mapping-list-title" className="font-display text-xl font-semibold text-ink">Suggested field paths</h2>
                    <p className="mt-1 text-sm text-muted">Select a mapping to inspect evidence and record a local decision.</p>
                  </div>
                  {filteredMappings.length === 0 ? (
                    <div className="p-4 sm:p-5">
                      <StatePanel
                        kind="empty"
                        title="No mappings match these filters"
                        description="The current confidence threshold or decision filter excludes every simulated field suggestion."
                      />
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-4 min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-line-soft">
                      {filteredMappings.map((mapping) => {
                        const isSelected = mapping.id === selectedMapping?.id;
                        return (
                          <button
                            key={mapping.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => selectMapping(mapping)}
                            className={`grid min-h-24 w-full gap-3 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center sm:px-5 ${isSelected ? "bg-accent-soft" : "bg-panel hover:bg-surface"}`}
                          >
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="truncate font-mono text-sm font-bold text-ink">{mapping.sourceField}</span>
                                <span className="text-muted">to</span>
                                <span className="truncate font-mono text-sm font-bold text-ink">{mapping.targetField}</span>
                              </span>
                              <span className="mt-2 block truncate text-xs text-muted">
                                {mapping.source}.{mapping.sourceTable} / {mapping.sourceType} to {mapping.targetType}
                              </span>
                            </span>
                            <span className="sm:text-right">
                              <span className="block font-mono text-base font-bold text-ink">{mapping.confidence}%</span>
                              <span className={`mt-1 inline-block rounded-md border px-2 py-1 text-xs font-bold ${statusBadgeStyles[mapping.status]}`}>
                                {isSelected ? `Selected / ${statusLabels[mapping.status]}` : statusLabels[mapping.status]}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              <aside aria-labelledby="mapping-detail-title" className="min-w-0 rounded-xl border border-line bg-panel xl:sticky xl:top-20 xl:self-start">
                {selectedMapping ? (
                  <MappingDetail
                    mapping={selectedMapping}
                    onApprove={() => updateDecision(selectedMapping.id, "approved")}
                    onReject={() => updateDecision(selectedMapping.id, "rejected")}
                    onReopen={() => reopenMapping(selectedMapping)}
                  />
                ) : (
                  <div className="p-4">
                    <StatePanel
                      kind="empty"
                      title="No mapping selected"
                      description="Clear the filters or lower the confidence threshold to inspect a simulated field path."
                    />
                  </div>
                )}
              </aside>
            </div>
          </section>
        ) : (
          <section id="decisions-panel" role="tabpanel" aria-labelledby="decisions-tab">
            <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <section aria-labelledby="decision-ledger-title" className="overflow-hidden rounded-xl border border-line bg-panel">
                <div className="border-b border-line px-4 py-4 sm:px-5">
                  <h2 id="decision-ledger-title" className="font-display text-xl font-semibold text-ink">Recorded decisions</h2>
                  <p className="mt-1 text-sm text-muted">A client-side ledger for this browser session.</p>
                </div>
                {decisionMappings.length === 0 ? (
                  <div className="p-4 sm:p-5">
                    <StatePanel
                      kind="empty"
                      title="No decisions recorded"
                      description="Approve or reject a field suggestion in the workbench. The local decision will appear here."
                    />
                    <button
                      type="button"
                      onClick={() => setActiveTab("workbench")}
                      className="mt-4 min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Review pending mappings
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-line-soft">
                    {decisionMappings.map((mapping) => (
                      <article key={mapping.id} className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusBadgeStyles[mapping.status]}`}>
                              {statusLabels[mapping.status]}
                            </span>
                            <span className="font-mono text-xs text-muted">{mapping.confidence}% simulation confidence</span>
                          </div>
                          <h3 className="mt-2 truncate font-mono text-sm font-bold text-ink">{mapping.sourceField} to {mapping.targetField}</h3>
                          <p className="mt-1 truncate text-xs text-muted">{mapping.sourceTable} to the customer canonical schema</p>
                        </div>
                        <div className="flex gap-2 sm:justify-end">
                          <button
                            type="button"
                            onClick={() => inspectMapping(mapping)}
                            className="min-h-11 flex-1 rounded-lg border border-line bg-surface px-3 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none"
                          >
                            Inspect
                          </button>
                          {mapping.status === "rejected" ? (
                            <button
                              type="button"
                              onClick={() => reopenMapping(mapping)}
                              className="min-h-11 flex-1 rounded-lg bg-ink px-3 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:flex-none"
                            >
                              Reopen
                            </button>
                          ) : (
                            <span className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-line bg-surface px-3 text-sm font-bold text-muted sm:flex-none">
                              Approved mapping locked
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <aside className="rounded-xl border border-line bg-ink p-5 text-white">
                <p className="text-xs font-bold text-white/70">Session state</p>
                <h2 className="mt-2 font-display text-xl font-semibold">Decision controls</h2>
                <p className="mt-3 text-sm leading-6 text-white/75">These actions update local state only. No mapping is written to an ACME system.</p>
                <dl className="mt-6 divide-y divide-white/20 border-y border-white/20">
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-sm text-white/75">Approved</dt>
                    <dd className="font-mono text-lg font-bold">{counts.approved}</dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-sm text-white/75">Rejected</dt>
                    <dd className="font-mono text-lg font-bold">{counts.rejected}</dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-sm text-white/75">Still pending</dt>
                    <dd className="font-mono text-lg font-bold">{counts.pending}</dd>
                  </div>
                </dl>
                <p className="mt-5 text-xs leading-5 text-white/65">Closing or refreshing this page clears all local decisions.</p>
              </aside>
            </div>
          </section>
        )}
      </div>

      <p className="sr-only" aria-live="polite">{announcement}</p>
    </>
  );
}

function MappingDetail({
  mapping,
  onApprove,
  onReject,
  onReopen,
}: {
  mapping: MappingSuggestion;
  onApprove: () => void;
  onReject: () => void;
  onReopen: () => void;
}) {
  return (
    <div>
      <div className="border-b border-line p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-muted">Mapping detail</p>
            <h2 id="mapping-detail-title" tabIndex={-1} className="mt-2 break-words font-display text-xl font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {mapping.sourceField} to {mapping.targetField}
            </h2>
          </div>
          <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${statusBadgeStyles[mapping.status]}`}>
            {statusLabels[mapping.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-line">
        <div className="border-r border-line p-4">
          <p className="text-xs text-muted">Source</p>
          <p className="mt-2 break-words font-mono text-sm font-bold text-ink">{mapping.sourceField}</p>
          <p className="mt-1 break-words text-xs text-muted">{mapping.sourceType}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted">Target</p>
          <p className="mt-2 break-words font-mono text-sm font-bold text-ink">{mapping.targetField}</p>
          <p className="mt-1 break-words text-xs text-muted">{mapping.targetType}</p>
        </div>
      </div>

      <div className="border-b border-line p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted">Simulation confidence</p>
            <p className="mt-1 font-mono text-3xl font-bold text-ink">{mapping.confidence}%</p>
          </div>
          <p className="max-w-[12rem] text-right text-xs leading-5 text-muted">Evidence weights are fixed simulation values.</p>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-lg bg-muted-soft" aria-hidden="true">
          <div className="h-full rounded-lg bg-accent" style={{ width: `${mapping.confidence}%` }} />
        </div>
      </div>

      <div className="border-b border-line p-5">
        <h3 className="text-xs font-bold text-muted">Observed evidence</h3>
        <ul className="mt-3 space-y-2">
          {mapping.evidence.map((evidence) => (
            <li key={evidence} className="rounded-lg border-l-2 border-accent bg-accent-soft px-3 py-2 text-xs text-ink">
              {evidence}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-5">
        {mapping.status === "pending" ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onReject}
              className="min-h-11 rounded-lg border border-danger/40 bg-danger-soft px-3 text-sm font-bold text-danger-ink transition-colors hover:border-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Reject mapping
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="min-h-11 rounded-lg bg-ink px-3 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Approve mapping
            </button>
          </div>
        ) : mapping.status === "rejected" ? (
          <button
            type="button"
            onClick={onReopen}
            className="min-h-11 w-full rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Return to pending review
          </button>
        ) : (
          <p className="rounded-lg border border-line-soft bg-canvas px-4 py-3 text-center text-sm leading-6 text-muted">
            Approved mappings are locked after the human decision is recorded.
          </p>
        )}
        <p className="mt-3 text-center text-xs leading-5 text-muted">Local simulation action. No source data is changed.</p>
      </div>
    </div>
  );
}
