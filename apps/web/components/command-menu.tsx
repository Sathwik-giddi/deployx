"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { navigationGroups } from "@/lib/navigation";

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
}

const commandItems = navigationGroups.flatMap((group) => group.items);

const workQueue = [
  {
    label: "Resolve production blockers",
    description: "Open the current preflight result",
    href: "/deployments",
    code: "PR",
  },
  {
    label: "Review active incident",
    description: "Inspect evidence for DX-1842",
    href: "/incidents",
    code: "IR",
  },
  {
    label: "Inspect customer blast radius",
    description: "Trace dependencies from Customer DB",
    href: "/topology",
    code: "TP",
  },
] as const;

export function CommandMenu({ open, onClose }: CommandMenuProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
      previousFocus.current = null;
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredPages = useMemo(
    () =>
      commandItems.filter((item) =>
        `${item.label} ${item.description}`.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery],
  );
  const filteredWork = useMemo(
    () =>
      workQueue.filter((item) =>
        `${item.label} ${item.description}`.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery],
  );

  if (!open) {
    return null;
  }

  const choose = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
      ),
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-ink/45 px-4 pt-[10vh] backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-menu-title"
        onKeyDown={handleDialogKeyDown}
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-panel shadow-[0_24px_80px_rgba(23,33,31,0.24)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <span className="text-xs font-bold text-accent">CMD</span>
          <h2 id="command-menu-title" className="sr-only">
            Search DEPLOYX
          </h2>
          <input
            ref={inputRef}
            value={query}
            aria-label="Search workspaces and actions"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search workspaces and actions"
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }
              const firstResult = filteredWork[0] ?? filteredPages[0];
              if (firstResult) {
                event.preventDefault();
                choose(firstResult.href);
              }
            }}
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg px-3 text-xs font-bold text-muted transition-colors hover:bg-muted-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Close
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-2">
          <p className="sr-only" aria-live="polite">
            {filteredWork.length + filteredPages.length} command results available.
          </p>
          {filteredWork.length ? (
            <div className="mb-2">
              <p className="px-3 py-2 text-xs font-bold text-muted">Work queue</p>
              {filteredWork.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => choose(item.href)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-bold text-white">
                    {item.code}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">{item.label}</span>
                    <span className="block truncate text-xs text-muted">{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {filteredPages.length ? (
            <div>
              <p className="px-3 py-2 text-xs font-bold text-muted">Go to</p>
              {filteredPages.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => choose(item.href)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-xs font-bold text-ink">
                    {item.short}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">{item.label}</span>
                    <span className="block truncate text-xs text-muted">{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {!filteredPages.length && !filteredWork.length ? (
            <div className="px-4 py-10 text-center">
              <p className="font-display text-xl font-semibold text-ink">No matching command</p>
              <p className="mt-2 text-sm text-muted">Try a workflow or workspace name.</p>
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-line bg-canvas px-4 py-3 text-xs text-muted">
          <span>Searches this simulated workspace</span>
          <span>Enter opens the first result</span>
        </div>
      </section>
    </div>
  );
}
