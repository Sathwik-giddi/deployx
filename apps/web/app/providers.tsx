"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { WorkspaceEnvironment } from "@/lib/types";

interface WorkspaceContextValue {
  environment: WorkspaceEnvironment;
  setEnvironment: (environment: WorkspaceEnvironment) => void;
  isSimulation: true;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironment] = useState<WorkspaceEnvironment>("Production");

  return (
    <WorkspaceContext.Provider value={{ environment, setEnvironment, isSimulation: true }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }

  return context;
}
