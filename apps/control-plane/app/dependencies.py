from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request

from app.compatibility import CompatibilityEvaluator
from app.deployments import DeploymentPlanner
from app.incidents import IncidentEvidenceCorrelator
from app.mapping_review import MappingReviewService
from app.repository import SimulationRepository


def get_repository(request: Request) -> SimulationRepository:
    repository = getattr(request.app.state, "repository", None)
    if not isinstance(repository, SimulationRepository):
        raise RuntimeError("The simulation repository is not configured on application state.")
    return repository


def get_compatibility_evaluator(
    repository: RepositoryDependency,
) -> CompatibilityEvaluator:
    return CompatibilityEvaluator(repository)


def get_mapping_review_service(
    repository: RepositoryDependency,
) -> MappingReviewService:
    return MappingReviewService(repository)


def get_deployment_planner(
    repository: RepositoryDependency,
    evaluator: CompatibilityEvaluatorDependency,
) -> DeploymentPlanner:
    return DeploymentPlanner(repository, evaluator)


def get_incident_correlator(
    repository: RepositoryDependency,
) -> IncidentEvidenceCorrelator:
    return IncidentEvidenceCorrelator(repository)


RepositoryDependency = Annotated[SimulationRepository, Depends(get_repository)]
CompatibilityEvaluatorDependency = Annotated[
    CompatibilityEvaluator,
    Depends(get_compatibility_evaluator),
]
MappingReviewServiceDependency = Annotated[
    MappingReviewService,
    Depends(get_mapping_review_service),
]
DeploymentPlannerDependency = Annotated[
    DeploymentPlanner,
    Depends(get_deployment_planner),
]
IncidentCorrelatorDependency = Annotated[
    IncidentEvidenceCorrelator,
    Depends(get_incident_correlator),
]
