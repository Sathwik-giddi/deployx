from __future__ import annotations

from typing import Final

from app.compatibility import CompatibilityEvaluator
from app.config import settings
from app.models import (
    BlastRadiusAssessment,
    CanaryPhase,
    CanaryPlan,
    CompatibilityEvaluation,
    CompatibilityEvaluationRequest,
    CompatibilityStatus,
    DeploymentPreflightRequest,
    DeploymentPreflightResult,
    Environment,
    PreflightCheck,
    PreflightDisposition,
    Resource,
    ResourceStatus,
)
from app.repository import SimulationRepository


CANARY_PLAN: Final[CanaryPlan] = CanaryPlan(
    phases=(
        CanaryPhase(
            traffic_percent=1,
            observation_seconds=300,
            max_error_rate_percent=0.5,
            max_p95_latency_ms=300,
        ),
        CanaryPhase(
            traffic_percent=5,
            observation_seconds=300,
            max_error_rate_percent=0.5,
            max_p95_latency_ms=300,
        ),
        CanaryPhase(
            traffic_percent=25,
            observation_seconds=600,
            max_error_rate_percent=0.5,
            max_p95_latency_ms=300,
        ),
        CanaryPhase(
            traffic_percent=50,
            observation_seconds=900,
            max_error_rate_percent=0.5,
            max_p95_latency_ms=300,
        ),
    ),
    notice=(
        "This is a deterministic planning artifact only. The service cannot apply the plan, "
        "observe traffic, promote a release, or roll back infrastructure."
    ),
)


class DeploymentPlanner:
    def __init__(
        self,
        repository: SimulationRepository,
        compatibility_evaluator: CompatibilityEvaluator,
    ) -> None:
        self._repository = repository
        self._compatibility_evaluator = compatibility_evaluator

    def preflight(self, request: DeploymentPreflightRequest) -> DeploymentPreflightResult:
        blast_radius = self._repository.graph.blast_radius(request.target_resource_ids)
        target_resources = tuple(
            self._repository.get_resource(resource_id)
            for resource_id in sorted(set(request.target_resource_ids))
        )
        compatibility = self._compatibility_evaluator.evaluate(
            CompatibilityEvaluationRequest(
                candidate_version=request.candidate_version,
                profile=request.profile,
                environment=request.environment,
                source_timestamps_explicit_utc=request.source_timestamps_explicit_utc,
                additional_permissions=request.additional_permissions,
            )
        )
        checks = self._build_preflight_checks(
            request=request,
            target_resources=target_resources,
            blast_radius=blast_radius,
            compatibility=compatibility,
        )
        blocked = any(
            check.blocking and check.status is CompatibilityStatus.BLOCKED
            for check in checks
        )
        return DeploymentPreflightResult(
            candidate_version=request.candidate_version,
            environment=request.environment,
            disposition=(
                PreflightDisposition.BLOCKED
                if blocked
                else PreflightDisposition.READY_FOR_CANARY_PLANNING
            ),
            blast_radius=blast_radius,
            compatibility=compatibility,
            checks=checks,
            canary_plan=CANARY_PLAN,
            notice=settings.simulation_notice,
        )

    @staticmethod
    def _build_preflight_checks(
        request: DeploymentPreflightRequest,
        target_resources: tuple[Resource, ...],
        blast_radius: BlastRadiusAssessment,
        compatibility: CompatibilityEvaluation,
    ) -> tuple[PreflightCheck, ...]:
        environment_mismatches = tuple(
            resource.id
            for resource in target_resources
            if resource.environment is not request.environment
        )
        critical_targets = tuple(
            resource.id
            for resource in target_resources
            if resource.status in {ResourceStatus.CRITICAL, ResourceStatus.UNKNOWN}
        )
        warning_targets = tuple(
            resource.id
            for resource in target_resources
            if resource.status is ResourceStatus.WARNING
        )
        approval_missing = (
            request.environment is Environment.PRODUCTION
            and request.approval_reference is None
        )
        checks = [
            PreflightCheck(
                id="target-environment",
                label="Simulated target environment",
                status=(
                    CompatibilityStatus.BLOCKED
                    if environment_mismatches
                    else CompatibilityStatus.PASS
                ),
                blocking=bool(environment_mismatches),
                detail=(
                    "Target resources are outside the requested simulation environment: "
                    + ", ".join(environment_mismatches)
                    if environment_mismatches
                    else "All target resources match the requested simulation environment."
                ),
                remediation=(
                    "Select target resources in the requested simulation environment."
                    if environment_mismatches
                    else None
                ),
            ),
            PreflightCheck(
                id="target-health",
                label="Simulated target health",
                status=(
                    CompatibilityStatus.BLOCKED
                    if critical_targets
                    else CompatibilityStatus.WARNING
                    if warning_targets
                    else CompatibilityStatus.PASS
                ),
                blocking=bool(critical_targets),
                detail=self._target_health_detail(critical_targets, warning_targets),
                remediation=(
                    "Resolve simulated critical or unknown target states before planning."
                    if critical_targets
                    else "Review simulated warning states before promotion."
                    if warning_targets
                    else None
                ),
            ),
            PreflightCheck(
                id="blast-radius",
                label="Simulated blast radius",
                status=(
                    CompatibilityStatus.BLOCKED
                    if blast_radius.critical_affected_resource_ids
                    else CompatibilityStatus.PASS
                ),
                blocking=bool(blast_radius.critical_affected_resource_ids),
                detail=(
                    "Critical simulated resources are in the affected set: "
                    + ", ".join(blast_radius.critical_affected_resource_ids)
                    if blast_radius.critical_affected_resource_ids
                    else f"The simulation identifies {len(blast_radius.all_affected_resource_ids)} "
                    "affected resources and no critical affected resources."
                ),
                remediation=(
                    "Reduce the target set or remediate the simulated critical dependency path."
                    if blast_radius.critical_affected_resource_ids
                    else None
                ),
            ),
            PreflightCheck(
                id="simulated-approval-reference",
                label="Simulated production approval reference",
                status=(
                    CompatibilityStatus.BLOCKED
                    if approval_missing
                    else CompatibilityStatus.PASS
                ),
                blocking=approval_missing,
                detail=(
                    "No approval reference was supplied. This simulation does not query or verify "
                    "an external approval system."
                    if approval_missing
                    else "An approval reference is recorded in this request for simulation purposes."
                ),
                remediation=(
                    "Supply a non-secret approval reference for the simulation."
                    if approval_missing
                    else None
                ),
            ),
        ]
        checks.extend(
            PreflightCheck(
                id=check.id,
                label=check.label,
                status=check.status,
                blocking=check.blocking,
                detail=check.detail,
                remediation=check.remediation,
            )
            for check in compatibility.checks
        )
        return tuple(checks)

    @staticmethod
    def _target_health_detail(
        critical_targets: tuple[str, ...],
        warning_targets: tuple[str, ...],
    ) -> str:
        details: list[str] = []
        if critical_targets:
            details.append("critical or unknown: " + ", ".join(critical_targets))
        if warning_targets:
            details.append("warning: " + ", ".join(warning_targets))
        if details:
            return "The simulation reports target resources with " + "; ".join(details) + "."
        return "All target resources are healthy in the simulation."
