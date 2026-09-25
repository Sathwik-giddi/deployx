"use client";

import { useWorkspace } from "@/app/providers";
import { environments } from "@/lib/demo-data";
import type { WorkspaceEnvironment } from "@/lib/types";

export function EnvironmentSwitcher({ compact = false }: { compact?: boolean }) {
  const { environment, setEnvironment } = useWorkspace();

  return (
    <label className={`relative ${compact ? "block" : "block min-w-0"}`}>
      <span className="sr-only">Workspace environment</span>
      <select
        id="environment-switcher"
        aria-label="Workspace environment"
        value={environment}
        onChange={(event) => setEnvironment(event.target.value as WorkspaceEnvironment)}
        className="h-11 w-full appearance-none rounded-lg border border-line bg-surface px-3 pr-9 text-sm font-semibold text-ink shadow-none outline-none transition-colors hover:border-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
      >
        {environments.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted" aria-hidden="true">
        ▾
      </span>
    </label>
  );
}
