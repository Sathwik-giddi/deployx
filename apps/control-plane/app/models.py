from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


Identifier = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9._:-]*$",
    ),
]
ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=256)]
LongText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2048)]
Confidence = Annotated[float, Field(ge=0, le=100)]
UnitInterval = Annotated[float, Field(ge=0, le=1)]


class DomainModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class Environment(StrEnum):
    PRODUCTION = "production"
    STAGING = "staging"
    DEVELOPMENT = "development"


class ResourceStatus(StrEnum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


class TraversalDirection(StrEnum):
    DEPENDENCIES = "dependencies"
    DEPENDENTS = "dependents"
    BOTH = "both"


class Resource(DomainModel):
    id: Identifier
    name: ShortText
    provider: ShortText
    kind: ShortText
    environment: Environment
    status: ResourceStatus
    owner: ShortText
    region: ShortText
    description: LongText
    depends_on: tuple[Identifier, ...] = ()
    permissions: tuple[ShortText, ...] = ()
    tags: tuple[ShortText, ...] = ()


class GraphTraversal(DomainModel):
    root_resource_id: Identifier
    direction: TraversalDirection
    resources: tuple[Resource, ...]
    layers: tuple[tuple[Identifier, ...], ...]
    cycles_detected: tuple[tuple[Identifier, ...], ...]


class BlastRadiusRequest(DomainModel):
    root_resource_ids: tuple[Identifier, ...] = Field(min_length=1, max_length=100)


class BlastRadiusAssessment(DomainModel):
    root_resource_ids: tuple[Identifier, ...]
    directly_affected_resource_ids: tuple[Identifier, ...]
    transitively_affected_resource_ids: tuple[Identifier, ...]
    all_affected_resource_ids: tuple[Identifier, ...]
    affected_resources: tuple[Resource, ...]
    layers: tuple[tuple[Identifier, ...], ...]
    critical_affected_resource_ids: tuple[Identifier, ...]
    cycles_detected: tuple[tuple[Identifier, ...], ...]
    simulation: Literal[True] = True


class Integration(StrEnum):
    CUSTOMER_API = "customer_api"
    SALESFORCE = "salesforce"
    SNOWFLAKE = "snowflake"
    KAFKA = "kafka"
    OKTA = "okta"


class WorkloadProfile(StrEnum):
    CUSTOMER_GRAPH = "customer_graph"
    ORDER_ORCHESTRATOR = "order_orchestrator"
    GENERIC = "generic"


class CompatibilityCategory(StrEnum):
    INFRASTRUCTURE = "infrastructure"
    NETWORK = "network"
    SECURITY = "security"
    DATA = "data"


class CompatibilityStatus(StrEnum):
    PASS = "pass"
    WARNING = "warning"
    BLOCKED = "blocked"


class CompatibilityEvaluationRequest(DomainModel):
    candidate_version: ShortText
    profile: WorkloadProfile
    environment: Environment
    source_timestamps_explicit_utc: bool
    additional_permissions: tuple[ShortText, ...] = Field(default=(), max_length=100)


class CompatibilityCheck(DomainModel):
    id: Identifier
    category: CompatibilityCategory
    label: ShortText
    status: CompatibilityStatus
    blocking: bool
    detail: LongText
    remediation: ShortText | None = None


class CompatibilityEvaluation(DomainModel):
    profile: WorkloadProfile
    candidate_version: ShortText
    environment: Environment
    compatible: bool
    checks: tuple[CompatibilityCheck, ...]
    blocking_check_ids: tuple[Identifier, ...]
    simulation: Literal[True] = True
    evaluation_method: Literal["deterministic-simulation-v1"] = "deterministic-simulation-v1"


class MappingStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class MappingAction(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"
    REOPEN = "reopen"


class MappingReviewEvent(DomainModel):
    action: MappingAction
    from_status: MappingStatus
    to_status: MappingStatus
    reviewer: ShortText
    reason: ShortText | None = None
    revision: Annotated[int, Field(ge=2)]
    recorded_at: datetime


class MappingSuggestion(DomainModel):
    id: Identifier
    source_system: Identifier
    source_table: Identifier
    source_field: Identifier
    source_type: ShortText
    target_field: ShortText
    target_type: ShortText
    confidence: Confidence
    status: MappingStatus
    evidence: tuple[ShortText, ...]
    revision: Annotated[int, Field(ge=1)] = 1
    review_history: tuple[MappingReviewEvent, ...] = ()


class MappingReviewRequest(DomainModel):
    action: MappingAction
    reviewer: ShortText
    expected_revision: Annotated[int, Field(ge=1)]
    reason: ShortText | None = None

    @model_validator(mode="after")
    def require_reason_for_non_approval(self) -> "MappingReviewRequest":
        if self.action in {MappingAction.REJECT, MappingAction.REOPEN} and self.reason is None:
            raise ValueError("A reason is required when rejecting or reopening a mapping suggestion.")
        return self


class PreflightDisposition(StrEnum):
    READY_FOR_CANARY_PLANNING = "ready_for_canary_planning"
    BLOCKED = "blocked"


class CanaryPhase(DomainModel):
    traffic_percent: Annotated[int, Field(ge=1, le=100)]
    observation_seconds: Annotated[int, Field(ge=30, le=3600)]
    max_error_rate_percent: Annotated[float, Field(gt=0, le=100)]
    max_p95_latency_ms: Annotated[int, Field(ge=1)]
    rollback_on_threshold_breach: Literal[True] = True


class CanaryPlan(DomainModel):
    strategy: Literal["canary"] = "canary"
    phases: tuple[CanaryPhase, ...]
    automatic_promotion: Literal[False] = False
    execution_supported: Literal[False] = False
    notice: LongText


class PreflightCheck(DomainModel):
    id: Identifier
    label: ShortText
    status: CompatibilityStatus
    blocking: bool
    detail: LongText
    remediation: ShortText | None = None


class DeploymentPreflightRequest(DomainModel):
    candidate_version: ShortText
    profile: WorkloadProfile
    environment: Environment
    target_resource_ids: tuple[Identifier, ...] = Field(min_length=1, max_length=100)
    source_timestamps_explicit_utc: bool
    approval_reference: ShortText | None = None
    additional_permissions: tuple[ShortText, ...] = Field(default=(), max_length=100)


class DeploymentPreflightResult(DomainModel):
    candidate_version: ShortText
    environment: Environment
    disposition: PreflightDisposition
    blast_radius: BlastRadiusAssessment
    compatibility: CompatibilityEvaluation
    checks: tuple[PreflightCheck, ...]
    canary_plan: CanaryPlan
    execution_supported: Literal[False] = False
    execution_performed: Literal[False] = False
    simulation: Literal[True] = True
    notice: LongText


class IncidentSeverity(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IncidentState(StrEnum):
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"


class EvidenceSignal(StrEnum):
    CHANGE = "change"
    DEGRADATION = "degradation"
    CORRELATION = "correlation"
    SCOPE = "scope"


class IncidentEvidence(DomainModel):
    id: Identifier
    label: ShortText
    observed_value: ShortText
    signal: EvidenceSignal
    observed_at: datetime
    related_release_ids: tuple[Identifier, ...] = ()
    related_resource_ids: tuple[Identifier, ...] = ()
    related_workflow_ids: tuple[Identifier, ...] = ()


class IncidentRecord(DomainModel):
    id: Identifier
    title: ShortText
    severity: IncidentSeverity
    state: IncidentState
    customer: Identifier
    started_at: datetime
    detected_at: datetime
    probable_cause: LongText
    confidence: Confidence
    affected_resource_ids: tuple[Identifier, ...]
    affected_workflow_ids: tuple[Identifier, ...]
    related_release_ids: tuple[Identifier, ...]
    evidence: tuple[IncidentEvidence, ...]
    remediation: tuple[LongText, ...]
    simulation: Literal[True] = True


class IncidentCorrelationRequest(DomainModel):
    release_ids: tuple[Identifier, ...] = Field(default=(), max_length=100)
    resource_ids: tuple[Identifier, ...] = Field(default=(), max_length=100)
    workflow_ids: tuple[Identifier, ...] = Field(default=(), max_length=100)


class EvidenceCorrelation(DomainModel):
    evidence_id: Identifier
    score: UnitInterval
    rationale: tuple[ShortText, ...]
    matched_release_ids: tuple[Identifier, ...]
    matched_resource_ids: tuple[Identifier, ...]
    matched_workflow_ids: tuple[Identifier, ...]


class IncidentCorrelationResult(DomainModel):
    incident_id: Identifier
    ranked_evidence: tuple[EvidenceCorrelation, ...]
    correlated_release_ids: tuple[Identifier, ...]
    correlated_resource_ids: tuple[Identifier, ...]
    correlated_workflow_ids: tuple[Identifier, ...]
    overall_confidence: UnitInterval
    correlation_method: Literal["deterministic-simulation-v1"] = "deterministic-simulation-v1"
    limitations: tuple[LongText, ...]
    simulation: Literal[True] = True


class ApiError(DomainModel):
    code: ShortText
    message: LongText
    context: dict[str, str | int | float | bool | None] = Field(default_factory=dict)


class ApiErrorResponse(DomainModel):
    error: ApiError


class SimulationMetadata(DomainModel):
    data_mode: Literal["simulation"] = "simulation"
    customer: Identifier
    repository: Literal["deterministic-in-memory-acme"] = "deterministic-in-memory-acme"
    deterministic: Literal[True] = True
    connects_to_customer_infrastructure: Literal[False] = False
    executes_deployments: Literal[False] = False
    notice: LongText


class HealthResponse(DomainModel):
    status: Literal["ok"] = "ok"
    simulation: SimulationMetadata
