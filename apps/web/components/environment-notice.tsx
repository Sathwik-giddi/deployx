"use client";

import { useWorkspace } from "@/app/providers";
import { StatusMark } from "@/components/status";

export function EnvironmentNotice() {
  const { environment, setEnvironment } = useWorkspace();

  if (environment === "Production") {
    return null;
  }

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber bg-amber-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between" role="status">
      <div>
        <p className="text-sm font-bold text-amber-ink">{environment} fixture is not populated</p>
        <p className="mt-1 text-sm leading-6 text-amber-ink">
          This prototype currently carries the ACME production discovery snapshot. Return to Production to inspect the recorded estate.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setEnvironment("Production");
            window.setTimeout(() => document.getElementById("environment-switcher")?.focus(), 0);
          }}
          className="min-h-11 rounded-lg border border-amber px-3 text-sm font-bold text-amber-ink transition-colors hover:bg-amber hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Use Production snapshot
        </button>
        <StatusMark status="warning" label="Fixture boundary" />
      </div>
    </div>
  );
}
