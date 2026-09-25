"use client";

import { useEffect, useState } from "react";
import { controlPlane } from "@/lib/control-plane";
import { StatusMark } from "@/components/status";

type ConnectionState = "checking" | "connected" | "fixture";

export function ControlPlaneStatus() {
  const [state, setState] = useState<ConnectionState>("checking");

  useEffect(() => {
    let mounted = true;
    controlPlane
      .health()
      .then(() => {
        if (mounted) {
          setState("connected");
        }
      })
      .catch(() => {
        if (mounted) {
          setState("fixture");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div role="status" aria-live="polite" className="mt-5 flex flex-col gap-3 rounded-xl border border-line bg-panel px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold text-accent">Control plane boundary</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          The browser uses the local ACME fixture by default. This status checks the typed FastAPI health boundary; the full API client is available for wiring additional views.
        </p>
      </div>
      <StatusMark
        status={state === "connected" ? "healthy" : state === "fixture" ? "warning" : "investigating"}
        label={state === "connected" ? "API reachable" : state === "fixture" ? "Fixture mode" : "Checking API"}
      />
    </div>
  );
}
