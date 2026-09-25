from app.compatibility import CompatibilityEvaluator
from app.models import (
    CompatibilityEvaluationRequest,
    Environment,
    WorkloadProfile,
)
from app.repository import SimulationRepository


def test_customer_graph_simulation_reports_every_blocker() -> None:
    evaluator = CompatibilityEvaluator(SimulationRepository())

    evaluation = evaluator.evaluate(
        CompatibilityEvaluationRequest(
            candidate_version="customer-graph-1.9.0",
            profile=WorkloadProfile.CUSTOMER_GRAPH,
            environment=Environment.PRODUCTION,
            source_timestamps_explicit_utc=False,
        )
    )

    assert evaluation.compatible is False
    assert evaluation.blocking_check_ids == (
        "network-snowflake",
        "simulated-workload-permissions",
        "simulated-timestamp-encoding",
    )


def test_order_profile_passes_with_explicit_utc_and_available_facts() -> None:
    evaluator = CompatibilityEvaluator(SimulationRepository())

    evaluation = evaluator.evaluate(
        CompatibilityEvaluationRequest(
            candidate_version="orders-2.0.0",
            profile=WorkloadProfile.ORDER_ORCHESTRATOR,
            environment=Environment.PRODUCTION,
            source_timestamps_explicit_utc=True,
        )
    )

    assert evaluation.compatible is True
    assert evaluation.blocking_check_ids == ()
    assert {check.id for check in evaluation.checks} >= {
        "network-kafka",
        "simulated-workload-permissions",
        "simulated-timestamp-encoding",
    }
