from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime

from app.errors import InvalidMappingTransitionError, StaleMappingRevisionError
from app.models import (
    MappingAction,
    MappingReviewEvent,
    MappingReviewRequest,
    MappingStatus,
    MappingSuggestion,
)
from app.repository import SimulationRepository


class MappingReviewService:
    def __init__(
        self,
        repository: SimulationRepository,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self._repository = repository
        self._clock = clock or (lambda: datetime.now(UTC))

    def list_suggestions(
        self,
        status: MappingStatus | None = None,
    ) -> tuple[MappingSuggestion, ...]:
        return self._repository.list_mappings(status=status)

    def get_suggestion(self, suggestion_id: str) -> MappingSuggestion:
        return self._repository.get_mapping(suggestion_id)

    def review(self, suggestion_id: str, request: MappingReviewRequest) -> MappingSuggestion:
        current = self._repository.get_mapping(suggestion_id)
        if current.revision != request.expected_revision:
            raise StaleMappingRevisionError(
                suggestion_id,
                request.expected_revision,
                current.revision,
            )
        target_status = self._target_status(current.status, request.action, suggestion_id)
        recorded_at = self._clock()
        if recorded_at.tzinfo is None:
            recorded_at = recorded_at.replace(tzinfo=UTC)
        else:
            recorded_at = recorded_at.astimezone(UTC)

        review_event = MappingReviewEvent(
            action=request.action,
            from_status=current.status,
            to_status=target_status,
            reviewer=request.reviewer,
            reason=request.reason,
            revision=current.revision + 1,
            recorded_at=recorded_at,
        )
        updated = MappingSuggestion.model_validate(
            {
                **current.model_dump(),
                "status": target_status,
                "revision": current.revision + 1,
                "review_history": (*current.review_history, review_event),
            }
        )
        return self._repository.save_mapping_if_revision(
            updated,
            expected_revision=request.expected_revision,
        )

    @staticmethod
    def _target_status(
        current: MappingStatus,
        action: MappingAction,
        suggestion_id: str,
    ) -> MappingStatus:
        transitions = {
            MappingStatus.PENDING: {
                MappingAction.APPROVE: MappingStatus.APPROVED,
                MappingAction.REJECT: MappingStatus.REJECTED,
            },
            MappingStatus.REJECTED: {
                MappingAction.REOPEN: MappingStatus.PENDING,
            },
            MappingStatus.APPROVED: {},
        }
        try:
            return transitions[current][action]
        except KeyError as error:
            raise InvalidMappingTransitionError(
                suggestion_id,
                current.value,
                action.value,
            ) from error
