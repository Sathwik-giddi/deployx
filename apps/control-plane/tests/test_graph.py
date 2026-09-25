from app.graph import ResourceGraph
from app.models import Environment, Resource, ResourceStatus, TraversalDirection


def resource(
    resource_id: str,
    depends_on: tuple[str, ...] = (),
) -> Resource:
    return Resource(
        id=resource_id,
        name=f"Simulated {resource_id}",
        provider="Simulation",
        kind="Test resource",
        environment=Environment.PRODUCTION,
        status=ResourceStatus.HEALTHY,
        owner="Test owner",
        region="Simulation",
        description=f"Deterministic simulation resource for {resource_id}.",
        depends_on=depends_on,
    )


def test_traverse_dependencies_returns_stable_depth_layers() -> None:
    graph = ResourceGraph(
        (
            resource("database"),
            resource("api", ("database",)),
            resource("worker", ("api",)),
            resource("console", ("worker",)),
            resource("independent"),
        )
    )

    traversal = graph.traverse("console", TraversalDirection.DEPENDENCIES)

    assert traversal.layers == (("worker",), ("api",), ("database",))
    assert tuple(item.id for item in traversal.resources) == (
        "worker",
        "api",
        "database",
    )


def test_blast_radius_follows_dependents_and_reports_critical_nodes() -> None:
    critical_worker = resource("worker", ("api",)).model_copy(
        update={"status": ResourceStatus.CRITICAL}
    )
    graph = ResourceGraph(
        (
            resource("database"),
            resource("api", ("database",)),
            critical_worker,
            resource("console", ("worker",)),
            resource("independent"),
        )
    )

    assessment = graph.blast_radius(("database",))

    assert assessment.directly_affected_resource_ids == ("api",)
    assert assessment.transitively_affected_resource_ids == ("worker", "console")
    assert assessment.critical_affected_resource_ids == ("worker",)
    assert "independent" not in assessment.all_affected_resource_ids


def test_cycle_does_not_make_traversal_unbounded() -> None:
    graph = ResourceGraph(
        (
            resource("alpha", ("beta",)),
            resource("beta", ("alpha",)),
        )
    )

    traversal = graph.traverse("alpha", TraversalDirection.DEPENDENCIES)

    assert traversal.layers == (("beta",),)
    assert traversal.cycles_detected == (("alpha", "beta"),)
