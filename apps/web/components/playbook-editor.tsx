"use client";

import { useMemo, useState } from "react";
import { PageHeader, PrimaryLink, SecondaryLink } from "@/components/page-header";
import { StatePanel } from "@/components/state-panel";
import { StatusMark } from "@/components/status";
import { playbookYaml } from "@/lib/demo-data";

const requiredSections = ["customer", "salesforce", "security", "deployment"] as const;

function SectionGuide() {
  return (
    <aside className="rounded-xl border border-line bg-panel p-5" aria-labelledby="guide-title">
      <p className="text-xs font-bold text-accent">Contract guide</p>
      <h2 id="guide-title" className="mt-1 font-display text-2xl font-semibold text-ink">Four control planes</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Keep the policy close to the action it governs. The baseline is a simulation fixture, not a production policy.</p>
      <dl className="mt-5 divide-y divide-line-soft border-y border-line-soft">
        <div className="py-3">
          <dt className="font-mono text-sm font-bold text-ink">customer</dt>
          <dd className="mt-1 text-xs leading-5 text-muted">Names the simulation customer boundary.</dd>
        </div>
        <div className="py-3">
          <dt className="font-mono text-sm font-bold text-ink">salesforce</dt>
          <dd className="mt-1 text-xs leading-5 text-muted">Controls connector concurrency, retries, and cache life.</dd>
        </div>
        <div className="py-3">
          <dt className="font-mono text-sm font-bold text-ink">security</dt>
          <dd className="mt-1 text-xs leading-5 text-muted">Keeps approval and identity requirements explicit.</dd>
        </div>
        <div className="py-3">
          <dt className="font-mono text-sm font-bold text-ink">deployment</dt>
          <dd className="mt-1 text-xs leading-5 text-muted">Defines rollout strategy and the error threshold for rollback.</dd>
        </div>
      </dl>
      <div className="mt-5 border-t border-line-soft pt-4">
        <p className="text-xs font-bold text-muted">Simulation customer</p>
        <p className="mt-1 font-mono text-sm font-bold text-ink">ACME / production fixture</p>
      </div>
    </aside>
  );
}

function RevisionState({ isDirty, issueCount }: { isDirty: boolean; issueCount: number }) {
  if (issueCount > 0) {
    return (
      <StatePanel
        kind="error"
        title="Contract needs review"
        description={`${issueCount} required control ${issueCount === 1 ? "section is" : "sections are"} missing from the current draft.`}
      />
    );
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-5" aria-labelledby="review-title">
      <p className="text-xs font-bold text-accent">Save feedback</p>
      <h2 id="review-title" className="mt-1 font-display text-2xl font-semibold text-ink">Revision state</h2>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusMark status={isDirty ? "pending" : "healthy"} label={isDirty ? "Unsaved" : "Saved"} />
        <StatusMark status="healthy" label="Contract present" />
      </div>
      <dl className="mt-5 space-y-3 border-t border-line-soft pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Working copy</dt>
          <dd className="font-mono font-bold text-ink">{isDirty ? "Modified" : "Baseline"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Contract sections</dt>
          <dd className="font-mono font-bold text-ink">{requiredSections.length - issueCount}/{requiredSections.length}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Destination</dt>
          <dd className="font-mono font-bold text-ink">Browser session</dd>
        </div>
      </dl>
    </section>
  );
}

export default function PlaybookEditor() {
  const [draft, setDraft] = useState(playbookYaml);
  const [savedDraft, setSavedDraft] = useState(playbookYaml);
  const [feedback, setFeedback] = useState("Baseline loaded. Make a change to create a new simulation revision.");
  const [copied, setCopied] = useState(false);

  const issues = useMemo(() => requiredSections.filter((section) => !new RegExp(`^${section}:`, "m").test(draft)), [draft]);
  const isDirty = draft !== savedDraft;
  const lineCount = draft.split("\n").length;

  const updateDraft = (value: string) => {
    setDraft(value);
    setCopied(false);
    setFeedback("Unsaved change in the editor. Save when the control contract is ready.");
  };

  const saveDraft = () => {
    setSavedDraft(draft);
    setFeedback(
      issues.length === 0
        ? "Playbook saved to this browser session. The simulation revision is ready for review."
        : `Draft saved with ${issues.length} review item${issues.length === 1 ? "" : "s"}. Complete the contract before promotion.`,
    );
  };

  const restoreBaseline = () => {
    setDraft(playbookYaml);
    setCopied(false);
    setFeedback("Editor restored to the original simulation baseline.");
  };

  const copyPlaybook = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(draft);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = draft;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      setFeedback("Current playbook copied to the clipboard.");
    } catch {
      setFeedback("Clipboard access is unavailable. Select the editor text and copy it manually.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Policy editor / ACME simulation"
        title="Write the rules before the incident."
        description="Keep deployment, identity, and rollback decisions in one readable contract. This editor stores a local simulation revision only."
        simulation={true}
        actions={
          <>
            <SecondaryLink href="/deployments">Review deployment gate</SecondaryLink>
            <PrimaryLink href="/lab">Open ACME-LAB</PrimaryLink>
          </>
        }
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]" aria-label="Playbook editor workspace">
        <div className="min-w-0 rounded-xl border border-line bg-panel p-4 md:p-6">
          <div className="flex flex-col gap-4 border-b border-line-soft pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
            <div>
              <p className="text-xs font-bold text-accent">Revision surface</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Customer graph policy</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusMark status={issues.length === 0 ? "healthy" : "warning"} label={issues.length === 0 ? "Contract present" : `${issues.length} review items`} />
              <StatusMark status={isDirty ? "pending" : "healthy"} label={isDirty ? "Unsaved" : "Saved"} />
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-line bg-ink">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-4 py-2 font-mono text-xs text-white">
              <span>playbook.yaml</span>
              <span>{lineCount} lines / local draft</span>
            </div>
            <label htmlFor="playbook-editor" className="sr-only">Playbook YAML editor</label>
            <textarea
              id="playbook-editor"
              value={draft}
              onChange={(event) => updateDraft(event.target.value)}
              spellCheck={false}
              wrap="soft"
              className="block min-h-[30rem] w-full resize-y bg-ink px-4 py-4 font-mono text-sm leading-7 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-muted" aria-live="polite">{feedback}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={copyPlaybook}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                {copied ? "Copied" : "Copy YAML"}
              </button>
              <button
                type="button"
                onClick={restoreBaseline}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-bold text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                Restore baseline
              </button>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <SectionGuide />
          <RevisionState isDirty={isDirty} issueCount={issues.length} />
        </div>
      </section>
    </>
  );
}
