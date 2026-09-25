from __future__ import annotations

from typing import Final

from app.models import (
    CompatibilityCategory,
    CompatibilityCheck,
    CompatibilityEvaluation,
    CompatibilityEvaluationRequest,
    CompatibilityStatus,
    Integration,
    WorkloadProfile,
)
from app.repository import SimulationRepository


PROFILE_REQUIREMENTS: Final[
    dict[WorkloadProfile, tuple[tuple[Integration, ...], tuple[str, ...]]]
] = {
    WorkloadProfile.CUSTOMER_GRAPH: (
        (Integration.CUSTOMER_API, Integration.SNOWFLAKE),
        ("orders:write", "warehouse:write"),
    ),
    WorkloadProfile.ORDER_ORCHESTRATOR: (
        (Integration.KAFKA,),
        ("orders:write",),
    ),
    WorkloadProfile.GENERIC: ((), ()),
}


INTEGRATION_REMEDIATION: Final[dict[Integration, str]] = {
    Integration.CUSTOMER_API: "No simulated remediation is required.",
    Integration.SALESFORCE: "Review the simulated connector quota policy before promotion.",
    Integration.SNOWFLAKE: "Add the simulated warehouse route to the egress policy fixture.",
    Integration.KAFKA: "No simulated remediation is required.",
    Integration.OKTA: "No simulated remediation is required.",
}


class CompatibilityEvaluator:
    def __init__(self, repository: SimulationRepository) -> None:
        self._repository = repository

    def evaluate(
        self,
        request: CompatibilityEvaluationRequest,
    ) -> CompatibilityEvaluation:
        integrations, profile_permissions = PROFILE_REQUIREMENTS[request.profile]
        required_permissions = tuple(
            sorted({*profile_permissions, *request.additional_permissions})
        )
        checks: list[CompatibilityCheck] = [
            CompatibilityCheck(
                id="simulated-kubernetes-support",
                category=CompatibilityCategory.INFRASTRUCTURE,
                label="Simulated Kubernetes support policy",
                status=CompatibilityStatus.PASS,
                blocking=False,
                detail=(
                    "The simulation compatibility policy marks Kubernetes 1.31 as supported."
                ),
                remediation="No simulated remediation is required.",
            )
        ]

        for integration in integrations:
            network_status = self._repository.integration_network_status(integration)
            checks.append(
                CompatibilityCheck(
                    id=f"network-{integration.value}",
                    category=CompatibilityCategory.NETWORK,
                    label=f"Simulated {integration.value} network path",
                    status=network_status,
                    blocking=network_status is CompatibilityStatus.BLOCKED,
                    detail=(
                        f"The deterministic simulation marks the {integration.value} path as "
                        f"{network_status.value}."
                    ),
                    remediation=INTEGRATION_REMEDIATION[integration],
                )
            )

        missing_permissions = tuple(
            permission
            for permission in required_permissions
            if not self._repository.has_permission(permission)
        )
        missing_preview = ", ".join(missing_permissions[:5])
        if len(missing_permissions) > 5:
            missing_preview += f" and {len(missing_permissions) - 5} more"
        checks.append(
            CompatibilityCheck(
                id="simulated-workload-permissions",
                category=CompatibilityCategory.SECURITY,
                label="Simulated workload permissions",
                status=(
                    CompatibilityStatus.BLOCKED
                    if missing_permissions
                    else CompatibilityStatus.PASS
                ),
                blocking=bool(missing_permissions),
                detail=(
                    "The simulated workload role is missing: "
                    + missing_preview
                    if missing_permissions
                    else "All permissions required by the simulated profile are present."
                ),
                remediation=(
                    "Bind the missing permissions to the simulated workload role fixture."
                    if missing_permissions
                    else None
                ),
            )
        )

        timestamp_status = (
            CompatibilityStatus.PASS
            if request.source_timestamps_explicit_utc
            else CompatibilityStatus.BLOCKED
        )
        checks.append(
            CompatibilityCheck(
                id="simulated-timestamp-encoding",
                category=CompatibilityCategory.DATA,
                label="Simulated timestamp encoding",
                status=timestamp_status,
                blocking=timestamp_status is CompatibilityStatus.BLOCKED,
                detail=(
                    "The simulation records explicit UTC timestamp handling."
                    if request.source_timestamps_explicit_utc
                    else "The simulation records timestamp handling without an explicit UTC offset."
                ),
                remediation=(
                    None
                    if request.source_timestamps_explicit_utc
                    else "Declare the source timezone and require UTC output in the simulation fixture."
                ),
            )
        )

        blocking_check_ids = tuple(
            check.id for check in checks if check.blocking and check.status is CompatibilityStatus.BLOCKED
        )
        return CompatibilityEvaluation(
            profile=request.profile,
            candidate_version=request.candidate_version,
            environment=request.environment,
            compatible=not blocking_check_ids,
            checks=tuple(checks),
            blocking_check_ids=blocking_check_ids,
        )
