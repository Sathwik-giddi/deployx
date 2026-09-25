"use client";

import { PageHeader } from "@/components/page-header";
import { StatePanel } from "@/components/state-panel";
import { apiEndpoints } from "@/lib/demo-data";
import type { ApiEndpoint } from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

type DiscoveryState = "idle" | "running" | "complete";
type ReviewFilter = "all" | ApiEndpoint["discoveryStatus"];
type TabId = "schema" | "access";

const tabs = [
  { id: "schema", label: "Response schema" },
  { id: "access", label: "Access evidence" },
] as const;

const methodStyles: Record<ApiEndpoint["method"], string> = {
  GET: "border-line bg-muted-soft text-muted",
  POST: "border-accent/40 bg-accent-soft text-accent",
  PUT: "border-line bg-surface text-ink",
  DELETE: "border-danger/40 bg-danger-soft text-danger-ink",
};

const reviewStyles: Record<ApiEndpoint["discoveryStatus"], string> = {
  observed: "border-ok/40 bg-ok-soft text-ok-ink",
  "needs-review": "border-amber/40 bg-amber-soft text-amber-ink",
};

function endpointMatches(endpoint: ApiEndpoint, query: string) {
  return [endpoint.service, endpoint.method, endpoint.path, endpoint.protocol, endpoint.auth]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function ApiCatalog() {
  const [endpoints, setEndpoints] = useState(apiEndpoints);
  const [query, setQuery] = useState("");
  const [protocol, setProtocol] = useState<"all" | ApiEndpoint["protocol"]>("all");
  const [method, setMethod] = useState<"all" | ApiEndpoint["method"]>("all");
  const [review, setReview] = useState<ReviewFilter>("all");
  const [selectedId, setSelectedId] = useState(apiEndpoints[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<TabId>("schema");
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>("idle");
  const [announcement, setAnnouncement] = useState("API catalog ready.");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const discoveryTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (discoveryTimer.current !== null) {
        window.clearTimeout(discoveryTimer.current);
      }
    },
    [],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredEndpoints = useMemo(
    () =>
      endpoints.filter(
        (endpoint) =>
          (protocol === "all" || endpoint.protocol === protocol) &&
          (method === "all" || endpoint.method === method) &&
          (review === "all" || endpoint.discoveryStatus === review) &&
          endpointMatches(endpoint, normalizedQuery),
      ),
    [endpoints, method, normalizedQuery, protocol, review],
  );
  const selectedEndpoint =
    filteredEndpoints.find((endpoint) => endpoint.id === selectedId) ?? filteredEndpoints[0] ?? null;
  const observedCount = endpoints.filter((endpoint) => endpoint.discoveryStatus === "observed").length;
  const reviewCount = endpoints.length - observedCount;
  const hasFilters =
    normalizedQuery.length > 0 || protocol !== "all" || method !== "all" || review !== "all";

  useEffect(() => {
    const nextEndpoint = filteredEndpoints.find((endpoint) => endpoint.id === selectedId) ?? filteredEndpoints[0];
    if (nextEndpoint) {
      if (nextEndpoint.id !== selectedId) {
        setSelectedId(nextEndpoint.id);
      }
      setAnnouncement(`${nextEndpoint.method} ${nextEndpoint.path} selected.`);
    } else {
      setAnnouncement("No API contracts match the current filters.");
    }
  }, [filteredEndpoints, selectedId]);

  const clearFilters = () => {
    setQuery("");
    setProtocol("all");
    setMethod("all");
    setReview("all");
    setAnnouncement("API filters cleared.");
  };

  const selectEndpoint = (endpoint: ApiEndpoint) => {
    setSelectedId(endpoint.id);
    setAnnouncement(`${endpoint.method} ${endpoint.path} selected.`);
  };

  const toggleReview = (endpoint: ApiEndpoint) => {
    const nextStatus = endpoint.discoveryStatus === "observed" ? "needs-review" : "observed";
    setEndpoints((current) =>
      current.map((item) => (item.id === endpoint.id ? { ...item, discoveryStatus: nextStatus } : item)),
    );
    setAnnouncement(
      `${endpoint.path} ${nextStatus === "needs-review" ? "added to the review queue" : "marked reviewed"}.`,
    );
  };

  const runDiscovery = () => {
    if (discoveryState === "running") return;
    setDiscoveryState("running");
    setAnnouncement("Simulation API discovery started.");
    discoveryTimer.current = window.setTimeout(() => {
      discoveryTimer.current = null;
      setEndpoints((current) =>
        current.map((endpoint) => ({ ...endpoint, discoveryStatus: "observed" as const })),
      );
      setDiscoveryState("complete");
      setAnnouncement("Simulation API discovery completed. All contracts are marked observed.");
    }, 900);
  };

  const resetDiscovery = () => {
    if (discoveryTimer.current !== null) {
      window.clearTimeout(discoveryTimer.current);
      discoveryTimer.current = null;
    }
    setEndpoints(apiEndpoints);
    setDiscoveryState("idle");
    setAnnouncement("API discovery simulation reset to its starting state.");
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
        eyebrow="Interface discovery"
        title="API catalog"
        description="Inspect simulated REST and SOAP contracts discovered for ACME, review response evidence, and move ambiguous contracts through a local discovery decision queue."
        simulation={true}
        actions={
          <>
            {discoveryState !== "idle" ? (
              <button
                type="button"
                onClick={resetDiscovery}
                disabled={discoveryState === "running"}
                className="min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset simulation
              </button>
            ) : null}
            <button
              type="button"
              onClick={runDiscovery}
              disabled={discoveryState === "running"}
              className="min-h-11 rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {discoveryState === "running" ? "Discovering..." : "Run discovery"}
            </button>
          </>
        }
      />

      <div className="space-y-6">
        <section aria-label="API discovery summary" className="rounded-xl border border-line bg-panel">
          <div className="grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-stretch">
            <div className="grid grid-cols-2">
              <div className="border-b border-line-soft px-4 py-4 sm:border-b-0 sm:border-r">
                <p className="text-xs font-bold text-muted">Observed</p>
                <p className="mt-1 font-mono text-2xl font-bold text-ink">{observedCount}</p>
              </div>
              <div className="border-b border-line-soft px-4 py-4 sm:border-b-0">
                <p className="text-xs font-bold text-muted">Needs review</p>
                <p className="mt-1 font-mono text-2xl font-bold text-ink">{reviewCount}</p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:max-w-md" aria-live="polite">
              <span
                className={`h-3 w-3 shrink-0 rounded-sm ${discoveryState === "running" ? "bg-amber" : discoveryState === "complete" ? "bg-ok" : "bg-muted"}`}
                aria-hidden="true"
              />
              <p className="text-sm text-muted">
                {discoveryState === "running"
                  ? "Scanning simulated REST, SOAP, and schema evidence."
                  : discoveryState === "complete"
                    ? "Simulation discovery completed in this browser session."
                    : "The catalog is using supplied demo contracts."}
              </p>
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_29rem]">
          <section aria-labelledby="api-catalog-title" className="min-w-0 overflow-hidden rounded-xl border border-line bg-panel">
            <div className="border-b border-line p-4 sm:p-5">
              <h2 id="api-catalog-title" className="font-display text-xl font-semibold text-ink">Discovered contracts</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_8rem_8rem_10rem]">
                <div>
                  <label htmlFor="api-search" className="text-xs font-bold text-muted">Search catalog</label>
                  <input
                    id="api-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Service, path, or auth"
                    className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-muted hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
                  />
                </div>
                <div>
                  <label htmlFor="protocol-filter" className="text-xs font-bold text-muted">Protocol</label>
                  <select
                    id="protocol-filter"
                    value={protocol}
                    onChange={(event) => setProtocol(event.target.value as "all" | ApiEndpoint["protocol"])}
                    className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
                  >
                    <option value="all">All protocols</option>
                    <option value="REST">REST</option>
                    <option value="SOAP">SOAP</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="method-filter" className="text-xs font-bold text-muted">Method</label>
                  <select
                    id="method-filter"
                    value={method}
                    onChange={(event) => setMethod(event.target.value as "all" | ApiEndpoint["method"])}
                    className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
                  >
                    <option value="all">All methods</option>
                    {(["GET", "POST", "PUT", "DELETE"] as ApiEndpoint["method"][]).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="review-filter" className="text-xs font-bold text-muted">Discovery state</label>
                  <select
                    id="review-filter"
                    value={review}
                    onChange={(event) => setReview(event.target.value as ReviewFilter)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
                  >
                    <option value="all">All states</option>
                    <option value="observed">Observed</option>
                    <option value="needs-review">Needs review</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3 text-xs text-muted">
                <p>{filteredEndpoints.length} of {endpoints.length} simulation contracts shown</p>
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

            {filteredEndpoints.length === 0 ? (
              <div className="p-4 sm:p-5">
                <StatePanel
                  kind="empty"
                  title="No API contracts match this view"
                  description="Discovery may have moved every contract out of this state, or the current filters may be too narrow."
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
                {filteredEndpoints.map((endpoint) => {
                  const isSelected = endpoint.id === selectedEndpoint?.id;
                  return (
                    <button
                      key={endpoint.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => selectEndpoint(endpoint)}
                      className={`grid min-h-24 w-full gap-3 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:grid-cols-[5rem_minmax(0,1fr)_8rem] sm:items-center sm:px-5 ${isSelected ? "bg-accent-soft" : "bg-panel hover:bg-surface"}`}
                    >
                      <span className={`w-fit rounded-md border px-2 py-1 font-mono text-xs font-bold ${methodStyles[endpoint.method]}`}>
                        {endpoint.method}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-sm font-bold text-ink">{endpoint.path}</span>
                        <span className="mt-1 block truncate text-xs text-muted">{endpoint.service} / {endpoint.protocol}</span>
                      </span>
                      <span className={`w-fit rounded-md border px-2 py-1 text-xs font-bold sm:justify-self-end ${reviewStyles[endpoint.discoveryStatus]}`}>
                        {isSelected ? `Selected / ${endpoint.discoveryStatus === "observed" ? "Observed" : "Needs review"}` : endpoint.discoveryStatus === "observed" ? "Observed" : "Needs review"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside aria-labelledby="api-detail-title" className="min-w-0 overflow-hidden rounded-xl border border-line bg-panel xl:sticky xl:top-20 xl:self-start">
            {selectedEndpoint ? (
              <div>
                <div className="border-b border-line p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-1 font-mono text-xs font-bold ${methodStyles[selectedEndpoint.method]}`}>
                      {selectedEndpoint.method}
                    </span>
                    <span className={`rounded-md border px-2 py-1 text-xs font-bold ${reviewStyles[selectedEndpoint.discoveryStatus]}`}>
                      {selectedEndpoint.discoveryStatus === "observed" ? "Observed" : "Needs review"}
                    </span>
                  </div>
                  <h2 id="api-detail-title" className="mt-4 break-words font-mono text-lg font-bold leading-7 text-ink">{selectedEndpoint.path}</h2>
                  <p className="mt-2 text-sm text-muted">{selectedEndpoint.service} / {selectedEndpoint.protocol}</p>
                  <button
                    type="button"
                    onClick={() => toggleReview(selectedEndpoint)}
                    className="mt-5 min-h-11 w-full rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {selectedEndpoint.discoveryStatus === "observed" ? "Send contract to review" : "Mark contract reviewed"}
                  </button>
                </div>

                <div className="grid grid-cols-2 border-b border-line bg-muted-soft p-1" role="tablist" aria-label="API contract details">
                  {tabs.map((tab, index) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        ref={(node) => {
                          tabRefs.current[index] = node;
                        }}
                        type="button"
                        role="tab"
                        id={`api-${tab.id}-tab`}
                        aria-selected={isActive}
                        aria-controls={`api-${tab.id}-panel`}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => setActiveTab(tab.id)}
                        onKeyDown={(event) => handleTabKeyDown(event, index)}
                        className={`min-h-11 rounded-lg px-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "bg-panel text-ink" : "text-muted hover:text-ink"}`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {activeTab === "schema" ? (
                  <div id="api-schema-panel" role="tabpanel" aria-labelledby="api-schema-tab">
                    <div className="flex items-center justify-between border-b border-line px-5 py-3">
                      <h3 className="text-xs font-bold text-muted">Observed response fields</h3>
                      <span className="font-mono text-xs text-muted">{selectedEndpoint.responseFields.length}</span>
                    </div>
                    {selectedEndpoint.responseFields.length > 0 ? (
                      <ul className="divide-y divide-line-soft">
                        {selectedEndpoint.responseFields.map((field) => (
                          <li key={`${field.name}-${field.type}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-5 py-3">
                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm font-bold text-ink">{field.name}</p>
                              <p className="mt-1 font-mono text-xs text-muted">{field.type}</p>
                            </div>
                            <span className="self-start rounded-md border border-line bg-surface px-2 py-1 text-xs font-bold text-muted">
                              {field.nullable ? "Nullable" : "Required"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4">
                        <StatePanel
                          kind="empty"
                          title="No response fields captured"
                          description="This simulated contract has no field-level response evidence."
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div id="api-access-panel" role="tabpanel" aria-labelledby="api-access-tab">
                    <dl className="divide-y divide-line-soft">
                      <div className="px-5 py-4">
                        <dt className="text-xs text-muted">Authentication evidence</dt>
                        <dd className="mt-1 font-bold text-ink">{selectedEndpoint.auth}</dd>
                      </div>
                      <div className="px-5 py-4">
                        <dt className="text-xs text-muted">Protocol boundary</dt>
                        <dd className="mt-1 font-bold text-ink">{selectedEndpoint.protocol}</dd>
                      </div>
                      <div className="px-5 py-4">
                        <dt className="text-xs text-muted">Review state</dt>
                        <dd className="mt-1 font-bold text-ink">
                          {selectedEndpoint.discoveryStatus === "observed" ? "Discovery evidence accepted" : "Discovery evidence needs a human decision"}
                        </dd>
                      </div>
                    </dl>
                    <p className="border-t border-line p-5 text-sm leading-6 text-muted">
                      {selectedEndpoint.protocol === "SOAP"
                        ? "Treat the SOAP envelope and WSDL identity as a separate contract boundary in the simulation."
                        : "Treat the route, method, authentication mode, and response fields as one observed REST contract."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <StatePanel
                  kind="empty"
                  title="No API contract selected"
                  description="Clear a filter to return to the simulated API catalog."
                />
              </div>
            )}
          </aside>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{announcement}</p>
    </>
  );
}
