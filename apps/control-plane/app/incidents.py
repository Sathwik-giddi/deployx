from __future__ import annotations

from typing import Final

from app.models import (
    EvidenceCorrelation,
    EvidenceSignal,
    IncidentCorrelationRequest,
    IncidentCorrelationResult,
    IncidentEvidence,
    IncidentRecord,
)
from app.repository import SimulationRepository


SIGNAL_WEIGHTS: Final[dict[EvidenceSignal, float]] = {
    EvidenceSignal.DEGRADATION: 0.35,
    EvidenceSignal.CORRELATION: 0.30,
    EvidenceSignal.CHANGE: 0.25,
    EvidenceSignal.SCOPE: 0.20,
}


class IncidentEvidenceCorrelator:
    def __init__(self, repository: SimulationRepository) -> None:
        self._repository = repository

    def list_incidents(self) -> tuple[IncidentRecord, ...]:
        return self._repository.list_incidents()

    def get_incident(self, incident_id: str) -> IncidentRecord:
        return self._repository.get_incident(incident_id)

    def correlate(
        self,
        incident_id: str,
        request: IncidentCorrelationRequest,
    ) -> IncidentCorrelationResult:
        incident = self._repository.get_incident(incident_id)
        release_ids = set(request.release_ids)
        resource_ids = set(request.resource_ids)
        workflow_ids = set(request.workflow_ids)
        correlations = tuple(
            self._correlate_evidence(
                evidence,
                release_ids=release_ids,
                resource_ids=resource_ids,
                workflow_ids=workflow_ids,
            )
            for evidence in incident.evidence
        )
        ranked = tuple(
            sorted(correlations, key=lambda item: (-item.score, item.evidence_id))
        )
        total_weight = sum(
            SIGNAL_WEIGHTS[evidence.signal] for evidence in incident.evidence
        )
        weighted_score = sum(
            correlation.score * SIGNAL_WEIGHTS[evidence.signal]
            for correlation, evidence in zip(correlations, incident.evidence, strict=True)
        )
        overall_confidence = round(weighted_score / total_weight, 4) if total_weight else 0.0
        return IncidentCorrelationResult(
            incident_id=incident.id,
            ranked_evidence=ranked,
            correlated_release_ids=tuple(
                sorted(
                    {
                        release_id
                        for correlation in correlations
                        for release_id in correlation.matched_release_ids
                    }
                )
            ),
            correlated_resource_ids=tuple(
                sorted(
                    {
                        resource_id
                        for correlation in correlations
                        for resource_id in correlation.matched_resource_ids
                    }
                )
            ),
            correlated_workflow_ids=tuple(
                sorted(
                    {
                        workflow_id
                        for correlation in correlations
                        for workflow_id in correlation.matched_workflow_ids
                    }
                )
            ),
            overall_confidence=overall_confidence,
            limitations=(
                "Scores reflect deterministic simulation evidence only.",
                "No production telemetry, causal inference, or external incident system was consulted.",
            ),
        )

    @staticmethod
    def _correlate_evidence(
        evidence: IncidentEvidence,
        release_ids: set[str],
        resource_ids: set[str],
        workflow_ids: set[str],
    ) -> EvidenceCorrelation:
        matched_release_ids = tuple(
            sorted(set(evidence.related_release_ids) & release_ids)
        )
        matched_resource_ids = tuple(
            sorted(set(evidence.related_resource_ids) & resource_ids)
        )
        matched_workflow_ids = tuple(
            sorted(set(evidence.related_workflow_ids) & workflow_ids)
        )
        score = SIGNAL_WEIGHTS[evidence.signal]
        score += min(0.30, 0.15 * len(matched_release_ids))
        score += min(0.20, 0.10 * len(matched_resource_ids))
        score += min(0.20, 0.10 * len(matched_workflow_ids))
        rationale = [f"Base signal weight for {evidence.signal.value}"]
        if matched_release_ids:
            rationale.append("Matched supplied simulated release identifiers")
        if matched_resource_ids:
            rationale.append("Matched supplied simulated resource identifiers")
        if matched_workflow_ids:
            rationale.append("Matched supplied simulated workflow identifiers")
        return EvidenceCorrelation(
            evidence_id=evidence.id,
            score=round(min(score, 1.0), 4),
            rationale=tuple(rationale),
            matched_release_ids=matched_release_ids,
            matched_resource_ids=matched_resource_ids,
            matched_workflow_ids=matched_workflow_ids,
        )
