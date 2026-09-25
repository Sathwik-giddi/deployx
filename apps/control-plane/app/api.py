from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.dependencies import (
    CompatibilityEvaluatorDependency,
    DeploymentPlannerDependency,
    IncidentCorrelatorDependency,
    MappingReviewServiceDependency,
    RepositoryDependency,
)
from app.models import (
    BlastRadiusAssessment,
    BlastRadiusRequest,
    CompatibilityEvaluation,
    CompatibilityEvaluationRequest,
    DeploymentPreflightRequest,
    DeploymentPreflightResult,
    GraphTraversal,
    HealthResponse,
    Identifier,
    IncidentCorrelationRequest,
    IncidentCorrelationResult,
    IncidentRecord,
    MappingReviewRequest,
    MappingStatus,
    MappingSuggestion,
    Resource,
    TraversalDirection,
)


router = APIRouter(tags=["simulation"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Read simulation health metadata",
)
def health(repository: RepositoryDependency) -> HealthResponse:
    return HealthResponse(simulation=repository.metadata())


@router.get(
    "/resources",
    response_model=list[Resource],
    summary="List simulated enterprise resources",
)
def list_resources(repository: RepositoryDependency) -> tuple[Resource, ...]:
    return repository.list_resources()


@router.get(
    "/resources/{resource_id}",
    response_model=Resource,
    summary="Read a simulated enterprise resource",
)
def get_resource(
    resource_id: Identifier,
    repository: RepositoryDependency,
) -> Resource:
    return repository.get_resource(resource_id)


@router.get(
    "/resources/{resource_id}/traversal",
    response_model=GraphTraversal,
    summary="Traverse simulated resource dependencies",
)
def traverse_resource_graph(
    resource_id: Identifier,
    repository: RepositoryDependency,
    direction: Annotated[
        TraversalDirection,
        Query(description="Graph direction to traverse from the root resource."),
    ] = TraversalDirection.DEPENDENCIES,
) -> GraphTraversal:
    return repository.graph.traverse(resource_id, direction)


@router.post(
    "/graph/blast-radius",
    response_model=BlastRadiusAssessment,
    summary="Calculate simulated blast radius",
)
def calculate_blast_radius(
    request: BlastRadiusRequest,
    repository: RepositoryDependency,
) -> BlastRadiusAssessment:
    return repository.graph.blast_radius(request.root_resource_ids)


@router.post(
    "/compatibility/evaluations",
    response_model=CompatibilityEvaluation,
    summary="Evaluate simulated workload compatibility",
)
def evaluate_compatibility(
    request: CompatibilityEvaluationRequest,
    evaluator: CompatibilityEvaluatorDependency,
) -> CompatibilityEvaluation:
    return evaluator.evaluate(request)


@router.get(
    "/mappings",
    response_model=list[MappingSuggestion],
    summary="List simulated mapping suggestions",
)
def list_mapping_suggestions(
    service: MappingReviewServiceDependency,
    status: Annotated[
        MappingStatus | None,
        Query(description="Optional simulated review-state filter."),
    ] = None,
) -> tuple[MappingSuggestion, ...]:
    return service.list_suggestions(status=status)


@router.get(
    "/mappings/{suggestion_id}",
    response_model=MappingSuggestion,
    summary="Read a simulated mapping suggestion",
)
def get_mapping_suggestion(
    suggestion_id: Identifier,
    service: MappingReviewServiceDependency,
) -> MappingSuggestion:
    return service.get_suggestion(suggestion_id)


@router.post(
    "/mappings/{suggestion_id}/reviews",
    response_model=MappingSuggestion,
    summary="Review a simulated mapping suggestion",
)
def review_mapping_suggestion(
    suggestion_id: Identifier,
    request: MappingReviewRequest,
    service: MappingReviewServiceDependency,
) -> MappingSuggestion:
    return service.review(suggestion_id, request)


@router.post(
    "/deployments/preflight",
    response_model=DeploymentPreflightResult,
    summary="Plan a simulated deployment preflight",
)
def plan_deployment_preflight(
    request: DeploymentPreflightRequest,
    planner: DeploymentPlannerDependency,
) -> DeploymentPreflightResult:
    return planner.preflight(request)


@router.get(
    "/incidents",
    response_model=list[IncidentRecord],
    summary="List simulated incidents",
)
def list_incidents(
    correlator: IncidentCorrelatorDependency,
) -> tuple[IncidentRecord, ...]:
    return correlator.list_incidents()


@router.get(
    "/incidents/{incident_id}",
    response_model=IncidentRecord,
    summary="Read a simulated incident",
)
def get_incident(
    incident_id: Identifier,
    correlator: IncidentCorrelatorDependency,
) -> IncidentRecord:
    return correlator.get_incident(incident_id)


@router.post(
    "/incidents/{incident_id}/correlations",
    response_model=IncidentCorrelationResult,
    summary="Correlate supplied context with simulated incident evidence",
)
def correlate_incident_evidence(
    incident_id: Identifier,
    request: IncidentCorrelationRequest,
    correlator: IncidentCorrelatorDependency,
) -> IncidentCorrelationResult:
    return correlator.correlate(incident_id, request)
