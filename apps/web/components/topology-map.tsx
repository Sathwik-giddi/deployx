"use client";

import { PageHeader } from "@/components/page-header";
import { StatePanel } from "@/components/state-panel";
import { graphEdges, resources } from "@/lib/demo-data";
import type { EnterpriseResource, ResourceStatus } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

const statusLabels: Record<ResourceStatus, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
  unknown: "Unknown",
};

const statusBadgeStyles: Record<ResourceStatus, string> = {
  healthy: "border-ok/40 bg-ok-soft text-ok-ink",
  warning: "border-amber/40 bg-amber-soft text-amber-ink",
  critical: "border-danger/40 bg-danger-soft text-danger-ink",
  unknown: "border-line bg-muted-soft text-muted",
};

const statusDotStyles: Record<ResourceStatus, string> = {
  healthy: "bg-ok",
  warning: "bg-amber",
  critical: "bg-danger",
  unknown: "bg-muted",
};

const nodeStyles: Record<ResourceStatus, string> = {
  healthy: "border-line bg-surface text-ink hover:border-ink",
  warning: "border-amber/60 bg-amber-soft text-ink hover:border-amber",
  critical: "border-danger/60 bg-danger-soft text-ink hover:border-danger",
  unknown: "border-line bg-muted-soft text-muted hover:border-ink hover:text-ink",
};

function resourceMatches(resource: EnterpriseResource, query: string) {
  return [
    resource.name,
    resource.shortName,
    resource.provider,
    resource.kind,
    resource.owner,
    resource.region,
    ...resource.tags,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function TopologyMap() {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [status, setStatus] = useState<"all" | ResourceStatus>("all");
  const [kind, setKind] = useState("all");
  const [selectedId, setSelectedId] = useState("acme");
  const [announcement, setAnnouncement] = useState("ACME production estate selected.");
  const resourceDetailRef = useRef<HTMLElement>(null);
  const initialSelection = useRef(true);

  const providers = useMemo(
    () => Array.from(new Set(resources.map((resource) => resource.provider))).sort(),
    [],
  );
  const kinds = useMemo(
    () => Array.from(new Set(resources.map((resource) => resource.kind))).sort(),
    [],
  );
  const resourceById = useMemo(
    () => new Map(resources.map((resource) => [resource.id, resource])),
    [],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          (provider === "all" || resource.provider === provider) &&
          (status === "all" || resource.status === status) &&
          (kind === "all" || resource.kind === kind) &&
          resourceMatches(resource, normalizedQuery),
      ),
    [kind, normalizedQuery, provider, status],
  );
  const visibleIds = useMemo(
    () => new Set(filteredResources.map((resource) => resource.id)),
    [filteredResources],
  );
  const visibleEdges = useMemo(
    () => graphEdges.filter(([from, to]) => visibleIds.has(from) && visibleIds.has(to)),
    [visibleIds],
  );
  const selectedResource =
    filteredResources.find((resource) => resource.id === selectedId) ??
    filteredResources[0] ??
    null;
  const hasFilters =
    normalizedQuery.length > 0 || provider !== "all" || status !== "all" || kind !== "all";

  useEffect(() => {
    const nextResource = filteredResources.find((resource) => resource.id === selectedId) ?? filteredResources[0];
    if (nextResource) {
      if (nextResource.id !== selectedId) {
        setSelectedId(nextResource.id);
      }
      setAnnouncement(`${nextResource.name} selected.`);
    }
    if (filteredResources.length === 0) {
      setAnnouncement("No resources match the current topology filters.");
    }
  }, [filteredResources, selectedId]);

  useEffect(() => {
    if (initialSelection.current) {
      initialSelection.current = false;
      return;
    }
    if (selectedId && window.matchMedia("(max-width: 1279px)").matches) {
      resourceDetailRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      resourceDetailRef.current?.focus({ preventScroll: true });
    }
  }, [selectedId]);

  const statusCounts = useMemo(
    () =>
      resources.reduce(
        (counts, resource) => ({ ...counts, [resource.status]: counts[resource.status] + 1 }),
        { healthy: 0, warning: 0, critical: 0, unknown: 0 } as Record<ResourceStatus, number>,
      ),
    [],
  );

  const clearFilters = () => {
    setQuery("");
    setProvider("all");
    setStatus("all");
    setKind("all");
    setAnnouncement("Topology filters cleared.");
  };

  const selectResource = (id: string) => {
    const resource = resourceById.get(id);
    if (!resource) return;
    setSelectedId(id);
    setAnnouncement(`${resource.name} selected.`);
  };

  const selectRelatedResource = (id: string) => {
    setQuery("");
    setProvider("all");
    setStatus("all");
    setKind("all");
    selectResource(id);
  };

  return (
    <>
      <PageHeader
        eyebrow="Environment discovery"
        title="Production topology"
        description="Trace the simulated ACME production estate, inspect resource ownership, and follow discovered dependencies across providers. All records and relationships are simulation data."
        simulation={true}
      />

      <div className="space-y-6">
        <section aria-labelledby="topology-filters-title" className="rounded-xl border border-line bg-panel">
          <dl className="grid grid-cols-2 border-b border-line-soft md:grid-cols-4">
            {(["healthy", "warning", "critical", "unknown"] as ResourceStatus[]).map((item, index) => (
              <div
                key={item}
                className={`min-w-0 px-4 py-4 ${index < 3 ? "border-r border-line-soft" : ""}`}
              >
                <dt className="text-xs font-bold text-muted">{statusLabels[item]}</dt>
                <dd className="mt-1 font-mono text-2xl font-bold text-ink">{statusCounts[item]}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_10rem_10rem_minmax(0,1fr)_auto] xl:items-end">
            <div>
              <label id="topology-filters-title" htmlFor="topology-search" className="text-xs font-bold text-muted">
                Search environment graph
              </label>
              <input
                id="topology-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Resource, owner, region, or tag"
                className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-muted hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
              />
            </div>
            <div>
              <label htmlFor="provider-filter" className="text-xs font-bold text-muted">Provider</label>
              <select
                id="provider-filter"
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
              >
                <option value="all">All providers</option>
                {providers.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status-filter" className="text-xs font-bold text-muted">Status</label>
              <select
                id="status-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value as "all" | ResourceStatus)}
                className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
              >
                <option value="all">All states</option>
                {(Object.keys(statusLabels) as ResourceStatus[]).map((item) => (
                  <option key={item} value={item}>{statusLabels[item]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="kind-filter" className="text-xs font-bold text-muted">Resource class</label>
              <select
                id="kind-filter"
                value={kind}
                onChange={(event) => setKind(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
              >
                <option value="all">All resource classes</option>
                {kinds.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 text-xs text-muted">
            <p aria-live="polite">
              Showing <span className="font-mono font-bold text-ink">{filteredResources.length}</span> of {resources.length} simulation resources
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Resource status legend">
              {(Object.keys(statusLabels) as ResourceStatus[]).map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-sm ${statusDotStyles[item]}`} aria-hidden="true" />
                  {statusLabels[item]}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <section aria-labelledby="graph-title" className="min-w-0 rounded-xl border border-line bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
              <div>
                <h2 id="graph-title" className="font-display text-xl font-semibold text-ink">Environment graph</h2>
                <p className="mt-1 text-sm text-muted">Connections reflect discovered dependency evidence.</p>
              </div>
              <span className="rounded-md bg-accent-soft px-2 py-1 font-mono text-xs font-bold text-accent">ACME simulation</span>
            </div>

            {filteredResources.length > 0 ? (
              <>
                <div className="relative hidden h-[590px] overflow-hidden rounded-b-xl bg-canvas xl:block">
                  <div className="absolute left-4 top-4 font-mono text-xs text-muted">Local topology view</div>
                  <div className="absolute bottom-4 right-4 font-mono text-xs text-muted">Production boundary</div>
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {visibleEdges.map(([from, to]) => {
                      const source = resourceById.get(from);
                      const target = resourceById.get(to);
                      if (!source || !target) return null;
                      const isCritical = source.status === "critical" || target.status === "critical";
                      const isWarning = source.status === "warning" || target.status === "warning";
                      return (
                        <line
                          key={`${from}-${to}`}
                          x1={source.x}
                          y1={source.y + 2.4}
                          x2={target.x}
                          y2={target.y + 2.4}
                          stroke="currentColor"
                          strokeWidth={isCritical ? 0.55 : 0.3}
                          vectorEffect="non-scaling-stroke"
                          className={isCritical ? "text-danger" : isWarning ? "text-amber" : "text-muted"}
                        />
                      );
                    })}
                  </svg>
                  {filteredResources.map((resource) => {
                    const isSelected = resource.id === selectedResource?.id;
                    return (
                      <button
                        key={resource.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectResource(resource.id)}
                        style={{ left: `${resource.x}%`, top: `calc(${resource.y}% + 12px)` }}
                        className={`absolute min-h-14 min-w-[8.5rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                          isSelected ? "border-accent bg-accent-soft text-ink" : nodeStyles[resource.status]
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${isSelected ? "bg-accent" : statusDotStyles[resource.status]}`} aria-hidden="true" />
                         <span className="truncate text-sm font-bold">{resource.shortName}</span>
                         </span>
                         <span className="mt-1 block truncate text-xs text-current">{isSelected ? "Selected" : resource.kind}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="divide-y divide-line-soft xl:hidden">
                  {filteredResources.map((resource) => {
                    const isSelected = resource.id === selectedResource?.id;
                    return (
                      <button
                        key={resource.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectResource(resource.id)}
                        className={`flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${isSelected ? "bg-accent-soft" : "bg-panel hover:bg-surface"}`}
                      >
                        <span>
                          <span className="block text-sm font-bold text-ink">{resource.shortName}</span>
                          <span className="mt-1 block text-xs text-muted">{resource.kind} / {resource.provider}</span>
                        </span>
                         <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusBadgeStyles[resource.status]}`}>
                           {isSelected ? "Selected" : statusLabels[resource.status]}
                         </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-4 sm:p-5">
                <StatePanel
                  kind="empty"
                  title="No topology nodes match this view"
                  description="The current search and filters exclude every simulated resource. Clear them to restore the ACME production graph."
                />
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>

          <aside ref={resourceDetailRef} tabIndex={-1} aria-labelledby="resource-detail-title" className="min-w-0 scroll-mt-24 rounded-xl border border-line bg-panel">
            {selectedResource ? (
              <div>
                <div className="border-b border-line p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-muted">Selected resource</p>
                      <h2 id="resource-detail-title" className="mt-2 font-display text-xl font-semibold text-ink">{selectedResource.name}</h2>
                    </div>
                    <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${statusBadgeStyles[selectedResource.status]}`}>
                      {statusLabels[selectedResource.status]}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{selectedResource.description}</p>
                </div>

                <dl className="grid grid-cols-2 border-b border-line text-sm">
                  <div className="border-r border-line p-4">
                    <dt className="text-xs text-muted">Owner</dt>
                    <dd className="mt-1 font-bold text-ink">{selectedResource.owner}</dd>
                  </div>
                  <div className="p-4">
                    <dt className="text-xs text-muted">Region</dt>
                    <dd className="mt-1 font-mono font-bold text-ink">{selectedResource.region}</dd>
                  </div>
                  <div className="border-r border-t border-line p-4">
                    <dt className="text-xs text-muted">Environment</dt>
                    <dd className="mt-1 font-bold text-ink">{selectedResource.environment}</dd>
                  </div>
                  <div className="border-t border-line p-4">
                    <dt className="text-xs text-muted">Resource ID</dt>
                    <dd className="mt-1 font-mono font-bold text-ink">{selectedResource.id}</dd>
                  </div>
                </dl>

                <div className="border-b border-line p-4">
                  <h3 className="text-xs font-bold text-muted">Operational tags</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedResource.tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs text-muted">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 p-4 sm:grid-cols-2 xl:grid-cols-1">
                  <ResourceRelations title="Depends on" ids={selectedResource.dependencies} resourceById={resourceById} onSelect={selectRelatedResource} />
                  <ResourceRelations title="Required by" ids={selectedResource.dependents} resourceById={resourceById} onSelect={selectRelatedResource} />
                </div>

                <div className="border-t border-line p-4">
                  <h3 className="text-xs font-bold text-muted">Observed permissions</h3>
                  <ul className="mt-3 space-y-2 font-mono text-xs text-muted">
                    {selectedResource.permissions.map((permission) => <li key={permission}>{permission}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <StatePanel
                  kind="empty"
                  title="No resource selected"
                  description="Adjust the graph filters or clear them to inspect a simulated resource."
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

function ResourceRelations({
  title,
  ids,
  resourceById,
  onSelect,
}: {
  title: string;
  ids: string[];
  resourceById: Map<string, EnterpriseResource>;
  onSelect: (id: string) => void;
}) {
  const related = ids.flatMap((id) => {
    const resource = resourceById.get(id);
    return resource ? [resource] : [];
  });

  return (
    <div>
      <h3 className="text-xs font-bold text-muted">{title}</h3>
      <div className="mt-2 space-y-2">
        {related.length === 0 ? (
          <p className="text-xs text-muted">No recorded relationships</p>
        ) : (
          related.map((resource) => (
            <button
              key={resource.id}
              type="button"
              onClick={() => onSelect(resource.id)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 text-left text-xs font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>{resource.shortName}</span>
              <span className="font-mono text-muted">{resource.kind}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
