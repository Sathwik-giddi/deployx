const controlPlaneBase = (process.env.NEXT_PUBLIC_CONTROL_PLANE_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export interface ControlPlaneHealth {
  status: "ok";
  simulation: {
    data_mode: "simulation";
    customer: string;
    repository: string;
    deterministic: boolean;
    connects_to_customer_infrastructure: boolean;
    executes_deployments: boolean;
    notice: string;
  };
}

export interface ControlPlaneResource {
  id: string;
  name: string;
  provider: string;
  kind: string;
  environment: "production" | "staging" | "development";
  status: "healthy" | "warning" | "critical" | "unknown";
  owner: string;
  region: string;
  description: string;
  depends_on: string[];
  permissions: string[];
  tags: string[];
}

export interface ControlPlaneBlastRadius {
  root_resource_ids: string[];
  directly_affected_resource_ids: string[];
  transitively_affected_resource_ids: string[];
  all_affected_resource_ids: string[];
  cycles_detected: string[][];
}

export type ControlPlaneMappingStatus = "pending" | "approved" | "rejected";

export interface ControlPlaneMapping {
  id: string;
  source_system: string;
  source_table: string;
  source_field: string;
  source_type: string;
  target_field: string;
  target_type: string;
  confidence: number;
  status: ControlPlaneMappingStatus;
  evidence: string[];
  revision: number;
  review_history: Array<{
    action: "approve" | "reject" | "reopen";
    from_status: ControlPlaneMappingStatus;
    to_status: ControlPlaneMappingStatus;
    reviewer: string;
    reason: string | null;
    revision: number;
    recorded_at: string;
  }>;
}

export interface ControlPlaneCompatibilityCheck {
  id: string;
  category: "infrastructure" | "network" | "security" | "data";
  label: string;
  status: "pass" | "warning" | "blocked";
  blocking: boolean;
  detail: string;
  remediation: string | null;
}

export interface ControlPlaneCompatibility {
  profile: string;
  candidate_version: string;
  environment: "production" | "staging" | "development";
  compatible: boolean;
  checks: ControlPlaneCompatibilityCheck[];
  blocking_check_ids: string[];
  simulation: true;
  evaluation_method: string;
}

export interface ControlPlaneCompatibilityRequest {
  candidate_version: string;
  profile: "customer_graph" | "order_orchestrator" | "generic";
  environment: "production" | "staging" | "development";
  source_timestamps_explicit_utc: boolean;
  additional_permissions?: string[];
}

export interface ControlPlanePreflightCheck extends ControlPlaneCompatibilityCheck {
  category: "infrastructure" | "network" | "security" | "data";
}

export interface ControlPlanePreflight {
  candidate_version: string;
  environment: "production" | "staging" | "development";
  disposition: "ready_for_canary_planning" | "blocked";
  blast_radius: ControlPlaneBlastRadius;
  compatibility: ControlPlaneCompatibility;
  checks: ControlPlanePreflightCheck[];
  canary_plan: {
    strategy: "canary";
    phases: Array<{
      traffic_percent: number;
      observation_seconds: number;
      max_error_rate_percent: number;
      max_p95_latency_ms: number;
      rollback_on_threshold_breach: true;
    }>;
    automatic_promotion: false;
    execution_supported: false;
    notice: string;
  };
  execution_supported: false;
  execution_performed: false;
  simulation: true;
  notice: string;
}

export interface ControlPlanePreflightRequest {
  candidate_version: string;
  profile: "customer_graph" | "order_orchestrator" | "generic";
  environment: "production" | "staging" | "development";
  target_resource_ids: string[];
  source_timestamps_explicit_utc: boolean;
  approval_reference?: string;
  additional_permissions?: string[];
}

export interface ControlPlaneIncident {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  state: "investigating" | "contained" | "resolved";
  customer: string;
  started_at: string;
  detected_at: string;
  probable_cause: string;
  confidence: number;
  affected_resource_ids: string[];
  affected_workflow_ids: string[];
  related_release_ids: string[];
  evidence: Array<{
    id: string;
    label: string;
    observed_value: string;
    signal: "change" | "degradation" | "correlation" | "scope";
    observed_at: string;
    related_release_ids: string[];
    related_resource_ids: string[];
    related_workflow_ids: string[];
  }>;
  remediation: string[];
  simulation: true;
}

export interface ControlPlaneCorrelationRequest {
  release_ids: string[];
  resource_ids: string[];
  workflow_ids: string[];
}

export interface ControlPlaneCorrelation {
  incident_id: string;
  ranked_evidence: Array<{
    evidence_id: string;
    score: number;
    rationale: string[];
    matched_release_ids: string[];
    matched_resource_ids: string[];
    matched_workflow_ids: string[];
  }>;
  correlated_release_ids: string[];
  correlated_resource_ids: string[];
  correlated_workflow_ids: string[];
  overall_confidence: number;
  correlation_method: string;
  limitations: string[];
  simulation: true;
}

export interface ControlPlaneErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${controlPlaneBase}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let payload: ControlPlaneErrorPayload | undefined;
    try {
      payload = (await response.json()) as ControlPlaneErrorPayload;
    } catch {
      payload = undefined;
    }
    throw new Error(payload?.error?.message ?? `Control plane request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export const controlPlane = {
  health: () => request<ControlPlaneHealth>("/health"),
  resources: () => request<ControlPlaneResource[]>("/resources"),
  blastRadius: (rootResourceIds: string[]) =>
    request<ControlPlaneBlastRadius>("/graph/blast-radius", {
      method: "POST",
      body: JSON.stringify({ root_resource_ids: rootResourceIds }),
    }),
  compatibility: (payload: ControlPlaneCompatibilityRequest) =>
    request<ControlPlaneCompatibility>("/compatibility/evaluations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  mappings: (status?: ControlPlaneMappingStatus) =>
    request<ControlPlaneMapping[]>(`/mappings${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  preflight: (payload: ControlPlanePreflightRequest) =>
    request<ControlPlanePreflight>("/deployments/preflight", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  incidents: () => request<ControlPlaneIncident[]>("/incidents"),
  incident: (incidentId: string) => request<ControlPlaneIncident>(`/incidents/${encodeURIComponent(incidentId)}`),
  correlateIncident: (incidentId: string, payload: ControlPlaneCorrelationRequest) =>
    request<ControlPlaneCorrelation>(`/incidents/${encodeURIComponent(incidentId)}/correlations`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
