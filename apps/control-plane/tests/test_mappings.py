from datetime import UTC, datetime

import pytest

from app.errors import InvalidMappingTransitionError, StaleMappingRevisionError
from app.mapping_review import MappingReviewService
from app.models import MappingAction, MappingReviewRequest, MappingStatus
from app.repository import SimulationRepository


def fixed_clock() -> datetime:
    return datetime(2026, 3, 14, 15, 0, tzinfo=UTC)


def test_pending_mapping_can_be_approved_once() -> None:
    service = MappingReviewService(SimulationRepository(), clock=fixed_clock)

    approved = service.review(
        "map-customer-id",
        MappingReviewRequest(
            action=MappingAction.APPROVE,
            reviewer="simulation-reviewer",
            expected_revision=1,
        ),
    )

    assert approved.status is MappingStatus.APPROVED
    assert approved.revision == 2
    assert approved.review_history[0].from_status is MappingStatus.PENDING
    assert approved.review_history[0].to_status is MappingStatus.APPROVED

    with pytest.raises(InvalidMappingTransitionError):
        service.review(
            "map-customer-id",
            MappingReviewRequest(
                action=MappingAction.REJECT,
                reviewer="simulation-reviewer",
                expected_revision=2,
                reason="Conflicting simulated review decision.",
            ),
        )


def test_rejected_mapping_can_be_reopened_with_a_reason() -> None:
    service = MappingReviewService(SimulationRepository(), clock=fixed_clock)
    rejected = service.review(
        "map-customer-status",
        MappingReviewRequest(
            action=MappingAction.REJECT,
            reviewer="simulation-reviewer",
            expected_revision=1,
            reason="The simulated business-rule evidence requires review.",
        ),
    )

    reopened = service.review(
        "map-customer-status",
        MappingReviewRequest(
            action=MappingAction.REOPEN,
            reviewer="simulation-reviewer",
            expected_revision=2,
            reason="The simulated source profile was clarified.",
        ),
    )

    assert rejected.status is MappingStatus.REJECTED
    assert reopened.status is MappingStatus.PENDING
    assert reopened.revision == 3
    assert tuple(event.action for event in reopened.review_history) == (
        MappingAction.REJECT,
        MappingAction.REOPEN,
    )


def test_stale_mapping_revision_is_rejected() -> None:
    service = MappingReviewService(SimulationRepository(), clock=fixed_clock)
    service.review(
        "map-customer-email",
        MappingReviewRequest(
            action=MappingAction.APPROVE,
            reviewer="first-reviewer",
            expected_revision=1,
        ),
    )

    with pytest.raises(StaleMappingRevisionError):
        service.review(
            "map-customer-email",
            MappingReviewRequest(
                action=MappingAction.REJECT,
                reviewer="stale-reviewer",
                expected_revision=1,
                reason="This request was based on an earlier simulated revision.",
            ),
        )
