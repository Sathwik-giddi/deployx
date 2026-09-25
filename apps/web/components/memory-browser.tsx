"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, PrimaryLink, SecondaryLink } from "@/components/page-header";
import { StatePanel } from "@/components/state-panel";
import { StatusMark } from "@/components/status";
import { memoryPatterns } from "@/lib/demo-data";
import type { MemoryPattern } from "@/lib/types";

const providerOptions = Array.from(new Set(memoryPatterns.map((pattern) => pattern.provider)));
const confidenceOptions = Array.from(new Set(memoryPatterns.map((pattern) => pattern.confidence)));

function PatternConfidence({ confidence }: { confidence: string }) {
  return <StatusMark status={confidence === "High" ? "healthy" : "warning"} label={confidence} />;
}

function PatternRow({ pattern, selected, onSelect }: { pattern: MemoryPattern; selected: boolean; onSelect: () => void }) {
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
            <p className="font-mono text-xs font-bold text-muted">{pattern.provider}</p>
            <h3 className="mt-1 text-base font-bold leading-5 text-ink">{pattern.title}</h3>
          </div>
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${selected ? "bg-accent" : "bg-line"}`} aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm leading-5 text-muted">{pattern.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PatternConfidence confidence={pattern.confidence} />
          <span className="font-mono text-xs font-bold text-muted">{pattern.deployments} deployments</span>
          {selected ? <span className="text-xs font-bold text-accent">Selected pattern</span> : null}
        </div>
      </button>
    </li>
  );
}

function DetailList({ title, items, accent }: { title: string; items: string[]; accent: "accent" | "line" }) {
  return (
    <section>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className={`border-l-2 pl-3 text-sm leading-6 text-muted ${accent === "accent" ? "border-accent" : "border-line"}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function MemoryBrowser() {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [confidence, setConfidence] = useState("all");
  const [selectedId, setSelectedId] = useState(memoryPatterns[0]?.id ?? "");
  const [feedback, setFeedback] = useState("Select a pattern to inspect its controls, tests, and rollout strategy.");

  const filteredPatterns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return memoryPatterns.filter((pattern) => {
      const matchesQuery = normalizedQuery.length === 0 || [pattern.title, pattern.provider, pattern.summary, ...pattern.requirements, ...pattern.tests].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesProvider = provider === "all" || pattern.provider === provider;
      const matchesConfidence = confidence === "all" || pattern.confidence === confidence;
      return matchesQuery && matchesProvider && matchesConfidence;
    });
  }, [confidence, provider, query]);

  useEffect(() => {
    if (!filteredPatterns.some((pattern) => pattern.id === selectedId)) {
      setSelectedId(filteredPatterns[0]?.id ?? "");
    }
  }, [filteredPatterns, selectedId]);

  const selectedPattern = filteredPatterns.find((pattern) => pattern.id === selectedId) ?? null;

  const clearFilters = () => {
    setQuery("");
    setProvider("all");
    setConfidence("all");
    setFeedback("Filters cleared. All simulation patterns are visible again.");
  };

  const selectPattern = (pattern: MemoryPattern) => {
    setSelectedId(pattern.id);
    setFeedback(`${pattern.title} selected. Review the requirements before reusing the strategy.`);
  };

  const copyStrategy = async () => {
    if (!selectedPattern) {
      return;
    }
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(selectedPattern.strategy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = selectedPattern.strategy;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setFeedback("Pattern strategy copied to the clipboard.");
    } catch {
      setFeedback("Clipboard access is unavailable. Select the strategy text and copy it manually.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Pattern memory / ACME simulation archive"
        title="Recall the shape of the last failure."
        description="Search recorded controls, compare deployment evidence, and carry a known pattern into the next rehearsal."
        simulation={true}
        actions={
          <>
            <SecondaryLink href="/deployments">Review deployment plan</SecondaryLink>
            <PrimaryLink href="/lab">Open ACME-LAB</PrimaryLink>
          </>
        }
      />

      <section className="rounded-xl border border-line bg-panel p-4 md:p-6" aria-labelledby="filter-title">
        <div className="flex flex-col gap-4 border-b border-line-soft pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="text-xs font-bold text-accent">Pattern index</p>
            <h2 id="filter-title" className="mt-1 font-display text-2xl font-semibold text-ink">Find a useful starting point</h2>
          </div>
          <p className="font-mono text-xs font-bold text-muted" aria-live="polite">{filteredPatterns.length} of {memoryPatterns.length} patterns visible</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] xl:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted">Search patterns</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search controls or providers"
              className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted">Provider</span>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <option value="all">All providers</option>
              {providerOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted">Confidence</span>
            <select
              value={confidence}
              onChange={(event) => setConfidence(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <option value="all">All confidence</option>
              {confidenceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          {query || provider !== "all" || confidence !== "all" ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Clear filters
            </button>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-dashed border-line px-4 text-sm font-bold text-muted">
              All patterns visible
            </span>
          )}
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]" aria-label="Pattern browser">
        <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-panel">
          <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-4 sm:px-5">
            <div>
              <p className="text-xs font-bold text-accent">Recorded patterns</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-ink">Choose a pattern</h2>
            </div>
            <span className="font-mono text-xs font-bold text-muted">{filteredPatterns.length.toString().padStart(2, "0")}</span>
          </div>
          {filteredPatterns.length > 0 ? (
            <ul className="divide-y divide-line-soft">
              {filteredPatterns.map((pattern) => (
                <PatternRow key={pattern.id} pattern={pattern} selected={pattern.id === selectedId} onSelect={() => selectPattern(pattern)} />
              ))}
            </ul>
          ) : (
            <div className="p-4 sm:p-5">
              <StatePanel kind="empty" title="No matching patterns" description="Try a broader term or clear the current filters to restore the simulation archive." />
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        <div className="min-w-0">
          {selectedPattern ? (
            <article className="rounded-xl border border-line bg-panel p-4 md:p-6" aria-labelledby="pattern-detail-title">
              <div className="flex flex-col gap-4 border-b border-line-soft pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <PatternConfidence confidence={selectedPattern.confidence} />
                    <span className="font-mono text-xs font-bold text-muted">{selectedPattern.provider}</span>
                  </div>
                  <h2 id="pattern-detail-title" className="mt-3 font-display text-3xl font-semibold leading-tight text-ink">{selectedPattern.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{selectedPattern.summary}</p>
                </div>
                <div className="shrink-0 rounded-lg bg-canvas p-3 font-mono text-xs leading-5 text-muted">
                  <span className="block text-xs font-bold">Last validated</span>
                  <span className="mt-1 block text-ink">{selectedPattern.lastValidated}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <DetailList title="Required controls" items={selectedPattern.requirements} accent="accent" />
                <DetailList title="Validation tests" items={selectedPattern.tests} accent="line" />
              </div>

              <section className="mt-5 border-t border-line-soft pt-5" aria-labelledby="strategy-title">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-xs font-bold text-accent">Recorded rollout</p>
                    <h3 id="strategy-title" className="mt-1 font-display text-xl font-semibold text-ink">Strategy</h3>
                  </div>
                  <button
                    type="button"
                    onClick={copyStrategy}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  >
                    Copy strategy
                  </button>
                </div>
                <p className="mt-4 rounded-lg border border-line-soft bg-canvas p-4 text-sm leading-6 text-ink">{selectedPattern.strategy}</p>
              </section>

              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line-soft pt-5 sm:grid-cols-3">
                <div className="rounded-lg bg-canvas p-3">
                  <dt className="text-xs font-bold text-muted">Deployments</dt>
                  <dd className="mt-1 font-mono text-lg font-bold text-ink">{selectedPattern.deployments}</dd>
                </div>
                <div className="rounded-lg bg-canvas p-3">
                  <dt className="text-xs font-bold text-muted">Known failures</dt>
                  <dd className="mt-1 font-mono text-lg font-bold text-ink">{selectedPattern.knownFailures}</dd>
                </div>
                <div className="col-span-2 rounded-lg bg-canvas p-3 sm:col-span-1">
                  <dt className="text-xs font-bold text-muted">Confidence</dt>
                  <dd className="mt-1 font-mono text-lg font-bold text-ink">{selectedPattern.confidence}</dd>
                </div>
              </dl>
            </article>
          ) : (
            <StatePanel kind="empty" title="No pattern selected" description="Choose a recorded pattern to inspect the controls and rollout strategy." />
          )}
        </div>
      </section>

      <p className="mt-5 rounded-lg border border-line-soft bg-canvas px-4 py-3 text-sm leading-6 text-muted" aria-live="polite">{feedback}</p>
    </>
  );
}
