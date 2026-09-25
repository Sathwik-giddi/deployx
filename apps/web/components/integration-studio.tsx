"use client";

import { PageHeader } from "@/components/page-header";
import { StatePanel } from "@/components/state-panel";
import { mappingSuggestions } from "@/lib/demo-data";
import type { MappingSuggestion } from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

type TabId = "configuration" | "evidence";
type GenerationState = "idle" | "running" | "ready" | "blocked";
type EvidenceStatus = "pass" | "warning";
type ConfidenceFilter = "all" | "high" | "review";

type RuntimePolicies = {
  writeMode: "upsert" | "insert-only";
  conflictPolicy: "source-wins" | "manual-review";
  nullHandling: "preserve" | "reject";
  timestampPolicy: "utc" | "preserve-source";
  concurrency: "conservative" | "balanced";
};

type ResolvedMapping = {
  id: string;
  sourceField: string;
  sourceType: string;
  targetField: string;
  targetType: string;
  confidence: number;
  evidence: string[];
};

type TestEvidence = {
  id: string;
  name: string;
  detail: string;
  status: EvidenceStatus;
};

const tabs = [
  { id: "configuration", label: "Configuration" },
  { id: "evidence", label: "Test evidence" },
] as const;

const targetOptions = Array.from(new Set(mappingSuggestions.map((mapping) => mapping.targetField))).sort();
const targetTypeByField = new Map(mappingSuggestions.map((mapping) => [mapping.targetField, mapping.targetType]));
const initialTargets: Record<string, string> = Object.fromEntries(mappingSuggestions.map((mapping) => [mapping.id, mapping.targetField]));

const evidenceStyles: Record<EvidenceStatus, string> = {
  pass: "border-ok/40 bg-ok-soft text-ok-ink",
  warning: "border-amber/40 bg-amber-soft text-amber-ink",
};

function mappingMatches(mapping: MappingSuggestion, targetField: string, query: string) {
  return [mapping.source, mapping.sourceTable, mapping.sourceField, mapping.sourceType, targetField, ...mapping.evidence]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function createTestEvidence(
  assignments: ResolvedMapping[],
  policies: RuntimePolicies,
  strictValidation: boolean,
): TestEvidence[] {
  const evidence = assignments.flatMap((mapping): TestEvidence[] => {
    const nullableMapping = mapping.evidence.some((item) => item.includes("null"));
    return [
      {
        id: `${mapping.id}-type`,
        name: `Type contract for ${mapping.sourceField}`,
        detail: `${mapping.sourceType} maps to ${mapping.targetType} at ${mapping.targetField}.`,
        status: mapping.confidence >= 75 ? "pass" : "warning",
      },
      {
        id: `${mapping.id}-policy`,
        name: `Policy behavior for ${mapping.sourceField}`,
        detail: nullableMapping
          ? policies.nullHandling === "preserve"
            ? "Nullable values are preserved by the configured adapter policy."
            : "Nullable values require review because the adapter is configured to reject them."
          : policies.timestampPolicy === "utc"
            ? "Timestamp values normalize to UTC before adapter output."
            : "Source timestamp offsets remain unchanged in this simulation.",
        status:
          (nullableMapping && policies.nullHandling === "reject") ||
          (!nullableMapping && policies.timestampPolicy !== "utc")
            ? "warning"
            : "pass",
      },
    ];
  });

  evidence.push(
    {
      id: "target-uniqueness",
      name: "Canonical target uniqueness",
      detail: "Every source field resolves to a distinct canonical customer target.",
      status: "pass",
    },
    {
      id: "write-mode",
      name: "Write behavior",
      detail: policies.writeMode === "upsert"
        ? "Idempotent upsert mode accepts replayed customer events."
        : "Insert-only mode requires duplicate event handling during migration.",
      status: policies.writeMode === "upsert" ? "pass" : "warning",
    },
    {
      id: "conflict-policy",
      name: "Conflict handling",
      detail: policies.conflictPolicy === "manual-review"
        ? "Conflicting customer records remain pending for an operator decision."
        : "The source customer value replaces the existing canonical value.",
      status: policies.conflictPolicy === "manual-review" ? "pass" : "warning",
    },
    {
      id: "concurrency-policy",
      name: "Concurrency policy",
      detail: policies.concurrency === "conservative"
        ? "Conservative concurrency limits parallel customer writes in the simulation."
        : "Balanced concurrency increases parallel writes and requires queue monitoring.",
      status: policies.concurrency === "conservative" ? "pass" : "warning",
    },
    {
      id: "strict-validation",
      name: "Strict validation",
      detail: strictValidation
        ? "Strict validation rejects records that do not satisfy the selected field mapping."
        : "Lenient validation records nonconforming records for later review.",
      status: strictValidation ? "pass" : "warning",
    },
  );

  return evidence;
}

export function IntegrationStudio() {
  const [query, setQuery] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  const [selectedId, setSelectedId] = useState(mappingSuggestions[0]?.id ?? "");
  const [targetFields, setTargetFields] = useState<Record<string, string>>(initialTargets);
  const [adapterName, setAdapterName] = useState("acme-customer-adapter");
  const [policies, setPolicies] = useState<RuntimePolicies>({
    writeMode: "upsert",
    conflictPolicy: "manual-review",
    nullHandling: "preserve",
    timestampPolicy: "utc",
    concurrency: "conservative",
  });
  const [strictValidation, setStrictValidation] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("configuration");
  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  const [generatedEvidence, setGeneratedEvidence] = useState<TestEvidence[]>([]);
  const [saveVersion, setSaveVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState("Review the simulated ACME field mappings and runtime policies before generating adapter evidence.");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generationTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (generationTimer.current !== null) {
        window.clearTimeout(generationTimer.current);
      }
    },
    [],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const resolvedMappings = useMemo<ResolvedMapping[]>(
    () =>
      mappingSuggestions.map((mapping) => {
        const targetField = targetFields[mapping.id] ?? mapping.targetField;
        return {
          id: mapping.id,
          sourceField: mapping.sourceField,
          sourceType: mapping.sourceType,
          targetField,
          targetType: targetTypeByField.get(targetField) ?? mapping.targetType,
          confidence: mapping.confidence,
          evidence: mapping.evidence,
        };
      }),
    [targetFields],
  );
  const targetCounts = useMemo(() => {
    const counts = new Map<string, number>();
    resolvedMappings.forEach((mapping) => {
      counts.set(mapping.targetField, (counts.get(mapping.targetField) ?? 0) + 1);
    });
    return counts;
  }, [resolvedMappings]);
  const duplicateTargets = useMemo(
    () => Array.from(targetCounts.entries()).filter(([, count]) => count > 1).map(([target]) => target),
    [targetCounts],
  );
  const filteredMappings = useMemo(
    () =>
      mappingSuggestions.filter((mapping) => {
        const targetField = targetFields[mapping.id] ?? mapping.targetField;
        const confidenceMatches =
          confidenceFilter === "all" ||
          (confidenceFilter === "high" && mapping.confidence >= 90) ||
          (confidenceFilter === "review" && mapping.confidence < 90);
        return confidenceMatches && mappingMatches(mapping, targetField, normalizedQuery);
      }),
    [confidenceFilter, normalizedQuery, targetFields],
  );
  const selectedMapping =
    filteredMappings.find((mapping) => mapping.id === selectedId) ?? filteredMappings[0] ?? null;
  const selectedTarget = selectedMapping ? targetFields[selectedMapping.id] ?? selectedMapping.targetField : "";
  const selectedResolved = resolvedMappings.find((mapping) => mapping.id === selectedMapping?.id) ?? null;
  const hasFilters = normalizedQuery.length > 0 || confidenceFilter !== "all";

  useEffect(() => {
    const nextMapping = filteredMappings.find((mapping) => mapping.id === selectedId) ?? filteredMappings[0];
    if (nextMapping) {
      if (nextMapping.id !== selectedId) {
        setSelectedId(nextMapping.id);
      }
      setFeedback(`${nextMapping.sourceField} selected for adapter review.`);
    } else {
      setFeedback("No field mappings match the current filters.");
    }
  }, [filteredMappings, selectedId]);

  const clearFilters = () => {
    setQuery("");
    setConfidenceFilter("all");
    setFeedback("Mapping filters cleared. All simulated ACME fields are visible again.");
  };

  const invalidateConfiguration = (message: string) => {
    if (generationTimer.current !== null) {
      window.clearTimeout(generationTimer.current);
      generationTimer.current = null;
    }
    setDirty(true);
    setGenerationState("idle");
    setGeneratedEvidence([]);
    setFeedback(message);
  };

  const updateTarget = (mapping: MappingSuggestion, targetField: string) => {
    setTargetFields((current) => ({ ...current, [mapping.id]: targetField }));
    invalidateConfiguration(`${mapping.sourceField} now targets ${targetField}. Generate adapter evidence again.`);
  };

  const updatePolicy = <Key extends keyof RuntimePolicies,>(key: Key, value: RuntimePolicies[Key]) => {
    setPolicies((current) => ({ ...current, [key]: value }));
    invalidateConfiguration("Runtime policy changed. Generate adapter evidence again.");
  };

  const saveConfiguration = () => {
    const nextVersion = saveVersion + 1;
    setSaveVersion(nextVersion);
    setDirty(false);
    setFeedback(`Configuration saved as simulation revision ${nextVersion}. No ACME system was changed.`);
  };

  const generateAdapter = () => {
    if (generationState === "running") return;
    if (!adapterName.trim()) {
      setGenerationState("blocked");
      setActiveTab("configuration");
      setFeedback("Enter an adapter name before generating simulation evidence.");
      return;
    }
    if (duplicateTargets.length > 0) {
      setGenerationState("blocked");
      setActiveTab("evidence");
      setFeedback(`Resolve duplicate canonical targets before generation: ${duplicateTargets.join(", ")}.`);
      return;
    }

    if (generationTimer.current !== null) {
      window.clearTimeout(generationTimer.current);
      generationTimer.current = null;
    }
    setGenerationState("running");
    setActiveTab("evidence");
    setFeedback(`Generating ${adapterName} from ${resolvedMappings.length} simulated field mappings.`);
    generationTimer.current = window.setTimeout(() => {
      generationTimer.current = null;
      setGeneratedEvidence(createTestEvidence(resolvedMappings, policies, strictValidation));
      setGenerationState("ready");
      setFeedback(`${adapterName} generated with simulation test evidence. Review the policy warnings before saving.`);
    }, 750);
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
        eyebrow="Integration discovery"
        title="ACME customer adapter"
        description="Configure canonical customer field mappings and runtime policies for the simulated ACME adapter, then generate local test evidence before saving the session configuration."
        simulation={true}
        actions={
          <>
            <button
              type="button"
              onClick={saveConfiguration}
              className="min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Save configuration
            </button>
            <button
              type="button"
              onClick={generateAdapter}
              disabled={generationState === "running"}
              className="min-h-11 rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {generationState === "running" ? "Generating adapter..." : "Generate adapter"}
            </button>
          </>
        }
      />

      <div className="space-y-6">
        <section aria-label="Adapter session state" className="flex flex-col gap-3 rounded-xl border border-line bg-panel px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-accent-soft px-2 py-1 text-xs font-bold text-accent">ACME simulation</span>
            <span className={`rounded-md px-2 py-1 text-xs font-bold ${dirty ? "bg-amber-soft text-amber-ink" : "bg-ok-soft text-ok-ink"}`}>
              {dirty ? "Unsaved changes" : saveVersion > 0 ? `Saved revision ${saveVersion}` : "No saved revision"}
            </span>
            {duplicateTargets.length > 0 ? (
              <span className="rounded-md bg-danger-soft px-2 py-1 text-xs font-bold text-danger-ink">Target collision</span>
            ) : null}
          </div>
          <p className="text-sm text-muted" aria-live="polite">{feedback}</p>
        </section>

        <div className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-muted-soft p-1" role="tablist" aria-label="Adapter workbench views">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const count = tab.id === "configuration" ? resolvedMappings.length : generatedEvidence.length;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`adapter-${tab.id}-tab`}
                aria-selected={isActive}
                aria-controls={`adapter-${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`min-h-11 rounded-lg px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "bg-panel text-ink" : "text-muted hover:bg-surface hover:text-ink"}`}
              >
                {tab.label} <span className="ml-1 font-mono text-xs">{count}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "configuration" ? (
          <section id="adapter-configuration-panel" role="tabpanel" aria-labelledby="adapter-configuration-tab">
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
              <div className="min-w-0 space-y-4">
                <section aria-labelledby="adapter-fields-title" className="overflow-hidden rounded-xl border border-line bg-panel">
                  <div className="border-b border-line p-4 sm:p-5">
                    <h2 id="adapter-fields-title" className="font-display text-xl font-semibold text-ink">Canonical customer fields</h2>
                    <p className="mt-1 text-sm text-muted">Edit the canonical target assigned to each simulated legacy source field.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(14rem,1fr)_12rem]">
                      <div>
                        <label htmlFor="adapter-field-search" className="text-xs font-bold text-muted">Search mappings</label>
                        <input
                          id="adapter-field-search"
                          type="search"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Source field, target, or evidence"
                          className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-muted hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
                        />
                      </div>
                      <div>
                        <label htmlFor="adapter-confidence-filter" className="text-xs font-bold text-muted">Confidence band</label>
                        <select
                          id="adapter-confidence-filter"
                          value={confidenceFilter}
                          onChange={(event) => setConfidenceFilter(event.target.value as ConfidenceFilter)}
                          className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
                        >
                          <option value="all">All confidence values</option>
                          <option value="high">90% and above</option>
                          <option value="review">Below 90%</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3 text-xs text-muted">
                      <p>{filteredMappings.length} of {mappingSuggestions.length} simulation fields shown</p>
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
                  </div>

                  {filteredMappings.length === 0 ? (
                    <div className="p-4 sm:p-5">
                      <StatePanel
                        kind="empty"
                        title="No field mappings match this view"
                        description="The current search or confidence band excludes every simulated ACME source field."
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
                        const resolved = resolvedMappings.find((item) => item.id === mapping.id);
                        if (!resolved) return null;
                        const isSelected = mapping.id === selectedMapping?.id;
                        const hasCollision = (targetCounts.get(resolved.targetField) ?? 0) > 1;
                        return (
                          <article
                            key={mapping.id}
                            className={`grid gap-3 px-4 py-4 transition-colors lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:px-5 ${isSelected ? "bg-accent-soft" : "bg-panel hover:bg-surface"}`}
                          >
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => {
                                setSelectedId(mapping.id);
                                setFeedback(`${mapping.sourceField} selected for adapter review.`);
                              }}
                              className="min-w-0 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-bold text-ink">{mapping.sourceField}</span>
                                <span className="text-muted">to</span>
                                <span className="font-mono text-sm font-bold text-ink">{resolved.targetField}</span>
                                {hasCollision ? (
                                  <span className="rounded-md bg-danger-soft px-2 py-1 text-xs font-bold text-danger-ink">Duplicate target</span>
                                ) : null}
                              </span>
                              <span className="mt-2 block text-xs text-muted">
                                {mapping.source}.{mapping.sourceTable} / {mapping.sourceType} to {resolved.targetType}
                              </span>
                               <span className="mt-2 block font-mono text-xs text-muted">{mapping.confidence}% simulation confidence</span>
                               {isSelected ? <span className="mt-2 block text-xs font-bold text-accent">Selected mapping</span> : null}
                            </button>
                            <div>
                              <label htmlFor={`target-${mapping.id}`} className="text-xs font-bold text-muted">Canonical target</label>
                              <select
                                id={`target-${mapping.id}`}
                                value={resolved.targetField}
                                onChange={(event) => updateTarget(mapping, event.target.value)}
                                className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 font-mono text-xs text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
                              >
                                {targetOptions.map((target) => (
                                  <option key={target} value={target}>{target}</option>
                                ))}
                              </select>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>

                {selectedMapping && selectedResolved ? (
                  <section aria-labelledby="selected-mapping-title" className="rounded-xl border border-line bg-panel p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-muted">Selected field evidence</p>
                        <h2 id="selected-mapping-title" className="mt-2 font-display text-xl font-semibold text-ink">{selectedMapping.sourceField} to {selectedTarget}</h2>
                      </div>
                      <span className="rounded-md bg-amber-soft px-2 py-1 text-xs font-bold text-amber-ink">Review suggestion</span>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-lg border border-line-soft bg-surface p-4">
                        <p className="text-xs font-bold text-muted">Type conversion</p>
                        <p className="mt-2 font-mono text-sm text-ink">{selectedMapping.sourceType} to {selectedResolved.targetType}</p>
                        <p className="mt-2 text-xs leading-5 text-muted">The selected canonical target determines the generated output contract.</p>
                      </div>
                      <div className="rounded-lg border border-line-soft bg-surface p-4">
                        <p className="text-xs font-bold text-muted">Discovery evidence</p>
                        <ul className="mt-2 space-y-2">
                          {selectedMapping.evidence.map((item) => (
                            <li key={item} className="rounded-lg border-l-2 border-accent bg-accent-soft px-3 py-2 text-xs text-ink">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>

              <aside aria-labelledby="runtime-policy-title" className="min-w-0 rounded-xl border border-line bg-panel p-4 sm:p-5 xl:sticky xl:top-20 xl:self-start">
                <h2 id="runtime-policy-title" className="font-display text-xl font-semibold text-ink">Runtime policies</h2>
                <p className="mt-1 text-sm leading-6 text-muted">These settings drive generated simulation evidence only.</p>

                <div className="mt-5">
                  <label htmlFor="adapter-name" className="text-xs font-bold text-muted">Adapter name</label>
                  <input
                    id="adapter-name"
                    type="text"
                    value={adapterName}
                    onChange={(event) => {
                      setAdapterName(event.target.value);
                      invalidateConfiguration("Adapter name changed. Generate adapter evidence again.");
                    }}
                    className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 font-mono text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
                  />
                </div>

                <div className="mt-4 grid gap-4">
                  <PolicySelect
                    id="write-mode"
                    label="Write mode"
                    value={policies.writeMode}
                    options={[
                      { value: "upsert", label: "Idempotent upsert" },
                      { value: "insert-only", label: "Insert only" },
                    ]}
                    onChange={(value) => updatePolicy("writeMode", value as RuntimePolicies["writeMode"])}
                  />
                  <PolicySelect
                    id="conflict-policy"
                    label="Conflict handling"
                    value={policies.conflictPolicy}
                    options={[
                      { value: "manual-review", label: "Send conflicts to review" },
                      { value: "source-wins", label: "Source value wins" },
                    ]}
                    onChange={(value) => updatePolicy("conflictPolicy", value as RuntimePolicies["conflictPolicy"])}
                  />
                  <PolicySelect
                    id="null-handling"
                    label="Null handling"
                    value={policies.nullHandling}
                    options={[
                      { value: "preserve", label: "Preserve null values" },
                      { value: "reject", label: "Reject null values" },
                    ]}
                    onChange={(value) => updatePolicy("nullHandling", value as RuntimePolicies["nullHandling"])}
                  />
                  <PolicySelect
                    id="timestamp-policy"
                    label="Timestamp handling"
                    value={policies.timestampPolicy}
                    options={[
                      { value: "utc", label: "Normalize to UTC" },
                      { value: "preserve-source", label: "Preserve source offset" },
                    ]}
                    onChange={(value) => updatePolicy("timestampPolicy", value as RuntimePolicies["timestampPolicy"])}
                  />
                  <PolicySelect
                    id="concurrency-policy"
                    label="Concurrency"
                    value={policies.concurrency}
                    options={[
                      { value: "conservative", label: "Conservative" },
                      { value: "balanced", label: "Balanced" },
                    ]}
                    onChange={(value) => updatePolicy("concurrency", value as RuntimePolicies["concurrency"])}
                  />
                </div>

                <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-line-soft bg-surface p-3">
                  <input
                    type="checkbox"
                    checked={strictValidation}
                    onChange={(event) => {
                      setStrictValidation(event.target.checked);
                      invalidateConfiguration("Strict validation setting changed. Generate adapter evidence again.");
                    }}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                  <span>
                    <span className="block text-sm font-bold text-ink">Strict validation</span>
                    <span className="mt-1 block text-xs leading-5 text-muted">Reject records that do not satisfy the selected mapping.</span>
                  </span>
                </label>

                <div className="mt-5 rounded-lg border border-line-soft bg-canvas p-4">
                  <p className="text-xs font-bold text-muted">Current configuration</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted">Field mappings</dt>
                      <dd className="font-mono font-bold text-ink">{resolvedMappings.length}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted">Unique targets</dt>
                      <dd className="font-mono font-bold text-ink">{targetCounts.size}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted">Target collisions</dt>
                      <dd className={`font-mono font-bold ${duplicateTargets.length > 0 ? "text-danger-ink" : "text-ok-ink"}`}>{duplicateTargets.length}</dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <section id="adapter-evidence-panel" role="tabpanel" aria-labelledby="adapter-evidence-tab">
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <section aria-labelledby="generated-evidence-title" className="min-w-0 rounded-xl border border-line bg-panel p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 id="generated-evidence-title" className="font-display text-xl font-semibold text-ink">Generated test evidence</h2>
                    <p className="mt-1 text-sm text-muted">Local simulation results for the current field mappings and runtime policies.</p>
                  </div>
                  <span className={`rounded-md px-2 py-1 text-xs font-bold ${generationState === "ready" ? "bg-ok-soft text-ok-ink" : generationState === "blocked" ? "bg-danger-soft text-danger-ink" : "bg-muted-soft text-muted"}`}>
                    {generationState === "ready" ? "Evidence ready" : generationState === "blocked" ? "Generation blocked" : "Not generated"}
                  </span>
                </div>

                {generationState === "running" ? (
                  <div className="mt-5">
                    <StatePanel
                      kind="loading"
                      title="Generating adapter evidence"
                      description="Applying the selected field mappings, target uniqueness rules, and runtime policies in this browser session."
                    />
                  </div>
                ) : generationState === "blocked" ? (
                  <div className="mt-5">
                    <StatePanel
                      kind="error"
                      title="Adapter generation needs attention"
                      description="Resolve the configuration issue shown in the session feedback, then generate the adapter again."
                    />
                  </div>
                ) : generationState === "ready" && generatedEvidence.length > 0 ? (
                  <div className="mt-5 overflow-hidden rounded-lg border border-line-soft">
                    <div className="grid grid-cols-2 border-b border-line-soft bg-muted-soft sm:grid-cols-3">
                      <div className="border-r border-line-soft px-4 py-3">
                        <p className="text-xs text-muted">Tests</p>
                        <p className="mt-1 font-mono text-lg font-bold text-ink">{generatedEvidence.length}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-xs text-muted">Passed</p>
                        <p className="mt-1 font-mono text-lg font-bold text-ok-ink">{generatedEvidence.filter((item) => item.status === "pass").length}</p>
                      </div>
                      <div className="hidden border-l border-line-soft px-4 py-3 sm:block">
                        <p className="text-xs text-muted">Warnings</p>
                        <p className="mt-1 font-mono text-lg font-bold text-amber-ink">{generatedEvidence.filter((item) => item.status === "warning").length}</p>
                      </div>
                    </div>
                    <ul className="divide-y divide-line-soft">
                      {generatedEvidence.map((item) => (
                        <li key={item.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start">
                          <span className={`w-fit rounded-md border px-2 py-1 text-xs font-bold ${evidenceStyles[item.status]}`}>
                            {item.status === "pass" ? "Pass" : "Warning"}
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-ink">{item.name}</h3>
                            <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-5">
                    <StatePanel
                      kind="empty"
                      title="No adapter evidence yet"
                      description="Generate the ACME adapter from the current simulated mappings and runtime policies to create local test evidence."
                    />
                  </div>
                )}
              </section>

              <aside className="rounded-xl border border-line bg-panel p-4 sm:p-5">
                <h2 className="font-display text-xl font-semibold text-ink">Generation snapshot</h2>
                <dl className="mt-4 divide-y divide-line-soft border-y border-line-soft">
                  <div className="py-3">
                    <dt className="text-xs text-muted">Adapter</dt>
                    <dd className="mt-1 break-words font-mono text-sm font-bold text-ink">{adapterName || "Unnamed adapter"}</dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-xs text-muted">Source</dt>
                    <dd className="mt-1 font-mono text-sm font-bold text-ink">legacy_mysql.customer_master</dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-xs text-muted">Target schema</dt>
                    <dd className="mt-1 font-mono text-sm font-bold text-ink">customer canonical</dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-xs text-muted">Write mode</dt>
                    <dd className="mt-1 text-sm font-bold text-ink">{policies.writeMode}</dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-xs text-muted">Conflict policy</dt>
                    <dd className="mt-1 text-sm font-bold text-ink">{policies.conflictPolicy}</dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-xs text-muted">Null policy</dt>
                    <dd className="mt-1 text-sm font-bold text-ink">{policies.nullHandling}</dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-xs text-muted">Concurrency</dt>
                    <dd className="mt-1 text-sm font-bold text-ink">{policies.concurrency}</dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-xs text-muted">Timestamp policy</dt>
                    <dd className="mt-1 text-sm font-bold text-ink">{policies.timestampPolicy}</dd>
                  </div>
                </dl>
                <p className="mt-5 text-xs leading-5 text-muted">Generation updates local evidence only. It does not deploy code or contact an ACME service.</p>
              </aside>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function PolicySelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-bold text-muted">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
