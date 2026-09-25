export type WorkspaceEnvironment = "Production" | "Staging" | "Development";

export type ResourceStatus = "healthy" | "warning" | "critical" | "unknown";

export type MappingStatus = "pending" | "approved" | "rejected";

export type CheckStatus = "pass" | "warning" | "blocked";

export interface EnterpriseResource {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  kind: string;
  environment: WorkspaceEnvironment;
  status: ResourceStatus;
  owner: string;
  description: string;
  dependencies: string[];
  dependents: string[];
  region: string;
  permissions: string[];
  tags: string[];
  x: number;
  y: number;
}

export interface MappingSuggestion {
  id: string;
  source: string;
  sourceTable: string;
  sourceField: string;
  sourceType: string;
  targetField: string;
  targetType: string;
  confidence: number;
  status: MappingStatus;
  evidence: string[];
}

export interface ApiEndpoint {
  id: string;
  service: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  protocol: "REST" | "SOAP";
  auth: string;
  discoveryStatus: "observed" | "needs-review";
  responseFields: Array<{ name: string; type: string; nullable: boolean }>;
}

export interface CompatibilityCheck {
  id: string;
  category: "Infrastructure" | "Network" | "Security" | "Data";
  label: string;
  status: CheckStatus;
  blocking: boolean;
  detail: string;
  remediation: string;
}

export interface DeploymentRecord {
  id: string;
  version: string;
  environment: WorkspaceEnvironment;
  status: "healthy" | "rolled-back";
  startedAt: string;
  requests: string;
  successRate: string;
  p95Latency: string;
  errorRate: string;
  cost: string;
}

export interface IncidentEvidence {
  id: string;
  label: string;
  value: string;
  signal: "change" | "degradation" | "correlation" | "scope";
}

export interface IncidentRecord {
  id: string;
  title: string;
  severity: "High" | "Medium" | "Low";
  state: "Investigating" | "Contained" | "Resolved";
  customer: string;
  startedAt: string;
  detectedAt: string;
  probableCause: string;
  confidence: number;
  affectedServices: string[];
  affectedWorkflows: string[];
  evidence: IncidentEvidence[];
  remediation: string[];
}

export interface LabService {
  id: string;
  name: string;
  technology: string;
  status: ResourceStatus;
  latency: string;
  message: string;
  availableFaults: string[];
}

export interface MemoryPattern {
  id: string;
  title: string;
  provider: string;
  confidence: string;
  deployments: number;
  knownFailures: number;
  lastValidated: string;
  summary: string;
  requirements: string[];
  tests: string[];
  strategy: string;
}
